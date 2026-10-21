# Code Motion: Comprehensive HTML/CSS to Native After Effects Reference Guide

The **Code Motion** extension (by Revived Naim) converts HTML/CSS animations and static layouts into pristine, fully editable Adobe After Effects compositions. Headless Chromium evaluates the page in virtual time, fits cubic Bézier easing curves, and constructs native AE Shape Layers, Live Text Layers, 2-Color Ramps, 3D Cameras, and Keyframe Easing.

---

## 1. Operating Modes & Duration Sizing

### MODE A: Animated Motion Graphic
* **Purpose**: Product promos, kinetic typography, animated UI, 3D rotating cards, charts, and social reels.
* **Duration**: Set by `const DURATION = 3.0;` (in seconds).
* **Frame Renderer**: Must implement deterministic `renderFrame(t)` driven strictly by time $t$.
* **Seek Hook**: Must implement `window.seek = function(timeSeconds) { renderFrame(timeSeconds); };`.
* **Rigid Parenting**: Wrap scaling badges/cards in a container; animate scale/opacity on the container only.

### MODE B: Static Layout (0 Keyframes)
* **Purpose**: Static UI cards, dashboards, bento grids, and landing pages designed for manual animation by motion designers in AE.
* **Duration**: Specify composition length via `<script>const DURATION = 10;</script>` (defaults to 5 seconds if omitted).
* **Zero Keyframes**: **No** `window.seek`, **no** `requestAnimationFrame`, **no** CSS transitions, **no** `@keyframes`. All elements sit at their resting layout state ($t = 0$).

### Viewport Dimensions (`#stage`)
* All compositions must be wrapped in a fixed-dimension `#stage` container (e.g. `1920x1080` for 16:9, `1080x1080` for 1:1, `1080x1920` for 9:16 reels), centered via CSS.
* Include `fitToWindow()` in `<script>` so the preview scales responsively in any browser window without altering the internal pixel dimensions.

---

## 2. CSS-to-After Effects Translation Table

| CSS / HTML Property | After Effects Mapping | Editable in AE? |
| :--- | :--- | :--- |
| `font-family`, `font-size`, `color` | Native AE Text Layer (`Source Text`) | **Yes** (live text) |
| `font-weight`, `letter-spacing` | Text Document tracking & faux weight | **Yes** |
| `background-color` | Vector Shape `ADBE Vector Graphic - Fill` | **Yes** (color picker) |
| `border-radius` | Vector Shape `ADBE Vector Rect Roundness` | **Yes** (parametric) |
| `border: Xpx solid Color` | Vector Shape `ADBE Vector Graphic - Stroke` | **Yes** (stroke width & color) |
| `stroke-dasharray="8 6"` | Vector Stroke `ADBE Vector Dashes` (Dash & Gap) | **Yes** (dash/gap spacing) |
| `stroke-linecap="round"` | Vector Stroke Line Cap (`Round Cap`) | **Yes** (cap style) |
| `data-ae-trim="0 100"` | Vector Trim Paths `ADBE Vector Filter - Trim` | **Yes** (Start, End, Offset) |
| `box-shadow: 0 X Y Color` | Native Layer Effect `ADBE Drop Shadow` | **Yes** (distance, softness, angle) |
| `box-shadow: 0 0 Xpx Glow` | Dedicated Blurred Layer `ADBE Gaussian Blur 2` | **Yes** (glow radius & color) |
| `linear-gradient(2 stops)` | Native Layer Effect `ADBE Ramp` (Linear, shape 1) | **Yes** (colors & ramp points) |
| `radial-gradient(...)` | Native Layer Effect `ADBE Ramp` (Radial, shape 2) | **Yes** (center point & radius) |
| `data-ae-effect="Deep Glow"` | 3rd-Party Plugin (e.g. Deep Glow) with auto-fallback | **Yes** (native 40px blur fallback if absent) |
| `<svg><path ... /></svg>` | Vector Shape `ADBE Vector Shape` (Bezier Path) | **Yes** (pen tool & vertices) |
| `<svg><circle ... /></svg>` | Vector Shape `ADBE Vector Shape - Ellipse` | **Yes** (parametric size) |
| **Icons & Symbols** (Inline SVG) | Vector Shape Layer (`ADBE Vector Shape - Group`) | **Yes** (100% vector, zero font dependency) |
| **Icons via Raw Text** (`♥`, `★`) | Text Layer (fails if font lacks glyph: shows `?` or `nil`) | ❌ **Avoid** (use inline SVG instead) |
| `opacity` | Transform `ADBE Opacity` | **Yes** (0–100%) |
| `transform: scale() rotate()` | Transform `ADBE Scale`, `ADBE Rotation` | **Yes** (animatable) |
| `<img>`, SVG `<image>` | Footage Layer (`assets/image.png`) | **Yes** (standard footage) |
| `<video>` (H.264 MP4) | Time-remapped Footage Layer | **Yes** |
| `<audio data-start>` | Audio Layer starting at offset | **Yes** |
| `#scene` + `.rig` | Native After Effects 3D Camera & 3D Planar Layers | **Yes** (true 3D space) |

