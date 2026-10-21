---
name: code-motion
description: Create HTML/CSS motion graphics or static UI layouts that convert into native, editable After Effects compositions via the Code Motion extension. Use whenever the user says "code motion", "codeflow", "code motion static", "static html to after effects", "html to ae", "static to ae", "make a static UI for After Effects", "design a layout for AE", "make this editable in After Effects", "send this animation to AE", or asks for an HTML/SVG design to animate in After Effects. Supports both Mode A (deterministic animated motion graphics with keyframe easing) and Mode B (pure static layouts with 0 keyframes for manual AE animation).
---

# Code Motion: HTML/CSS to Native After Effects (Animated & Static)

Built for the **Code Motion** extension (by Revived Naim).

The Code Motion extension runs headless Chromium in virtual time, captures DOM elements, CSS styles, 3D transforms, and SVG paths, and constructs native, fully editable Adobe After Effects compositions (Text Layers, Vector Shape Layers, 2-Color Ramps, 3D Cameras, and Keyframe Easing).

---

## 1. Two Operating Modes (Determine User Intent)

### MODE A: Animated Motion Graphic
* **Use for**: Product promos, kinetic typography, animated UI, 3D rotating cards, charts, and social reels.
* **Requirements**:
  1. Timeline duration: `const DURATION = 3.0;`
  2. Deterministic frame renderer: `renderFrame(t)` driven strictly by time $t$.
  3. Deterministic seek hook: `window.seek = function(timeSeconds) { renderFrame(timeSeconds); };`
  4. Anti-drift rigid parenting: Animate `scale` and `opacity` on the parent container (e.g. `.plane pop`); keep children static relative to the container.

### MODE B: Static Layout (0 Keyframes)
* **Use for**: Static UI cards, dashboards, bento grids, landing pages, and vector graphics intended for manual animation in AE.
* **Requirements**:
  1. **ZERO JavaScript animations** (no `requestAnimationFrame`, no `window.seek`).
  2. **ZERO CSS transitions or `@keyframes`**. All elements sit at their resting layout state ($t = 0$).
  3. Timeline duration: `<script>const DURATION = 10;</script>` (defaults to 5s if omitted).
  4. Layers are built in AE with **0 keyframes**, ready for motion designers to animate by hand.

---

## 2. The 8 Universal Engine Rules (Follow Every Time)

### 1. Fixed-Size Viewport (`#stage`) & Auto-Fit
Always center elements inside a fixed-dimension stage (e.g. `1920x1080` for 16:9, `1080x1080` for 1:1, `1080x1920` for 9:16) with `overflow: hidden`. Include `fitToWindow()` in `<script>` so the preview scales cleanly in any browser:
```html
<div id="stage" style="position:absolute;left:50%;top:50%;width:1920px;height:1080px;margin:-540px 0 0 -960px;overflow:hidden">
  <!-- All UI elements go here -->
</div>
```

### 2. Timeline Duration Constant
Always declare `const DURATION = X;` in seconds. Without it, animated mode has to guess duration, and static mode defaults to 5 seconds.

### 3. Real, Live Editable Typography
* Text must be real HTML elements (`<h1>`, `<h2>`, `<p>`, `<span>`) or SVG `<text>`. Never outline fonts or use text images.
* Link Google Fonts cleanly in `<head>` (e.g. *Inter*, *Plus Jakarta Sans*, *Outfit*). Font size, color, weight, tracking, and alignment map directly to AE text properties.

