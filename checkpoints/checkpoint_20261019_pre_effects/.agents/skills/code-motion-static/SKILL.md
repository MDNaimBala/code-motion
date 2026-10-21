---
name: code-motion-static
description: Create static HTML/CSS layouts (UI components, dashboards, landing pages, bento grids, vector graphics, cards, badges, typography) that the Code Motion extension converts into native, editable After Effects compositions with ZERO keyframes, ready for manual animation. Use this whenever the user says "code motion static", "static html to after effects", "design a layout for AE", "static to ae", "make a static UI for After Effects", or asks for a web design to animate manually in AE. Outputs pure HTML/CSS without JavaScript animation, with native vector shapes, editable Google Fonts, and clean layer organization.
---

# Code Motion Static: HTML/CSS Layout → Native After Effects Layers (0 Keyframes)

Built for the **Code Motion** extension (by Revived Naim).

This skill generates high-fidelity static web layouts specifically designed to be converted into native After Effects shape layers, live text layers, and SVG vectors with **zero keyframes**, leaving the entire timeline free for motion designers to animate by hand.

For the comprehensive CSS-to-AE mapping, see [references/convert.md](file:///d:/Codes/00%20Playground/14%20Code%20flow%20extention/.agents/skills/code-motion-static/references/convert.md).

---

## The 8 Static Engine Rules (Follow Every Time)

### 1. Fixed-Size Viewport (`#stage`)
After Effects compositions require an exact pixel resolution. Always define a fixed-dimension `#stage` container (e.g. `1080x1080`, `1920x1080`, or `1080x1920`), centered with CSS:
```html
<div id="stage" style="position:absolute;left:50%;top:50%;width:1080px;height:1080px;margin:-540px 0 0 -540px;overflow:hidden">
  <!-- All UI elements go here -->
</div>
```
Include a lightweight browser preview scaler in `<head>`:
```javascript
function fitToWindow() {
  const s = Math.min(innerWidth / 1080, innerHeight / 1080);
  document.getElementById('stage').style.transform = 'scale(' + s + ')';
}
addEventListener('resize', fitToWindow); fitToWindow();
```

### 2. Timeline Duration Constant
Every After Effects composition must have a duration on the timeline. Specify the desired AE composition length in seconds using a clean one-liner:
```html
<script>
  const DURATION = 10; // Sets 10-second composition in After Effects
</script>
```
*(If omitted, Code Motion automatically defaults to a clean 5-second composition).*

### 3. NO JavaScript Animations
* **NEVER** include `window.seek`, `requestAnimationFrame`, or animation loops.
* **NEVER** use CSS transitions or `@keyframes`.
* All elements must sit at their resting layout positions ($t = 0$).

### 4. Real, Live Editable Typography
* Text must be real HTML elements (`<h1>`, `<h2>`, `<p>`, `<span>`, `<div>`) or SVG `<text>`. Never outline fonts or use text images.
* Link Google Fonts cleanly in `<head>` (e.g. `Inter`, `Plus Jakarta Sans`, `Outfit`):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
```
* Font size, color, font-weight, letter-spacing (tracking), and alignment convert directly into native After Effects Text Layer properties.

### 5. Vector Shapes & Parametric Roundness
* **Boxes & Containers**: Become native AE Shape Layers.
* `background: #1e293b;` $\to$ Native AE Vector Fill.
* `border-radius: 24px;` $\to$ Native AE Vector Rect Roundness.
* `border: 1px solid rgba(255,255,255,0.1);` $\to$ Native AE Vector Stroke.
* `box-shadow: 0 20px 40px rgba(0,0,0,0.5);` $\to$ Native `ADBE Drop Shadow` effect.

### 6. Native 2-Color Linear Gradients
* Use **2-color linear gradients** (e.g. `linear-gradient(135deg, #6366f1, #38bdf8)`).
* Code Motion maps these into native, editable `ADBE Ramp` effects in After Effects.
* *Avoid* 3+ color stops, radial repeats, or conic gradients if you want elements to remain vector shapes instead of raster images.

### 7. Vector Icons & SVG Geometries
* Inline SVGs (`<svg>`, `<path>`, `<circle>`, `<rect>`, `<polygon>`) convert into native After Effects Bezier Shape paths with editable vertices and in/out tangents.
* Keep SVG viewboxes clean (e.g. `viewBox="0 0 24 24"`).

### 8. Semantic Layer Hygiene (`data-name` & Clean IDs)
Class names, IDs, and `data-name` attributes are converted directly into clean, human-readable Title Case layer names in After Effects:
```html
<div class="card" data-name="Pricing Card">
  <div class="badge" data-name="Pro Badge">PRO</div>
  <h1 class="title" data-name="Hero Headline">Enterprise Analytics</h1>
  <p class="subtitle" data-name="Feature Subtitle">Real-time metrics</p>
  <div class="btn-primary" data-name="CTA Button">Get Started</div>
</div>
```
In After Effects, the designer immediately sees layers cleanly named `CTA Button`, `Feature Subtitle`, `Hero Headline`, `Pro Badge`, and `Pricing Card`, making manual keyframing effortless and eliminating messy generic `div` or `path` names.

---

## Optional: 3D Spatial Layouts (Real AE 3D Cameras)

If the user wants a 3D layered design (Vision Pro / spatial computing depth) at resting state:
```html
<div id="stage">
  <div id="scene" style="perspective:1600px;perspective-origin:540px 540px">
    <div class="rig" id="rig" style="transform-style:preserve-3d;transform-origin:540px 540px">
      <!-- Background Plane -->
      <div class="plane" data-z="-100">...</div>
      <!-- Foreground Card -->
      <div class="plane" data-z="40">...</div>
      <!-- Floating Badge -->
      <div class="plane" data-z="100">...</div>
    </div>
  </div>
</div>
```
Code Motion will automatically build a native **After Effects 3D Camera** with all layers positioned at their corresponding 3D depth planes ($Z$-space).

---

## Where to Save Files
Always create test projects in a self-contained directory inside `tests/`:
```text
tests/<project-name>/
├── index.html       <-- The static HTML file
└── assets/          <-- Any local images/textures (if needed)
```
Do not place loose HTML files in the workspace root.