---

## 3. Typography & The Universal Inline SVG Rule

### Live Editable Typography
* Words must be real HTML elements (`<h1>`, `<h2>`, `<p>`, `<span>`) or SVG `<text>`. Never outline fonts or render text as bitmap images.
* Link Google Fonts cleanly in `<head>` (e.g. `Inter`, `Plus Jakarta Sans`, `Outfit`).
* Font size, color, font-weight, letter-spacing (tracking), and alignment map directly to AE text properties.

### Universal Rule: All Icons & Symbols Must Be Inline SVGs
Always use inline `<svg>` elements (`<svg viewBox="0 0 24 24" fill="currentColor">...`) for all icons, indicators, badges, hearts, stars, arrows, and checkmarks.

#### ❌ NEVER Use Raw Unicode Characters in `<span>`:
```html
<!-- FAILS IN AFTER EFFECTS -->
<span class="heart">♥</span>
<span class="star">★</span>
<span class="check">✓</span>
```

#### Why Raw Unicode Characters Break in After Effects:
1. **Browser Fallback Illusion**: In Chrome or Edge, when an alphanumeric font (like *Inter* or *Plus Jakarta Sans*) lacks glyphs for `♥` or `★`, the browser automatically borrows the glyph from Windows' `Segoe UI Symbol` or macOS's `Apple Symbols`.
2. **After Effects Text Engine**: After Effects does **not** perform automatic per-character font fallback. When `textDoc.font` is set to your UI font, After Effects queries that font's character map. If the glyph is missing:
   * For `★` (U+2605): AE renders the font's missing-glyph replacement (.notdef), resulting in a literal **yellow question mark `?`**.
   * For `♥` (U+2665): AE renders an invisible zero-width character (**`nil` / blank space**).

#### ✅ Standard Inline SVG Icon Patterns:
```html
<!-- Heart Icon -->
<svg class="heart" data-name="Heart Icon" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
</svg>

<!-- Star Icon -->
<svg class="star" data-name="Rank Star" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
</svg>

<!-- Checkmark Icon -->
<svg class="check" data-name="Check Icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <polyline points="20 6 9 17 4 12"/>
</svg>

<!-- Arrow Right Icon -->
<svg class="arrow" data-name="Arrow Icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
</svg>
```
*Why SVGs Always Work*: Code Motion converts `<svg>` elements directly into native **After Effects Bezier Shape Layers (`ADBE Vector Shape - Group`)**. Shape layers are purely mathematical vector paths that never rely on font files, never suffer missing-glyph replacement, and remain 100% resolution-independent in After Effects.

---

## 4. Vector Shapes, Roundness & Trim Paths

