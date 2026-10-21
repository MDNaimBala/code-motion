const fs = require('fs');
const path = require('path');

// Mock After Effects Environment with Audit Tracking
function createMockAE() {
  const createdComps = [];
  const compMap = {};
  const runtimeErrors = [];

  const app = {
    project: {
      items: {
        addFolder: (name) => ({ name: name, items: [] }),
        addComp: (name, w, h, par, dur, fps) => {
          const comp = {
            id: 'comp_' + createdComps.length,
            name: name,
            width: w,
            height: h,
            duration: dur,
            frameRate: fps,
            layersList: [],
            layers: {
              add: (item) => {
                const l = createMockLayer(item ? item.name : 'precomp', 'precomp', comp);
                comp.layersList.push(l);
                return l;
              },
              addShape: () => {
                const l = createMockLayer('shape', 'shape', comp);
                comp.layersList.push(l);
                return l;
              },
              addText: (txt) => {
                const l = createMockLayer(txt || 'text', 'text', comp);
                comp.layersList.push(l);
                return l;
              },
              addCamera: (name, center) => {
                const l = createMockLayer(name, 'camera', comp);
                comp.layersList.push(l);
                return l;
              }
            },
            openInViewer: () => {}
          };
          createdComps.push(comp);
          return comp;
        }
      }
    },
    beginUndoGroup: () => {},
    endUndoGroup: () => {}
  };

  function createMockLayer(name, type, comp) {
    const props = {};

    function getProp(pName) {
      if (!props[pName]) {
        let expectedDim = 1;
        if (pName === 'ADBE Scale') expectedDim = 3;
        else if (pName === 'ADBE Position' || pName === 'Position') expectedDim = 2;
        else if (pName === 'ADBE Anchor Point' || pName === 'Anchor Point') expectedDim = 2;

        props[pName] = {
          name: pName,
          value: null,
          keys: [],
          expectedDim: expectedDim,
          setValue: function(v) {
            this.value = v;
            validateValue(pName, v);
          },
          setValueAtTime: function(t, v) {
            this.keys.push({ t, v });
            validateValue(pName, v);
          },
          setInterpolationTypeAtKey: () => {},
          setTemporalEaseAtKey: (k, inE, outE) => {
            if (pName === 'ADBE Scale' && inE && inE.length !== 3) {
              runtimeErrors.push({
                layer: name,
                prop: pName,
                error: 'setTemporalEaseAtKey expects 3 ease elements for Scale, got ' + inE.length
              });
            }
          },
          setSpatialTangentsAtKey: () => {},
          propertyValueType: (pName === 'ADBE Scale') ? 4 : (pName === 'ADBE Position' ? 1 : 3)
        };
      }
      return props[pName];
    }

    function validateValue(pName, v) {
      if (pName === 'ADBE Scale') {
        if (Array.isArray(v) && v.length !== 3) {
          runtimeErrors.push({
            layer: name,
            prop: pName,
            error: 'Scale value passed with ' + v.length + ' dimensions instead of 3: ' + JSON.stringify(v)
          });
        }
      }
    }

    return {
      name: name,
      type: type,
      comp: comp,
      parent: null,
      enabled: true,
      trackMatteType: 0,
      setTrackMatte: function(matteLayer, type) {
        this.matteLayer = matteLayer;
        this.trackMatteType = type;
        matteLayer.enabled = false;
      },
      props: props,
      property: function(p) {
        if (p === 'ADBE Root Vectors Group' || p === 'Contents') {
          return {
            addProperty: () => ({
              property: () => ({
                addProperty: () => ({
                  property: (k) => getProp('shapeProp_' + k)
                })
              })
            })
          };
        }
        if (p === 'Source Text') {
          return {
            value: { applyFill: false, applyStroke: false, fontSize: 12, tracking: 0 },
            setValue: (doc) => {
              if (doc && doc.tracking !== undefined && !Number.isInteger(doc.tracking)) {
                runtimeErrors.push({
                  layer: name,
                  prop: 'Source Text',
                  error: 'Tracking must be integer in AE, received float: ' + doc.tracking
                });
              }
            }
          };
        }
        if (p === 'Effects' || p === 'ADBE Effect Parade') {
          return {
            addProperty: () => ({
              property: (k) => getProp('effectProp_' + k)
            })
          };
        }
        if (p === 'Masks' || p === 'ADBE Mask Parade') {
          return {
            addProperty: () => ({
              maskMode: 1,
              property: (k) => getProp('maskProp_' + k)
            })
          };
        }
        return getProp(p);
      }
    };
  }

  return { app, createdComps, runtimeErrors };
}

const KeyframeInterpolationType = { LINEAR: 1, BEZIER: 2, HOLD: 3 };
const KeyframeEase = function() {};
const PropertyValueType = { TwoD_SPATIAL: 1, ThreeD_SPATIAL: 2, TwoD: 3, ThreeD: 4, OneD: 5 };
const ParagraphJustification = { LEFT_JUSTIFY: 1, CENTER_JUSTIFY: 2, RIGHT_JUSTIFY: 3 };
const AutoOrientType = { NO_AUTO_ORIENT: 1 };
const MaskMode = { ADD: 1, SUBTRACT: 2, INTERSECT: 3 };
const Shape = function() {};
const TrackMatteType = { NO_TRACK_MATTE: 0, ALPHA: 1, ALPHA_INVERTED: 2, LUMA: 3, LUMA_INVERTED: 4 };