### 4. Universal Rule: All Icons & Symbols Must Be Inline SVGs
**Always use inline `<svg>` for all icons, indicators, badges, hearts, stars, arrows, and checkmarks.**
* **Never use raw Unicode text characters (like `♥`, `★`, `✓`, `➜`) inside `<span>` tags**. Custom alphanumeric web fonts lack symbol glyph tables, causing After Effects to render missing question marks (`?`) or invisible blank spaces (`nil`).
* *Deep Dive & Vector SVG Templates*: See § 3 in [references/convert.md](file:///d:/Code/OCTOBER%202026/14%20Code%20flow%20extention/.agents/skills/code-motion/references/convert.md)

### 5. Vector Shapes, Roundness & Strokes
* Divs with backgrounds convert into native **AE Shape Layers**.
* `border-radius` maps to Vector Rect Roundness; `border` maps to Vector Stroke; `stroke-dasharray` maps to Vector Dashes (`ADBE Vector Dashes`).
* Line-drawing: Add `data-ae-trim="0 100"` to create native `ADBE Vector Filter - Trim` (Trim Paths).
* *Deep Dive*: See § 4 in [references/convert.md](file:///d:/Code/OCTOBER%202026/14%20Code%20flow%20extention/.agents/skills/code-motion/references/convert.md)

### 6. 2-Color Gradients, Drop Shadows & Plugins
* Use **2-color linear/radial gradients** (converts to native `ADBE Ramp`). Avoid 3+ color stops or conic gradients.
* `box-shadow` maps to native `ADBE Drop Shadow`; glow shadows map to native `ADBE Gaussian Blur 2`.
* 3rd-party plugins: Add `data-ae-effect="Deep Glow"` (automatic 40px native Gaussian Blur fallback if uninstalled).
* *Deep Dive*: See § 5 in [references/convert.md](file:///d:/Code/OCTOBER%202026/14%20Code%20flow%20extention/.agents/skills/code-motion/references/convert.md)

### 7. Semantic Layer Hygiene (`data-name` & Clean IDs)
Add `data-name="..."` to cards, buttons, badges, icons, headings, and containers. Code Motion directly translates these into clean Title Case layer names in the After Effects timeline (`Hero Card`, `Submit Button`, `Star Icon`).

### 8. Native CSS 3D Scenes (Creates Real AE 3D Cameras)
To generate a native After Effects 3D Camera with layers placed at their exact 3D Z-depth:
```html
<div id="stage">
  <div id="scene" style="perspective:1600px;perspective-origin:960px 540px;width:100%;height:100%;">
    <div id="rig" style="transform-style:preserve-3d;transform-origin:960px 540px;width:100%;height:100%;">
      <div class="plane" data-z="-150" data-name="Background Grid">...</div>
      <div class="plane" data-z="0" data-name="Main Card">...</div>
      <div class="plane pop" data-z="120" data-name="Floating Badge">...</div>
    </div>
  </div>
</div>
```
* *Deep Dive*: See § 6 & § 7 in [references/convert.md](file:///d:/Code/OCTOBER%202026/14%20Code%20flow%20extention/.agents/skills/code-motion/references/convert.md)

---

## 3. Master Technical Reference

All in-depth CSS-to-AE translations, vector SVG rules, plugin hooks, anti-drift parenting, and 3D camera math are consolidated into a single definitive reference file:
* **Master CSS-to-AE Conversion Guide**: [references/convert.md](file:///d:/Code/OCTOBER%202026/14%20Code%20flow%20extention/.agents/skills/code-motion/references/convert.md)
  - § 1: Operating Modes & Duration Sizing
  - § 2: CSS-to-After Effects Translation Table
  - § 3: Typography & The Universal Inline SVG Rule
  - § 4: Vector Shapes, Roundness & Trim Paths
  - § 5: Gradients, Visual Effects & 3rd-Party Plugins
  - § 6: Anti-Drift Parenting Architecture (Mode A)
  - § 7: Native CSS 3D Scene Rigs & Real AE 3D Cameras
  - § 8: What Stays Native Vector vs What Gets Rasterized

---

## 4. Deliver Workflow & File Placement

1. Always save test projects in a self-contained directory inside `tests/`:
   ```text
   tests/<project-name>/
   ├── index.html       <-- The HTML file
   └── assets/          <-- Local images, textures, audio (if needed)
   ```
2. User steps in After Effects:
   * Open **Window → Extensions → Code Motion**.
   * Drag & drop `index.html` (or paste via `Ctrl+V`).
   * Click **Build in AE**.