* **Boxes & Cards**: Divs with backgrounds become native AE Shape Layers with parametric rectangles.
* **Corner Roundness**: `border-radius: 20px;` maps to native `ADBE Vector Rect Roundness`.
* **Borders & Strokes**: `border: 2px solid #6366f1;` maps to native `ADBE Vector Graphic - Stroke`.
* **Dashed Borders**: `stroke-dasharray="8 6"` maps to native `ADBE Vector Dashes` (Dash & Gap).
* **Line Caps & Joins**: `stroke-linecap="round"` and `stroke-linejoin="round"` map to native Round Cap & Round Join.
* **Line-Drawing & Trim Paths**: Add `data-ae-trim="start,end"` (e.g. `data-ae-trim="0 100"`) to any SVG path or stroked shape. Code Motion automatically applies a native `ADBE Vector Filter - Trim` (Trim Paths) operator with animatable Start, End, and Offset properties.
* **Studio Timeline Color-Coding**: Code Motion automatically color-codes your timeline (🔴 Red: Cameras/Nulls, 🔵 Lavender: Typography, 🟨 Sandstone: Shapes/Cards, 🟣 Purple: Precomps, 🟠 Orange: Media/Footage).

---

## 5. Gradients, Visual Effects & 3rd-Party Plugins

### Native Gradients (2-Color Only)
* `linear-gradient(...)` with exactly 2 color stops converts into native `ADBE Ramp` (Linear, shape 1).
* `radial-gradient(...)` with exactly 2 color stops converts into native `ADBE Ramp` (Radial, shape 2).
* *Strict Rule*: Never use 3+ color stops or conic gradients, as they cannot be mapped to native Ramp effects and force rasterization.

### Drop Shadows & Vector Glows
* `box-shadow: 0 20px 40px rgba(0,0,0,0.5)` converts into a native `ADBE Drop Shadow` effect.
* Glow elements with `box-shadow: 0 0 45px rgba(...)` convert into dedicated vector shape glow layers with native `ADBE Gaussian Blur 2`.

### 3rd-Party After Effects Plugins (e.g. Deep Glow)
Request professional plugins on any layer using `data-ae-effect="<Plugin Name>"` (or `data-plugin="..."`):
```html
<div class="neon-orb" data-name="Neon Glow" data-ae-effect="Deep Glow"></div>
```
*Automatic Fallback Protection*: If the user has Deep Glow installed, Code Motion applies the native plugin directly. If not installed, Code Motion catches the exception, applies a native 40px `ADBE Gaussian Blur 2` fallback, and logs an amber warning in the extension console without failing the build.

### Effects to Avoid (Prevent Silent Degradation)
1. **`backdrop-filter: blur(...)`**: Browsers render this, but AE vector shape layers cannot natively sample background composites in real-time this way. Use semi-transparent `background: rgba(...)` with crisp borders instead.
2. **CSS `filter: blur(...)` on structural card layouts**: Blurring card containers forces pixel rasterization. Use `box-shadow` or `data-ae-effect="Deep Glow"` on dedicated glow plates instead.

---

## 6. Anti-Drift Parenting Architecture (Mode A)

### The Drift Problem
When an HTML card or badge scales up during an entrance pop animation (e.g. from scale 0 to 1 with an overshoot bounce), nested children (icons, circle backgrounds, text labels) can desynchronize if they are animated individually.

### The Golden Rule of Container Rigging
1. **Wrap in a Parent Container**:
   Wrap the entire badge, chip, or card in a single container element:
   ```html
   <div class="plane pop" data-name="Pro Badge">
     <div class="badge-bg"></div>
     <svg class="badge-icon" viewBox="0 0 24 24">...</svg>
     <span class="badge-text">PRO MEMBER</span>
   </div>
   ```
2. **Animate ONLY the Container**:
   Apply entrance `scale`, `opacity`, or `translate` **strictly to the parent container** in your `renderFrame(t)` function:
   ```javascript
   const badgeProgress = easeOutBack(Math.min(t / 0.8, 1));
   proBadge.style.transform = `scale(${badgeProgress})`;
   proBadge.style.opacity = Math.min(t / 0.2, 1);
   ```
3. **Keep Children Static Locally**:
   Keep all internal elements at static CSS positions relative to their parent container. Do not apply dynamic CSS transforms or keyframes to the child elements.
