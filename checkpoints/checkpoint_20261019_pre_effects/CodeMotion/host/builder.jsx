// Code Motion - Native After Effects Builder Engine
// Converts codeflow.json animation datasets into native, editable After Effects compositions.

var CodeMotionBuilder = (function() {

  // Lightweight JSON polyfill for ExtendScript ES3 environment
  var JSON = (function() {
    function parse(text) {
      return eval('(' + text + ')');
    }
    return { parse: parse };
  })();

  // Color Utility: Convert Hex string to AE normalized [r, g, b] (0.0 to 1.0)
  function hexToRgb(hex) {
    if (!hex || typeof hex !== 'string') return [1, 1, 1];
    var c = hex.replace('#', '');
    if (c.length === 3) {
      c = c.charAt(0) + c.charAt(0) + c.charAt(1) + c.charAt(1) + c.charAt(2) + c.charAt(2);
    }
    var num = parseInt(c, 16);
    if (isNaN(num)) return [1, 1, 1];
    return [
      ((num >> 16) & 255) / 255,
      ((num >> 8) & 255) / 255,
      (num & 255) / 255
    ];
  }

  // Convert Cubic Bézier [x1, y1, x2, y2] to After Effects KeyframeEase
  function getEase(easeData, isIncoming, dimIndex) {
    var e = easeData;
    // Handle multi-dimensional ease arrays [[x1, y1, x2, y2], [x1, y1, x2, y2]]
    if (e && e instanceof Array && e.length > 0 && e[0] instanceof Array) {
      e = e[dimIndex || 0] || e[0];
    }
    var influence = 33.33;
    var speed = 0;

    if (e && e instanceof Array && e.length === 4) {
      if (isIncoming) {
        // Incoming ease is influenced by (1 - x2)
        influence = Math.max(0.1, Math.min(100, (1 - e[2]) * 100));
      } else {
        // Outgoing ease is influenced by x1
        influence = Math.max(0.1, Math.min(100, e[0] * 100));
      }
    }
    return new KeyframeEase(speed, influence);
  }

  // Apply Static Value or Animated Keyframes to an AE Property
  function applyProperty(prop, animData, isColor) {
    if (!prop || animData === undefined || animData === null) return;

    // Check if it's an animated object with keyframes { k: [...] }
    if (typeof animData === 'object' && animData.k && animData.k instanceof Array) {
      var keys = animData.k;
      if (keys.length === 0) return;

      // Single static keyframe
      if (keys.length === 1) {
        var v = isColor ? hexToRgb(keys[0].v) : keys[0].v;
        if (v instanceof Array && v.length === 2) {
          if (prop.propertyValueType === PropertyValueType.ThreeD) v = [v[0], v[1], 100];
          else if (prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL) v = [v[0], v[1], 0];
        }
        try { prop.setValue(v); } catch(e) {}
        return;
      }

      // Step 1: Set all values at time
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var val = isColor ? hexToRgb(k.v) : k.v;
        if (val instanceof Array && val.length === 2) {
          if (prop.propertyValueType === PropertyValueType.ThreeD) val = [val[0], val[1], 100];
          else if (prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL) val = [val[0], val[1], 0];
        }
        try {
          prop.setValueAtTime(k.t, val);
        } catch(err) {}
      }

      // Step 2: Set interpolations and easing
      for (var j = 0; j < keys.length; j++) {
        var keyIndex = j + 1; // AE is 1-indexed
        var currKey = keys[j];
        var prevKey = (j > 0) ? keys[j - 1] : null;

        var inEaseDef = prevKey ? prevKey.e : currKey.e;
        var outEaseDef = currKey.e;

        // Determine inType and outType
        var inType = KeyframeInterpolationType.LINEAR;
        if (inEaseDef === 'hold') {
          inType = KeyframeInterpolationType.HOLD;
        } else if (inEaseDef === 'linear') {
          inType = KeyframeInterpolationType.LINEAR;
        } else if (inEaseDef) {
          inType = KeyframeInterpolationType.BEZIER;
        }

        var outType = KeyframeInterpolationType.LINEAR;
        if (outEaseDef === 'hold') {
          outType = KeyframeInterpolationType.HOLD;
        } else if (outEaseDef === 'linear') {
          outType = KeyframeInterpolationType.LINEAR;
        } else if (outEaseDef) {
          outType = KeyframeInterpolationType.BEZIER;
        }

        try {
          prop.setInterpolationTypeAtKey(keyIndex, inType, outType);
        } catch(itErr) {}

        // Apply temporal ease if either incoming or outgoing has Bézier curves
        if (inType === KeyframeInterpolationType.BEZIER || outType === KeyframeInterpolationType.BEZIER) {
          try {
            if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL ||
                prop.propertyValueType === PropertyValueType.TwoD) {
              var inX = getEase(inEaseDef, true, 0);
              var inY = getEase(inEaseDef, true, 1);
              var outX = getEase(outEaseDef, false, 0);
              var outY = getEase(outEaseDef, false, 1);
              prop.setTemporalEaseAtKey(keyIndex, [inX, inY], [outX, outY]);
            } else if (prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL ||
                       prop.propertyValueType === PropertyValueType.ThreeD) {
              var in3X = getEase(inEaseDef, true, 0);
              var in3Y = getEase(inEaseDef, true, 1);
              var in3Z = getEase(inEaseDef, true, 2);
              var out3X = getEase(outEaseDef, false, 0);
              var out3Y = getEase(outEaseDef, false, 1);
              var out3Z = getEase(outEaseDef, false, 2);
              prop.setTemporalEaseAtKey(keyIndex, [in3X, in3Y, in3Z], [out3X, out3Y, out3Z]);
            } else {
              var inS = getEase(inEaseDef, true, 0);
              var outS = getEase(outEaseDef, false, 0);
              prop.setTemporalEaseAtKey(keyIndex, [inS], [outS]);
            }
          } catch(teErr) {}
        }

        // Zero out spatial tangents to prevent AE's wobbly auto-bezier curve overshoot
        if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL) {
          try {
            prop.setSpatialTangentsAtKey(keyIndex, [0, 0], [0, 0]);
          } catch(stErr) {}
        } else if (prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL) {
          try {
            prop.setSpatialTangentsAtKey(keyIndex, [0, 0, 0], [0, 0, 0]);
          } catch(stErr3) {}
        }
      }
    } else {
      // Static scalar or array value
      var finalVal = isColor ? hexToRgb(animData) : animData;
      if (finalVal instanceof Array && finalVal.length === 2) {
        if (prop.propertyValueType === PropertyValueType.ThreeD) finalVal = [finalVal[0], finalVal[1], 100];
        else if (prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL) finalVal = [finalVal[0], finalVal[1], 0];
      }
      try {
        prop.setValue(finalVal);
      } catch(e) {}
    }
  }

  // Create an AE Shape object from a path vertex/tangent definition
  function createShapeFromData(pData) {
    if (!pData) return null;
    var shape = new Shape();
    if (pData.v && pData.v instanceof Array) shape.vertices = pData.v;
    if (pData.i && pData.i instanceof Array) shape.inTangents = pData.i;
    if (pData.o && pData.o instanceof Array) shape.outTangents = pData.o;
    shape.closed = (pData.c !== undefined) ? pData.c : true;
    return shape;
  }

  // Apply Static or Keyframed Vector Path Data to a Path Property (Mask Path or Shape Path)
  function applyPathProperty(prop, pathDef) {
    if (!prop || !pathDef) return;
    if (pathDef.k && pathDef.k instanceof Array) {
      for (var i = 0; i < pathDef.k.length; i++) {
        var k = pathDef.k[i];
        var shp = createShapeFromData(k.v);
        if (shp) {
          try {
            prop.setValueAtTime(k.t, shp);
          } catch(e) {}
        }
      }
      for (var j = 0; j < pathDef.k.length; j++) {
        var keyIndex = j + 1;
        var kData = pathDef.k[j];
        if (kData.e === 'hold') {
          try { prop.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD); } catch(e) {}
        } else if (kData.e === 'linear') {
          try { prop.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR); } catch(e) {}
        }
      }
    } else if (pathDef.v && pathDef.v instanceof Array) {
      var shpStatic = createShapeFromData(pathDef);
      if (shpStatic) {
        try {
          prop.setValue(shpStatic);
        } catch(e) {}
      }
    }
  }

  // Apply Vector Masks to a layer (for rounded corners, circular avatars, clipping paths)
  function applyMasks(layer, masks) {
    if (!layer || !masks || !(masks instanceof Array) || masks.length === 0) return;

    for (var m = 0; m < masks.length; m++) {
      var mDef = masks[m];
      if (mDef && mDef.path) {
        try {
          var maskGroup = layer.property("ADBE Mask Parade") || layer.property("Masks") || layer.Masks;
          var newMask = maskGroup.addProperty("ADBE Mask Atom") || maskGroup.addProperty("Mask");
          var maskPathProp = newMask.property("ADBE Mask Shape") || newMask.property("Mask Path") || newMask.property(1);

          applyPathProperty(maskPathProp, mDef.path);

          if (mDef.mode === 'subtract') {
            newMask.maskMode = MaskMode.SUBTRACT;
          } else if (mDef.mode === 'intersect') {
            newMask.maskMode = MaskMode.INTERSECT;
          } else {
            newMask.maskMode = MaskMode.ADD;
          }

          if (mDef.inverted) newMask.inverted = true;
          if (mDef.opacity !== undefined) applyProperty(newMask.property("ADBE Mask Opacity") || newMask.property("Mask Opacity"), mDef.opacity);
          if (mDef.feather) applyProperty(newMask.property("ADBE Mask Feather") || newMask.property("Mask Feather"), mDef.feather);
        } catch(maskErr) {}
      }
    }
  }

  // Extract static resting/final value from property (handles keyframe arrays { k: [...] })
  function getFinalValue(prop) {
    if (!prop) return null;
    if (typeof prop === 'object' && prop.k && prop.k instanceof Array && prop.k.length > 0) {
      return prop.k[prop.k.length - 1].v;
    }
    return prop;
  }

  // Verify if a child layer's scale curve is purely an artifact of container scaling
  // or if the child has its own independent animation (e.g. rising bar chart, pulsating icon)
  function isScaleCurveMatching(childScaleKeys, contScaleKeys) {
    if (!childScaleKeys || childScaleKeys.length < 2 || !contScaleKeys || contScaleKeys.length < 2) return false;
    var cLast = childScaleKeys[childScaleKeys.length - 1].v;
    var pLast = contScaleKeys[contScaleKeys.length - 1].v;
    if (!cLast || !pLast) return false;
    if (cLast[0] === 0 || cLast[1] === 0 || pLast[0] === 0 || pLast[1] === 0) return false;

    for (var i = 0; i < childScaleKeys.length; i++) {
      var ck = childScaleKeys[i];
      var cNormX = ck.v[0] / cLast[0];
      var cNormY = ck.v[1] / cLast[1];

      // If child scales asymmetrically (e.g. scaleY grows while scaleX is constant, like bar charts)
      // then it is an intentional independent animation!
      if (Math.abs(cNormX - cNormY) > 0.08) {
        return false;
      }

      // Check if normalized scale matches container at that timestamp
      for (var j = 0; j < contScaleKeys.length; j++) {
        var pk = contScaleKeys[j];
        if (Math.abs(pk.t - ck.t) < 0.05) {
          var pNormX = pk.v[0] / pLast[0];
          if (Math.abs(cNormX - pNormX) > 0.1) {
            return false;
          }
          break;
        }
      }
    }
    return true;
  }

  // Harmonize parent-child hierarchies in group compositions
  // Prevents nested elements from drifting / desynchronizing during container scale animations
  function harmonizeCompLayers(compDef) {
    if (!compDef || !compDef.layers || compDef.layers.length <= 1) return;
    var layers = compDef.layers;

    // Look for background container shape layer with animated scale
    var containerIdx = -1;
    for (var i = layers.length - 1; i >= 0; i--) {
      var l = layers[i];
      var hasScaleAnim = l.transform && l.transform.scale && l.transform.scale.k && l.transform.scale.k.length > 1;
      if (hasScaleAnim && l.type === 'shape') {
        containerIdx = i;
        break;
      }
    }
    if (containerIdx === -1) return;

    var containerDef = layers[containerIdx];
    var contScaleKeys = containerDef.transform.scale.k;
    var tStart = contScaleKeys[0].t;
    var tEnd = contScaleKeys[contScaleKeys.length - 1].t;

    var contPos = getFinalValue(containerDef.transform.position) || [0, 0];
    var contAnchor = getFinalValue(containerDef.transform.anchor) || [0, 0];

    for (var j = 0; j < layers.length; j++) {
      if (j === containerIdx) continue;
      var child = layers[j];
      var cScaleKeys = (child.transform && child.transform.scale && child.transform.scale.k) || null;
      if (!cScaleKeys || cScaleKeys.length < 2) continue;

      var cStart = cScaleKeys[0].t;
      var cEnd = cScaleKeys[cScaleKeys.length - 1].t;

      // Check if scale animation timing matches container (within 0.05s tolerance)
      if (Math.abs(cStart - tStart) < 0.05 && Math.abs(cEnd - tEnd) < 0.05) {
        // Only harmonize if child's scale curve is an exact duplicate of container scale
        // Never strip independent animations (like bar charts rising or pulsating icons)!
        if (!isScaleCurveMatching(cScaleKeys, contScaleKeys)) {
          continue;
        }

        var childFinalPos = getFinalValue(child.transform.position);
        var childFinalScale = getFinalValue(child.transform.scale) || [100, 100];

        if (childFinalPos && contPos) {
          var localX = childFinalPos[0] - contPos[0] + (contAnchor[0] || 0);
          var localY = childFinalPos[1] - contPos[1] + (contAnchor[1] || 0);
          var localPos = [localX, localY];
          if (childFinalPos.length > 2) {
            localPos.push((childFinalPos[2] || 0) - (contPos[2] || 0) + (contAnchor[2] || 0));
          }

          // Assign parenting metadata and replace phantom motion with static local offsets
          child._parentIdx = containerIdx;
          child._localPos = localPos;
          child._localScale = childFinalScale;
        }
      }
    }
  }

  // Topological sorting of comps so nested precomps are created before parent comps
  function sortComps(comps) {
    var compMap = {};
    for (var i = 0; i < comps.length; i++) {
      compMap[comps[i].id] = comps[i];
    }

    var visited = {};
    var sorted = [];

    function visit(comp) {
      if (!comp || visited[comp.id]) return;
      visited[comp.id] = true;

      if (comp.layers) {
        for (var l = 0; l < comp.layers.length; l++) {
          var layer = comp.layers[l];
          if (layer.precomp && layer.precomp.comp && compMap[layer.precomp.comp]) {
            visit(compMap[layer.precomp.comp]);
          }
        }
      }
      sorted.push(comp);
    }

    for (var j = 0; j < comps.length; j++) {
      visit(comps[j]);
    }
    return sorted;
  }

  // String Trim Helper for ExtendScript ES3
  function trimStr(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/^\s+|\s+$/g, '');
  }

  // Intelligent Layer Name Sanitizer
  // Converts raw CSS selectors, DOM tags, and cryptic machine IDs into clean AE layer names
  function formatLayerName(lDef, compDef, occurrenceCount, totalOccurrences) {
    if (!lDef) return "Layer";
    var rawName = lDef.name || "";

    // 0. Explicit Custom Names (data-name / data-ae-name / title)
    if (lDef.dataName && typeof lDef.dataName === 'string') return trimStr(lDef.dataName);
    if (lDef.aeName && typeof lDef.aeName === 'string') return trimStr(lDef.aeName);
    if (lDef.customName && typeof lDef.customName === 'string') return trimStr(lDef.customName);
    if (lDef.title && typeof lDef.title === 'string' && lDef.title.length > 0) return trimStr(lDef.title);

    // 1. Text Layers: prioritize the real text content
    if (lDef.type === 'text' || lDef.text) {
      var txt = (lDef.text && (lDef.text.content || lDef.text.text)) || rawName;
      if (typeof txt === 'string') {
        txt = txt.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');
        txt = trimStr(txt);
        if (txt.length > 32) {
          txt = trimStr(txt.substring(0, 30)) + '...';
        }
        if (txt.length > 0 && txt !== 'div' && txt !== 'span' && txt !== 'p') {
          return txt;
        }
      }
    }

    // 2. Camera Layers
    if (lDef.type === 'camera') {
      return "Camera";
    }

    // 3. Common generic web tags
    var lower = trimStr(rawName).toLowerCase();
    var baseName = "";

    if (lower === 'body') {
      baseName = "Background (Body)";
    } else if (lower === 'html') {
      baseName = "Base (HTML)";
    } else if (lower === '#stage') {
      baseName = "Stage";
    } else if (lower === 'path') {
      baseName = "Vector Path";
    } else if (lower === 'circle') {
      baseName = "Circle Shape";
    } else if (lower === 'polygon') {
      baseName = "Polygon Shape";
    } else if (lower === 'svg') {
      baseName = "Vector Graphic";
    } else if (lower === 'div clip') {
      baseName = "Masked Container";
    } else if (lower === 'div') {
      if (lDef.shapes && lDef.shapes instanceof Array && lDef.shapes.length > 0) {
        var sh = lDef.shapes[0];
        if (sh.kind === 'rect' || sh.kind === 'box') {
          if (sh.roundness && sh.roundness > 0) baseName = "Rounded Card";
          else if (sh.stroke && !sh.fill) baseName = "Border Frame";
          else baseName = "Rectangle Shape";
        } else if (sh.kind === 'ellipse' || sh.kind === 'circle') {
          baseName = "Circle Shape";
        } else {
          baseName = "Shape Layer";
        }
      } else {
        baseName = "Container";
      }
    }

    // 4. Clean CSS selector symbols (# and .) if not matched above
    if (!baseName) {
      var s = rawName;

      var is3D = false;
      if (s.indexOf('(3D)') !== -1) {
        is3D = true;
        s = s.replace('(3D)', '');
      }
      if (s.indexOf('(3D scene)') !== -1) {
        is3D = true;
        s = s.replace('(3D scene)', '');
      }
      if (s.indexOf('(group)') !== -1) {
        s = s.replace('(group)', 'Group');
      }

      // Handle compound selectors e.g. #wcol11.wave-col or #scrubPin.scrub-pin
      if (s.indexOf('#') !== -1 && s.indexOf('.') !== -1) {
        var dotIdx = s.indexOf('.');
        var idPart = trimStr(s.substring(0, dotIdx).replace('#', ''));
        var classPart = trimStr(s.substring(dotIdx + 1));

        var numMatch = idPart.match(/\d+$/);
        if (numMatch) {
          s = classPart + ' ' + numMatch[0];
        } else if (classPart.toLowerCase().indexOf('shadow') !== -1 || classPart.toLowerCase().indexOf('glow') !== -1) {
          s = classPart;
        } else if (idPart && idPart.length > 2) {
          s = idPart;
        } else {
          s = classPart;
        }
      } else {
        s = s.replace(/^[#.]+/, '');
      }

      // Replace common CSS abbreviations
      s = s.replace(/\bbtn\b/gi, 'Button');
      s = s.replace(/\bwcol\b/gi, 'Wave Col');

      // Convert kebab-case and snake_case to spaces
      s = s.replace(/[-_]+/g, ' ');

      // Convert camelCase to space separated
      s = s.replace(/([a-z])([A-Z])/g, '$1 $2');

      // Title Case conversion
      var words = s.split(/\s+/);
      var titleWords = [];
      for (var w = 0; w < words.length; w++) {
        var word = words[w];
        if (word.length === 0) continue;
        if (word === word.toUpperCase() && word.length <= 4) {
          titleWords.push(word);
        } else {
          titleWords.push(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
        }
      }
      s = titleWords.join(' ');

      if (is3D && s.indexOf('3D') === -1) {
        s = s + ' (3D)';
      }

      baseName = trimStr(s) || "Layer";
    }

    // 5. Deduplication: append sequential numbers if baseName is repeated in this comp
    if (totalOccurrences > 1 && !baseName.match(/\d+$/)) {
      return baseName + " " + occurrenceCount;
    }

    return baseName;
  }

  // Main Build Function
  function build(jsonPath, targetMode) {
    if (!app.project) {
      app.newProject();
    }

    var jsonFile = new File(jsonPath);
    if (!jsonFile.exists) {
      return "ERROR: File not found at " + jsonPath;
    }

    // Force UTF-8 encoding for full international & special character support (Ava's, symbols, etc.)
    jsonFile.encoding = 'UTF-8';
    jsonFile.open('r');
    var rawText = jsonFile.read();
    jsonFile.close();

    var data;
    try {
      data = JSON.parse(rawText);
    } catch(e) {
      return "ERROR: Failed to parse animation JSON: " + e.toString();
    }

    var basePath = jsonFile.parent.fsName;
    app.beginUndoGroup("MotionFlow: " + (data.name || "Build"));

    try {
      // 1. Create Clean Folder Hierarchy (matching production folder structure)
      // Root: "MotionFlow" (reuse if already present)
      var rootFolder = null;
      for (var fIdx = 1; fIdx <= app.project.items.length; fIdx++) {
        var itm = app.project.items[fIdx];
        if (itm instanceof FolderItem && itm.name === "MotionFlow" && itm.parentFolder === app.project.rootFolder) {
          rootFolder = itm;
          break;
        }
      }
      if (!rootFolder) {
        rootFolder = app.project.items.addFolder("MotionFlow");
      }

      // Project folder: e.g. "Orbit Cards" (unique name to avoid collision)
      var projBaseName = data.name || "Animation";
      var projName = projBaseName;
      var suffix = 1;
      var exists = true;
      while (exists) {
        exists = false;
        for (var pIdx = 1; pIdx <= app.project.items.length; pIdx++) {
          var pItm = app.project.items[pIdx];
          if (pItm instanceof FolderItem && pItm.name === projName && pItm.parentFolder === rootFolder) {
            suffix++;
            projName = projBaseName + " " + suffix;
            exists = true;
            break;
          }
        }
      }
      var projectFolder = app.project.items.addFolder(projName);
      projectFolder.parentFolder = rootFolder;

      // Assets folder: inside projectFolder
      var assetsFolder = app.project.items.addFolder("Assets");
      assetsFolder.parentFolder = projectFolder;

      // Scenes folder: inside projectFolder
      var scenesFolder = app.project.items.addFolder("Scenes");
      scenesFolder.parentFolder = projectFolder;

      // 2. Import Assets (Images / Videos) into Assets folder
      var assetItems = {};
      if (data.assets) {
        for (var assetId in data.assets) {
          if (data.assets.hasOwnProperty(assetId)) {
            var asset = data.assets[assetId];
            var assetFilePath = basePath + "/" + asset.path;
            var assetFile = new File(assetFilePath);
            if (assetFile.exists) {
              try {
                var importOpts = new ImportOptions(assetFile);
                var importedItem = app.project.importFile(importOpts);
                importedItem.parentFolder = assetsFolder;
                assetItems[assetId] = importedItem;
              } catch(e) {}
            }
          }
        }
      }

      // 3. Order compositions topologically
      var compsList = data.comps || [];
      var sortedComps = sortComps(compsList);
      var compItems = {};

      // 4. Create all compositions and place them into folders
      var mainCompId = (sortedComps.length > 0) ? sortedComps[sortedComps.length - 1].id : "main";
      for (var c = 0; c < sortedComps.length; c++) {
        var cData = sortedComps[c];
        var fps = data.fps || 30;
        var duration = cData.duration || 10;
        var width = cData.w || 1920;
        var height = cData.h || 1080;
        var compName = cData.name || cData.id;

        var compItem = app.project.items.addComp(compName, width, height, 1, duration, fps);
        if (cData.id === "main" || cData.id === mainCompId) {
          compItem.parentFolder = projectFolder;
        } else {
          compItem.parentFolder = scenesFolder;
        }
        compItems[cData.id] = compItem;
      }

      // 4. Populate each composition with layers
      for (var k = 0; k < sortedComps.length; k++) {
        var compDef = sortedComps[k];
        var comp = compItems[compDef.id];
        if (!comp || !compDef.layers) continue;

        // Harmonize parent-child hierarchies in group compositions
        harmonizeCompLayers(compDef);

        // Pre-calculate clean, deduplicated names for all layers in this composition
        var finalLayerNames = [];
        var nameCounts = {};
        for (var n = 0; n < compDef.layers.length; n++) {
          var bName = formatLayerName(compDef.layers[n], compDef, 1, 1);
          nameCounts[bName] = (nameCounts[bName] || 0) + 1;
        }
        var nameTracker = {};
        for (var n2 = 0; n2 < compDef.layers.length; n2++) {
          var bName2 = formatLayerName(compDef.layers[n2], compDef, 1, 1);
          nameTracker[bName2] = (nameTracker[bName2] || 0) + 1;
          finalLayerNames[n2] = formatLayerName(compDef.layers[n2], compDef, nameTracker[bName2], nameCounts[bName2]);
        }

        var createdLayers = [];

        // Iterate backwards so the first layer in JSON ends up at the top in AE
        for (var lIdx = compDef.layers.length - 1; lIdx >= 0; lIdx--) {
          var lDef = compDef.layers[lIdx];
          var layer = null;

          // A. Precomp Layer
          if (lDef.precomp && lDef.precomp.comp && compItems[lDef.precomp.comp]) {
            layer = comp.layers.add(compItems[lDef.precomp.comp]);
            if (lDef.collapse === true) {
              try { layer.collapseTransformation = true; } catch(ctErr) {}
            }
          }
          // B. Footage (Image / Video) Layer
          else if (
            (lDef.image && lDef.image.asset && assetItems[lDef.image.asset]) ||
            (lDef.video && lDef.video.asset && assetItems[lDef.video.asset]) ||
            (lDef.footage && lDef.footage.asset && assetItems[lDef.footage.asset]) ||
            (lDef.asset && assetItems[lDef.asset])
          ) {
            var aId = (lDef.image && lDef.image.asset) ||
                      (lDef.video && lDef.video.asset) ||
                      (lDef.footage && lDef.footage.asset) ||
                      lDef.asset;
            layer = comp.layers.add(assetItems[aId]);
            if (lDef.video && lDef.video.remap) {
              try {
                layer.timeRemapEnabled = true;
                applyProperty(layer.property("ADBE Time Remapping") || layer.property("Time Remap"), lDef.video.remap);
              } catch(remapErr) {}
            }
          }
          // C. Camera Layer
          else if (lDef.type === 'camera') {
            layer = comp.layers.addCamera(finalLayerNames[lIdx] || "Camera", [comp.width / 2, comp.height / 2]);
            try {
              layer.autoOrient = AutoOrientType.NO_AUTO_ORIENT;
              if (lDef.camera && lDef.camera.zoom) {
                applyProperty(layer.property("Camera Options").property("Zoom"), lDef.camera.zoom);
              }
              if (lDef.camera && lDef.camera.focusDistance) {
                applyProperty(layer.property("Camera Options").property("Focus Distance"), lDef.camera.focusDistance);
              }
            } catch(camErr) {}
          }
          // D. Text Layer
          else if (lDef.type === 'text' && lDef.text) {
            var content = lDef.text.content || lDef.text.text || " ";
            layer = comp.layers.addText(content);
            try {
              var sourceTextProp = layer.property("Source Text");
              if (sourceTextProp) {
                var textDoc = sourceTextProp.value;

                // 1. Text Fill Color
                try {
                  var fontColor = lDef.text.fill || lDef.text.color;
                  if (fontColor) {
                    textDoc.applyFill = true;
                    textDoc.fillColor = hexToRgb(fontColor);
                  }
                } catch(fcErr) {}

                // 2. Stroke (disable default stroke if none specified)
                try {
                  if (lDef.text.stroke) {
                    textDoc.applyStroke = true;
                    textDoc.strokeColor = hexToRgb(lDef.text.stroke.color || lDef.text.stroke);
                    if (lDef.text.strokeWidth) textDoc.strokeWidth = lDef.text.strokeWidth;
                  } else {
                    textDoc.applyStroke = false;
                  }
                } catch(stkErr) {}

                // 3. Font Size
                try {
                  if (lDef.text.size) {
                    textDoc.fontSize = lDef.text.size;
                  }
                } catch(fsErr) {}

                // 4. Font assignment with safe fallbacks
                try {
                  if (lDef.text.font) {
                    var fontCandidates = [
                      lDef.text.font,
                      lDef.text.font.replace(/-/g, ' '),
                      lDef.text.font.replace(/-/g, ''),
                      lDef.text.font.split('-')[0]
                    ];
                    for (var fi = 0; fi < fontCandidates.length; fi++) {
                      try {
                        textDoc.font = fontCandidates[fi];
                        break;
                      } catch(candErr) {}
                    }
                  }
                } catch(fErr) {}

                // 5. Justification
                try {
                  if (lDef.text.justify) {
                    if (lDef.text.justify === 'center') {
                      textDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
                    } else if (lDef.text.justify === 'right') {
                      textDoc.justification = ParagraphJustification.RIGHT_JUSTIFY;
                    } else {
                      textDoc.justification = ParagraphJustification.LEFT_JUSTIFY;
                    }
                  }
                } catch(jErr) {}

                // 6. Tracking (round to integer to prevent C++ parameter validation failure)
                try {
                  if (lDef.text.tracking !== undefined && lDef.text.tracking !== null) {
                    try {
                      textDoc.tracking = Math.round(lDef.text.tracking);
                    } catch(trErr1) {
                      try {
                        textDoc.tracking = lDef.text.tracking;
                      } catch(trErr2) {}
                    }
                  }
                } catch(trErr3) {}

                // Commit the styled text document to the layer
                try {
                  sourceTextProp.setValue(textDoc);
                } catch(commitErr1) {
                  // Fallback: If tracking caused AE rejection, reset tracking to 0 and re-commit
                  try {
                    textDoc.tracking = 0;
                    sourceTextProp.setValue(textDoc);
                  } catch(commitErr2) {
                    // Ultimate fallback: commit clean doc with fill, size and font
                    try {
                      var basicDoc = sourceTextProp.value;
                      basicDoc.applyFill = true;
                      basicDoc.fillColor = hexToRgb(lDef.text.fill || lDef.text.color || "#ffffff");
                      if (lDef.text.size) basicDoc.fontSize = lDef.text.size;
                      try { basicDoc.font = lDef.text.font; } catch(bfErr) {}
                      sourceTextProp.setValue(basicDoc);
                    } catch(commitErr3) {}
                  }
                }
              }
            } catch(textErr) {}
          }
          // E. Shape Layer
          else {
            layer = comp.layers.addShape();
            if (lDef.shapes && lDef.shapes instanceof Array) {
              for (var s = 0; s < lDef.shapes.length; s++) {
                var shDef = lDef.shapes[s];
                try {
                  var contents = layer.property("ADBE Root Vectors Group") || layer.property("Contents");
                  var group = contents.addProperty("ADBE Vector Group");
                  group.name = shDef.name || "Shape Group";

                  var groupContents = group.property("ADBE Vectors Group") || group.property("Contents");

                  // Rect
                  if (shDef.kind === 'rect' || shDef.kind === 'box') {
                    var rect = groupContents.addProperty("ADBE Vector Shape - Rect");
                    if (shDef.size) applyProperty(rect.property("ADBE Vector Rect Size") || rect.property("Size"), shDef.size);
                    if (shDef.position) applyProperty(rect.property("ADBE Vector Rect Position") || rect.property("Position"), shDef.position);
                    if (shDef.roundness !== undefined) applyProperty(rect.property("ADBE Vector Rect Roundness") || rect.property("Roundness"), shDef.roundness);
                  }
                  // Ellipse
                  else if (shDef.kind === 'ellipse' || shDef.kind === 'circle') {
                    var ellipse = groupContents.addProperty("ADBE Vector Shape - Ellipse");
                    if (shDef.size) applyProperty(ellipse.property("ADBE Vector Ellipse Size") || ellipse.property("Size"), shDef.size);
                    if (shDef.position) applyProperty(ellipse.property("ADBE Vector Ellipse Position") || ellipse.property("Position"), shDef.position);
                  }
                  // Path (single or compound vector paths)
                  else if (shDef.kind === 'path') {
                    var pathList = (shDef.paths && shDef.paths instanceof Array && shDef.paths.length > 0)
                      ? shDef.paths
                      : (shDef.path ? [shDef.path] : []);

                    for (var pIdx = 0; pIdx < pathList.length; pIdx++) {
                      var pItem = pathList[pIdx];
                      if (!pItem) continue;
                      var pathGroup = groupContents.addProperty("ADBE Vector Shape - Group");
                      var pathProp = pathGroup.property("ADBE Vector Shape") || pathGroup.property("Path") || pathGroup.property(1);
                      applyPathProperty(pathProp, pItem);
                    }
                  }

                  // Fill
                  if (shDef.fill) {
                    var fill = groupContents.addProperty("ADBE Vector Graphic - Fill");
                    if (shDef.fill.color) applyProperty(fill.property("ADBE Vector Fill Color") || fill.property("Color"), shDef.fill.color, true);
                    if (shDef.fill.opacity !== undefined) applyProperty(fill.property("ADBE Vector Fill Opacity") || fill.property("Opacity"), shDef.fill.opacity);
                  }

                  // Stroke
                  if (shDef.stroke) {
                    var stroke = groupContents.addProperty("ADBE Vector Graphic - Stroke");
                    if (shDef.stroke.color) applyProperty(stroke.property("ADBE Vector Stroke Color") || stroke.property("Color"), shDef.stroke.color, true);
                    if (shDef.stroke.width !== undefined) applyProperty(stroke.property("ADBE Vector Stroke Width") || stroke.property("Stroke Width"), shDef.stroke.width);
                    if (shDef.stroke.opacity !== undefined) applyProperty(stroke.property("ADBE Vector Stroke Opacity") || stroke.property("Opacity"), shDef.stroke.opacity);

                    // Line Cap: 1 = Butt, 2 = Round, 3 = Projecting
                    if (shDef.stroke.cap) {
                      var capProp = stroke.property("ADBE Vector Stroke Line Cap") || stroke.property("Line Cap");
                      if (capProp) {
                        var capVal = 1;
                        if (shDef.stroke.cap === 'round') capVal = 2;
                        else if (shDef.stroke.cap === 'square' || shDef.stroke.cap === 'projecting') capVal = 3;
                        capProp.setValue(capVal);
                      }
                    }

                    // Line Join: 1 = Miter, 2 = Round, 3 = Bevel
                    if (shDef.stroke.join) {
                      var joinProp = stroke.property("ADBE Vector Stroke Line Join") || stroke.property("Line Join");
                      if (joinProp) {
                        var joinVal = 1;
                        if (shDef.stroke.join === 'round') joinVal = 2;
                        else if (shDef.stroke.join === 'bevel') joinVal = 3;
                        joinProp.setValue(joinVal);
                      }
                    }

                    // Dashes & Gaps (e.g. stroke-dasharray="6 6")
                    if (shDef.stroke.dash && shDef.stroke.dash instanceof Array && shDef.stroke.dash.length > 0) {
                      try {
                        var dashesGroup = stroke.property("ADBE Vector Dashes") || stroke.property("Dashes");
                        if (dashesGroup) {
                          var dashProp = dashesGroup.addProperty("ADBE Vector Dash - Dash");
                          if (dashProp) dashProp.setValue(shDef.stroke.dash[0]);
                          if (shDef.stroke.dash.length > 1) {
                            var gapProp = dashesGroup.addProperty("ADBE Vector Dash - Gap");
                            if (gapProp) gapProp.setValue(shDef.stroke.dash[1]);
                          }
                        }
                      } catch(dashErr) {}
                    }
                  }

                  // Trim Paths
                  if (shDef.trim) {
                    try {
                      var trim = groupContents.addProperty("ADBE Vector Filter - Trim");
                      if (trim) {
                        if (shDef.trim.start !== undefined) applyProperty(trim.property("ADBE Vector Trim Start") || trim.property("Start"), shDef.trim.start);
                        if (shDef.trim.end !== undefined) applyProperty(trim.property("ADBE Vector Trim End") || trim.property("End"), shDef.trim.end);
                        if (shDef.trim.offset !== undefined) applyProperty(trim.property("ADBE Vector Trim Offset") || trim.property("Offset"), shDef.trim.offset);
                      }
                    } catch(trimErr) {}
                  }
                } catch(err) {}
              }
            }
          }

          if (!layer) continue;
          createdLayers[lIdx] = layer;

          // Set Clean Sanitized Layer Name
          var cleanName = finalLayerNames[lIdx] || lDef.name || "Layer";
          layer.name = cleanName;
          layer._rawName = lDef.name;
          try {
            layer.comment = lDef.id || lDef.name || "";
          } catch(commErr) {}

          // Set Timing: startTime MUST be set before inPoint and outPoint
          if (lDef.start !== undefined) {
            try { layer.startTime = lDef.start; } catch(stErr) {}
          }
          if (lDef.in !== undefined) {
            try { layer.inPoint = lDef.in; } catch(inErr) {}
          }
          if (lDef.out !== undefined) {
            try { layer.outPoint = lDef.out; } catch(outErr) {}
          }

          // Enable 3D Layer if specified (cameras are 3D by default)
          if (lDef.threeD && lDef.type !== 'camera') {
            try { layer.threeDLayer = true; } catch(e) {}
          }

          // Apply Transforms
          if (lDef.transform) {
            var tf = lDef.transform;
            if (tf.anchor) applyProperty(layer.property("ADBE Anchor Point") || layer.property("Anchor Point"), tf.anchor);
            // Defer position and scale for harmonized child layers until parenting pass
            if (lDef._parentIdx === undefined) {
              if (tf.position) applyProperty(layer.property("ADBE Position") || layer.property("Position"), tf.position);
              if (tf.scale) applyProperty(layer.property("ADBE Scale") || layer.property("Scale"), tf.scale);
            }

            if (layer.threeDLayer) {
              if (tf.rotation !== undefined) applyProperty(layer.property("ADBE Rotate Z") || layer.property("Z Rotation") || layer.property("Rotation"), tf.rotation);
              if (tf.rotationX !== undefined) applyProperty(layer.property("ADBE Rotate X") || layer.property("X Rotation"), tf.rotationX);
              if (tf.rotationY !== undefined) applyProperty(layer.property("ADBE Rotate Y") || layer.property("Y Rotation"), tf.rotationY);
              if (tf.rotationZ !== undefined) applyProperty(layer.property("ADBE Rotate Z") || layer.property("Z Rotation"), tf.rotationZ);
            } else {
              if (tf.rotation !== undefined) applyProperty(layer.property("ADBE Rotate Z") || layer.property("Rotation"), tf.rotation);
            }

            if (tf.opacity !== undefined) applyProperty(layer.property("ADBE Opacity") || layer.property("Opacity"), tf.opacity);
          }

          // Apply Effects (Corner Pin, Gradient Ramp, Drop Shadow)
          if (lDef.effects && lDef.effects instanceof Array) {
            for (var eIdx = 0; eIdx < lDef.effects.length; eIdx++) {
              var eff = lDef.effects[eIdx];
              if (eff.type === 'cornerPin') {
                try {
                  var cp = layer.property("Effects").addProperty("ADBE Corner Pin");
                  // Use index access (1: Upper Left, 2: Upper Right, 3: Lower Left, 4: Lower Right)
                  if (eff.ul) applyProperty(cp.property(1), eff.ul);
                  if (eff.ur) applyProperty(cp.property(2), eff.ur);
                  if (eff.ll) applyProperty(cp.property(3), eff.ll);
                  if (eff.lr) applyProperty(cp.property(4), eff.lr);
                } catch(e) {}
              }
              else if (eff.type === 'ramp') {
                try {
                  var ramp = layer.property("Effects").addProperty("ADBE Ramp");
                  var cx = layer.width ? (layer.width / 2) : (comp.width / 2);
                  var cy = layer.height ? (layer.height / 2) : (comp.height / 2);
                  var overflowLimit = Math.max(10000, comp.height * 4);
                  if (eff.start) {
                    var sY = eff.start[1];
                    if (Math.abs(sY) >= overflowLimit) sY = sY / 100;
                    var sPt = [cx + eff.start[0], cy + sY];
                    applyProperty(ramp.property(1), sPt);
                  }
                  if (eff.from) applyProperty(ramp.property(2), eff.from, true);
                  if (eff.end) {
                    var eY = eff.end[1];
                    if (Math.abs(eY) >= overflowLimit) eY = eY / 100;
                    var ePt = [cx + eff.end[0], cy + eY];
                    applyProperty(ramp.property(3), ePt);
                  }
                  if (eff.to) applyProperty(ramp.property(4), eff.to, true);
                  // Ramp Shape: 1 = Linear, 2 = Radial
                  if (eff.shape === 'radial') {
                    try { ramp.property(5).setValue(2); } catch(rShpErr) {}
                  } else {
                    try { ramp.property(5).setValue(1); } catch(lShpErr) {}
                  }
                } catch(rampErr) {}
              }
              else if (eff.type === 'dropShadow') {
                try {
                  var ds = layer.property("Effects").addProperty("ADBE Drop Shadow");
                  if (eff.color) applyProperty(ds.property(1), eff.color, true);
                  if (eff.opacity !== undefined) applyProperty(ds.property(2), eff.opacity);
                  if (eff.direction !== undefined) applyProperty(ds.property(3), eff.direction);
                  if (eff.distance !== undefined) applyProperty(ds.property(4), eff.distance);
                  if (eff.softness !== undefined) applyProperty(ds.property(5), eff.softness);
                } catch(dsErr) {}
              }
              else if (eff.type === 'blur' || eff.type === 'gaussianBlur') {
                try {
                  var blur = null;
                  try {
                    blur = layer.property("Effects").addProperty("ADBE Gaussian Blur 2");
                  } catch(gb2Err) {
                    try {
                      blur = layer.property("Effects").addProperty("ADBE Gaussian Blur");
                    } catch(gb1Err) {}
                  }
                  if (blur) {
                    var bAmount = eff.amount !== undefined ? eff.amount : (eff.blur !== undefined ? eff.blur : eff.radius);
                    if (bAmount !== undefined) {
                      applyProperty(blur.property(1), bAmount);
                    }
                    if (eff.repeatEdgePixels !== undefined && blur.property(3)) {
                      try { blur.property(3).setValue(eff.repeatEdgePixels ? 1 : 0); } catch(repErr) {}
                    }
                  }
                } catch(blurErr) {}
              }
            }
          }

          // Apply Masks (for rounded corners, circular avatars, image cropping)
          if (lDef.masks) {
            applyMasks(layer, lDef.masks);
          }
        }

        // Apply parenting and local resting transforms for harmonized child layers and matte clones
        for (var pIdx = 0; pIdx < compDef.layers.length; pIdx++) {
          var pDef = compDef.layers[pIdx];
          var childL = createdLayers[pIdx];
          if (!childL) continue;

          // A. Auto-harmonized container parenting
          if (pDef._parentIdx !== undefined && createdLayers[pDef._parentIdx]) {
            var parentL = createdLayers[pDef._parentIdx];
            try {
              childL.parent = parentL;
              if (pDef._localPos) {
                var pProp = childL.property("ADBE Position") || childL.property("Position");
                if (pProp) pProp.setValue(pDef._localPos);
              }
              if (pDef._localScale) {
                var sProp = childL.property("ADBE Scale") || childL.property("Scale");
                var sVal = pDef._localScale;
                if (sVal instanceof Array && sVal.length === 2) {
                  sVal = [sVal[0], sVal[1], 100];
                }
                if (sProp) sProp.setValue(sVal);
              }
            } catch(parentErr) {}
          }
          // B. Explicit parent definition (if specified in JSON)
          else if (pDef.parent !== undefined) {
            var expParentLayer = null;
            var expParentDef = null;
            if (typeof pDef.parent === 'number' && createdLayers[pDef.parent]) {
              expParentLayer = createdLayers[pDef.parent];
              expParentDef = compDef.layers[pDef.parent];
            } else if (typeof pDef.parent === 'string') {
              for (var fIdx = 0; fIdx < compDef.layers.length; fIdx++) {
                if (compDef.layers[fIdx].id === pDef.parent || compDef.layers[fIdx].name === pDef.parent) {
                  expParentLayer = createdLayers[fIdx];
                  expParentDef = compDef.layers[fIdx];
                  break;
                }
              }
            }
            if (expParentLayer) {
              try {
                var isMatteChild = (pDef.name && pDef.name.indexOf('(alpha)') !== -1) ||
                                   (childL.name && childL.name.indexOf('(alpha)') !== -1) ||
                                   (expParentDef && expParentDef.matte && (expParentDef.matte.source === pDef.id || expParentDef.matte.source === pDef.name));

                if (isMatteChild) {
                  var targetAnchor = (expParentDef && expParentDef.transform && expParentDef.transform.anchor)
                    ? expParentDef.transform.anchor
                    : [0, 0];

                  // Synchronize Anchor Point to match parent layer's anchor point
                  var ancProp = childL.property("ADBE Anchor Point") || childL.property("Anchor Point");
                  if (ancProp) ancProp.setValue(targetAnchor);

                  // Parent to base layer
                  childL.parent = expParentLayer;

                  // In AE, child position is relative to parent's (0, 0) origin.
                  // Setting child position to parent's anchor point places child's anchor point directly on parent's anchor point.
                  var posProp = childL.property("ADBE Position") || childL.property("Position");
                  if (posProp) posProp.setValue(targetAnchor);

                  // Set local scale to 100%
                  var scProp = childL.property("ADBE Scale") || childL.property("Scale");
                  if (scProp) scProp.setValue([100, 100, 100]);

                  // Set local rotation to 0
                  var rotProp = childL.property("ADBE Rotate Z") || childL.property("Rotation");
                  if (rotProp) rotProp.setValue(0);

                  // Turn off layer visibility switch so matte layer doesn't render directly
                  childL.enabled = false;
                } else {
                  childL.parent = expParentLayer;
                }
              } catch(expPErr) {}
            }
          }
        }

        // Apply Track Mattes (Luma / Alpha)
        for (var tmIdx = 0; tmIdx < compDef.layers.length; tmIdx++) {
          var targetLDef = compDef.layers[tmIdx];
          if (!targetLDef.matte || !targetLDef.matte.source) continue;
          var targetL = createdLayers[tmIdx];
          if (!targetL) continue;

          var matteSourceLayer = null;
          for (var msIdx = 0; msIdx < compDef.layers.length; msIdx++) {
            var candLDef = compDef.layers[msIdx];
            if (candLDef.id === targetLDef.matte.source || candLDef.name === targetLDef.matte.source) {
              matteSourceLayer = createdLayers[msIdx];
              break;
            }
          }
          if (!matteSourceLayer) continue;

          // Determine Track Matte Type
          var tmType = 3; // LUMA default
          var mTypeStr = (targetLDef.matte.type || 'luma').toLowerCase();
          if (typeof TrackMatteType !== 'undefined') {
            if (mTypeStr === 'alpha') {
              tmType = TrackMatteType.ALPHA;
            } else if (mTypeStr === 'alpha_inverted') {
              tmType = TrackMatteType.ALPHA_INVERTED;
            } else if (mTypeStr === 'luma_inverted') {
              tmType = TrackMatteType.LUMA_INVERTED;
            } else {
              tmType = TrackMatteType.LUMA;
            }
          }

          try {
            // Modern After Effects (AE 2022+ / v22.0 to 2025+): setTrackMatte API
            if (typeof targetL.setTrackMatte === 'function') {
              targetL.setTrackMatte(matteSourceLayer, tmType);
            } else {
              // Legacy After Effects fallback: matte layer must sit directly above target layer
              try {
                if (matteSourceLayer.index !== targetL.index - 1) {
                  matteSourceLayer.moveBefore(targetL);
                }
                targetL.trackMatteType = tmType;
              } catch(legacyTmErr) {}
            }
            // Ensure the matte source layer does not render visibly
            try {
              matteSourceLayer.enabled = false;
            } catch(enErr) {}
          } catch(tmErr) {}
        }
      }

      app.endUndoGroup();

      var mainComp = compItems["main"] || compItems[sortedComps[sortedComps.length - 1].id];
      if (mainComp) {
        mainComp.openInViewer();
      }

      return "SUCCESS: Built " + sortedComps.length + " compositions successfully!";

    } catch(topErr) {
      app.endUndoGroup();
      return "ERROR: " + topErr.toString() + " (line " + topErr.line + ")";
    }
  }

  return {
    build: build
  };

})();

var MotionFlowBuilder = CodeMotionBuilder;