const targets = [
  'tests/pasted/index (CodeFlow)/codeflow.json',
  'tests/flowly-saas/test (CodeFlow)/codeflow.json',
  'tests/custom-test/index (CodeFlow)/codeflow.json',
  'tests/spatial-player/index (CodeFlow)/codeflow.json',
  'tests/engine-test/index (CodeFlow)/codeflow.json',
  'tests/orbit-cards/Orbit Cards (CodeFlow)/codeflow.json',
  'tests/spatial-audio-hud/index (CodeFlow)/codeflow.json',
  'scratch/test_static (CodeFlow)/codeflow.json',
  'scratch/pure_static (CodeFlow)/codeflow.json'
];

const builderCode = fs.readFileSync('CodeMotion/host/builder.jsx', 'utf8');

console.log('================================================================');
console.log('       CODE MOTION AUTOMATED SIMULATION & AUDIT ENGINE          ');
console.log('================================================================');

let totalTests = 0;
let passedTests = 0;

targets.forEach(targetPath => {
  if (!fs.existsSync(targetPath)) return;
  totalTests++;

  console.log(`\n▶ AUDITING: [${targetPath}]`);

  const mock = createMockAE();
  global.app = mock.app;
  global.File = function(p) {
    return {
      exists: true,
      parent: { fsName: path.dirname(p) },
      open: () => true,
      read: () => fs.readFileSync(p, 'utf8'),
      close: () => true
    };
  };

  eval(builderCode);

  let buildResult = '';
  try {
    buildResult = CodeMotionBuilder.build(targetPath, 'new');
  } catch (err) {
    console.error('  ❌ BUILD CRASHED:', err.message);
    return;
  }

  if (buildResult.startsWith('ERROR')) {
    console.error('  ❌ BUILD RETURNED ERROR:', buildResult);
    return;
  }

  const rawData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  const issues = [];

  // Check 1: Runtime API errors recorded by Mock AE
  if (mock.runtimeErrors.length > 0) {
    mock.runtimeErrors.forEach(re => {
      issues.push(`API Violation in layer "${re.layer}" [${re.prop}]: ${re.error}`);
    });
  }

  // Check 2: Animation Stripping & Accidental Flattening
  let totalRawKeyframedLayers = 0;
  let preservedKeyframedLayers = 0;
  let harmonizedBadges = 0;

  rawData.comps.forEach(cDef => {
    if (!cDef.layers) return;
    const mockComp = mock.createdComps.find(mc => mc.name === cDef.name);
    if (!mockComp) return;

    cDef.layers.forEach(lDef => {
      const mockL = mockComp.layersList.find(ml => ml._rawName === lDef.name || ml.name === lDef.name);
      if (!mockL) return;

      const rawHasScaleK = lDef.transform && lDef.transform.scale && lDef.transform.scale.k && lDef.transform.scale.k.length > 1;
      const rawHasPosK = lDef.transform && lDef.transform.position && lDef.transform.position.k && lDef.transform.position.k.length > 1;

      if (rawHasScaleK || rawHasPosK) totalRawKeyframedLayers++;

      const builtScaleK = mockL.props['ADBE Scale'] ? mockL.props['ADBE Scale'].keys.length : 0;
      const builtPosK = mockL.props['ADBE Position'] ? mockL.props['ADBE Position'].keys.length : 0;

      if (builtScaleK > 0 || builtPosK > 0) {
        preservedKeyframedLayers++;
      } else if (rawHasScaleK || rawHasPosK) {
        // Layer was flattened: verify if it was an intentional container-harmonized badge
        if (mockL.parent) {
          harmonizedBadges++;
          // Double check: if it scaled asymmetrically, it shouldn't have been harmonized!
          if (rawHasScaleK) {
            const kArr = lDef.transform.scale.k;
            const kStart = kArr[0].v;
            const kEnd = kArr[kArr.length - 1].v;
            if (kEnd[0] !== 0 && kEnd[1] !== 0) {
              const diff = Math.abs(kStart[0] / kEnd[0] - kStart[1] / kEnd[1]);
              if (diff > 0.08) {
                issues.push(`CRITICAL: Asymmetric animated layer "${lDef.name}" in comp "${cDef.name}" was mistakenly harmonized and flattened into parent "${mockL.parent.name}"!`);
              }
            }
          }
        } else {
          issues.push(`CRITICAL: Animated layer "${lDef.name}" in comp "${cDef.name}" had keyframes in JSON, but 0 keyframes were applied and it has NO parent!`);
        }
      }
    });
  });

  console.log(`  Comps: ${rawData.comps.length} | Raw Keyframed: ${totalRawKeyframedLayers} | Preserved Keys: ${preservedKeyframedLayers} | Harmonized Badges: ${harmonizedBadges}`);

  if (issues.length === 0) {
    console.log(`  ✅ PASSED: Clean build, all keyframes preserved or correctly harmonized.`);
    passedTests++;
  } else {
    console.log(`  ⚠️ ISSUES DETECTED (${issues.length}):`);
    issues.forEach(iss => console.log(`     • ${iss}`));
  }
});

console.log('\n================================================================');
console.log(`AUDIT SUMMARY: ${passedTests} / ${totalTests} test suites passed cleanly.`);
console.log('================================================================\n');