4. **How Code Motion Harmonizes Parenting in AE**:
   Code Motion detects that the children maintain constant local offsets relative to the parent container bounding box, and automatically parents the child layers to the container layer using `childLayer.setParentWithJump(parentLayer)`. This locks all children into a rigid solid unit with **zero coordinate drift**.

---

## 7. Native CSS 3D Scene Rigs & Real AE 3D Cameras

Code Motion detects a CSS 3D perspective rig and translates it into a native **After Effects 3D Camera** with planar layers positioned at exact 3D Z-depth coordinates:

```html
<div id="stage">
  <div id="scene" style="perspective:1600px;perspective-origin:960px 540px;width:100%;height:100%;">
    <div id="rig" style="transform-style:preserve-3d;transform-origin:960px 540px;width:100%;height:100%;">
      <!-- 3D elements with data-z="..." -->
      <div class="plane" data-z="-200" data-name="Background Grid">...</div>
      <div class="plane" data-z="0" data-name="Main Content Card">...</div>
      <div class="plane pop" data-z="140" data-name="Floating Badge">...</div>
    </div>
  </div>
</div>
```

### JavaScript Parallax Ratio Initialization:
```javascript
const PERSPECTIVE = 1600;
const ORIGIN_X = 960;
const ORIGIN_Y = 540;

document.querySelectorAll('.plane').forEach(plane => {
  const z = parseFloat(plane.dataset.z || 0);
  const scaleRatio = (PERSPECTIVE - z) / PERSPECTIVE;
  const layer = document.createElement('div');
  layer.className = 'layer';
  plane.parentNode.insertBefore(layer, plane);
  layer.appendChild(plane);
  layer.style.transformOrigin = `${ORIGIN_X}px ${ORIGIN_Y}px`;
  layer.style.transform = `translateZ(${z}px) scale(${scaleRatio.toFixed(5)})`;
});
```

### Translation to After Effects:
1. **Camera**: Creates an After Effects two-node 3D Camera named `Camera` with Zoom calculated from `perspective: 1600px`.
2. **3D Layers**: Enables `threeDLayer = true` on every `.plane` layer in the comp.
3. **Z-Coordinates**: Positions each layer along the Z-axis according to its `data-z` offset.

---

## 8. What Stays Native Vector vs What Gets Rasterized

### 100% Native Vector (Preferred):
* **Live Text**: All headings, paragraphs, spans with Google Fonts or web fonts.
* **Containers & Cards**: Rectangles with rounded corners, solid fills, and drop shadows.
* **Vector Icons & Symbols**: Standard SVG paths, polygons, circles, rectangles, hearts, stars, arrows (`<svg>`).
* **2-Color Linear & Radial Gradients**: Maps directly to AE's native `ADBE Ramp` effect with Linear (1) or Radial (2) shape.
* **Vector Strokes & Dashes**: Native Dash, Gap, Round Cap, and Round Join.
* **3rd-Party AE Plugins**: `data-ae-effect="Deep Glow"` directly applies the plugin with graceful native Gaussian Blur fallback.
* **Rigid Parenting**: Container groups (`.plane pop`) automatically parent internal children in AE to prevent entrance pop drift.

### Rasterized, Broken, or Skipped (Avoid):
* **Raw Unicode symbols as text** (e.g. `<span>♥</span>`, `<span>★</span>`, `<span>✓</span>`). Custom web fonts lack symbol glyph tables; while browsers silently fall back, After Effects renders unmapped characters as missing `?` or `nil`. Always use inline `<svg>`.
* Complex gradients with 3+ color stops or conic gradients (rasterized to footage).
* `backdrop-filter: blur(...)` (skipped or flat; use semi-transparent `background: rgba(...)` + border instead).
* Asymmetric borders (e.g. `border-top: 2px solid red` but `border-bottom: 0`).
* Complex CSS filter chains (e.g. `filter: blur(10px) contrast(200%)`).
* CSS `clip-path: polygon(...)` (use standard SVG shapes instead).
* Pseudo-elements (`::before`, `::after`).
