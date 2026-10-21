---
name: code-motion
description: Create HTML motion animations (UI designs, product promos, explainers, kinetic typography, 3D cards, badges, vector charts, social reels) that the Code Motion panel for After Effects turns into native, editable After Effects compositions and keyframes. Use this whenever the user says "make it for Code Motion", "code motion", "codeflow", "make this editable in After Effects", "send this animation to AE", "I need an editable AE version", or asks for an HTML / SVG / CSS / canvas motion graphic to open in After Effects. Nothing to install: you write the HTML, the user drops it onto the Code Motion panel in After Effects, and it converts in seconds into 100% native AE layers.
---

# Code Motion: HTML Motion Animation → Native, Editable After Effects

Built for the **Code Motion** extension (by Revived Naim).

The Code Motion panel opens the HTML page in headless Chrome/Edge in virtual time, samples every element's visual state, fits high-precision Bézier curves, and builds native After Effects layers (Text layers, Shape layers, Masks, 3D Planes, 3D Cameras, Blend Modes, and Footage).

---

## The 8 Engine Habits (Follow Every Time)

### 1. Fixed-Size Stage & Auto-Fit
Always use a fixed-dimension viewport (e.g. `1080x1080`, `1920x1080`, or `1080x1920`) inside `#stage`, centered with CSS. Include `fitToWindow()` so it previews cleanly in any browser window:
```html
<div id="stage" style="position:absolute;left:50%;top:50%;width:1080px;height:1080px;margin:-540px 0 0 -540px;overflow:hidden">...</div>
```

### 2. Explicit Duration Constant
Always declare `const DURATION = 3.0;` (or whatever total duration in seconds) at the top of your animation script. Without it, the engine has to guess duration by playing the timeline.

### 3. Deterministic Seek Hook (`window.seek`)
Always provide a deterministic seek hook and a time-driven `renderFrame(t)` function:
```javascript
function renderFrame(t) {
  const tt = ((t % DURATION) + DURATION) % DURATION;
  // Drive all transforms strictly from tt
}

let isSeeking = false;
window.seek = function(timeSeconds) {
  isSeeking = true;
  renderFrame(timeSeconds);
};

// Live playback loop
const startTime = performance.now();
function animate() {
  if (isSeeking) return;
  renderFrame(((performance.now() - startTime) / 1000) % DURATION);
  requestAnimationFrame(animate);
}
renderFrame(0);
requestAnimationFrame(animate);
```

### 4. Rigid-Body Containers for Badges, Chips & Cards
To prevent nested elements (icons, circles, labels) from drifting or desynchronizing during entrance pop/scale animations:
* Wrap the badge in a container: `<div class="plane pop" data-z="60" data-at="0.3">`.
* Animate the scale/opacity **only on the container**.
* Keep internal children (circle background, SVG icons, text) static relative to the container.
* Code Motion automatically parents children to the container in After Effects, locking them into a solid, rigid unit.

### 5. Native CSS 3D Scene Rig (Creates Real AE 3D Cameras)
To generate a native After Effects 3D Camera with editable planar 3D layers, use this exact structure:
```html
<div id="stage">
  <div id="scene" style="perspective:1600px;perspective-origin:540px 540px">
    <div class="rig" id="rig" style="transform-style:preserve-3d;transform-origin:540px 540px">
      <!-- 3D elements with data-z="..." -->
      <div class="plane" data-z="1">...</div>
      <div class="plane pop" data-z="80">...</div>
    </div>
  </div>
</div>
```
And initialize parallax scale ratios in JavaScript:
```javascript
const PERSPECTIVE = 1600, ORIGIN_X = 540, ORIGIN_Y = 540;
document.querySelectorAll('.plane').forEach(plane => {
  const z = +plane.dataset.z || 0;
  const scaleRatio = (PERSPECTIVE - z) / PERSPECTIVE;
  const layer = document.createElement('div');
  layer.className = 'layer';
  plane.parentNode.insertBefore(layer, plane);
  layer.appendChild(plane);
  layer.style.transformOrigin = ORIGIN_X + 'px ' + ORIGIN_Y + 'px';
  layer.style.transform = 'translateZ(' + z + 'px) scale(' + scaleRatio.toFixed(5) + ')';
});
```

### 6. Real Editable Typography
* Words must be real HTML elements or SVG `<text>` (never outlined paths or images).
* Web fonts from Google Fonts (`<link>`) or `@font-face` files in `assets/` are automatically verified and registered by Code Motion.

### 7. Vector Shapes & Native Gradients
* **Divs / Boxes**: Become native AE Shape Layers with editable Rectangles, Rounded Corners (`border-radius`), Solid Fill, Stroke Border, and Drop Shadows.
* **Gradients**: Use **2-color linear gradients** (e.g. `linear-gradient(90deg, #6366f1, #38bdf8)`). These convert into native, fully editable `ADBE Ramp` effects. Avoid 3+ stop gradients or conic gradients if you want them to stay editable vector layers instead of raster pictures.
* **SVG Elements**: `<path>`, `<polygon>`, `<circle>`, `<rect>` convert into native After Effects Bezier Shape Paths with in/out tangents.

### 8. Clips and Sound
* Video: `<video src="assets/clip.mp4" muted>` (H.264 MP4).
* Audio: `<audio src="assets/sound.mp3" data-start="0.5">` (`data-start` = timeline second where audio begins).

### 9. Semantic Layer Hygiene (`data-name` & Clean IDs)
Give key components intentional names so the After Effects timeline is production-ready and instantly readable:
* Use `data-name="..."` (or clean IDs) on cards, buttons, badges, and icons:
  ```html
  <div class="card" data-name="Payment Card">
    <div class="badge" data-name="Pro Badge">PRO</div>
    <div class="btn" data-name="Checkout Button">Pay Now</div>
  </div>
  ```
* Code Motion automatically converts these into clean After Effects layers (`Checkout Button`, `Pro Badge`, `Payment Card`), eliminating messy generic `div` or `path` names.

---

## Deliver Workflow

1. Save `<Name>.html` (and optional `assets/` folder).
2. Tell the user:
   * **Preview**: Double-click the HTML file to open in Chrome or Edge.
   * **Convert to AE**: In After Effects, open **Window → Extensions → Code Motion**, drag the HTML file or folder onto the panel, and click **Build in AE**.
