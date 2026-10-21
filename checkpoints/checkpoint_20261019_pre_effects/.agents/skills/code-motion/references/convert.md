# What the Code Motion Panel Does with an HTML Animation

The **Code Motion** panel (by Revived Naim) opens the HTML page in headless Chrome or Edge, plays it in virtual time (stepping frame-by-frame via `window.seek` or internal clock), and captures the DOM structure, CSS transforms, 3D matrices, SVG vector geometries, and typography.

Then it fits Bezier easing curves and builds pristine, native After Effects compositions.

---

## 1. How Duration and Sizing are Determined
* **Animated HTML**: Set by `const DURATION = X;` in the script. The panel samples each frame via `window.seek(t)` and fits Bezier easing curves.
* **Static HTML (Zero Keyframes)**: If you just want a static layout to animate manually in After Effects, omit all animations and scripts. The panel automatically defaults to a clean **5-second static composition** (or whatever you set with `<script>const DURATION = 10;</script>`). All layers are created at resting position with **0 keyframes**.
* **Dimensions**: The fixed-dimension `#stage` viewport (e.g. 1080×1080, 1920×1080, 1080×1920) is detected and set as the native AE composition resolution.

---

## 2. Native, Editable After Effects Layers

* **Text Layers**:
  - Rendered with native AE Text layers in the exact font face.
  - Font files (`.woff`, `.ttf`, `.otf`) are automatically cached and registered with the OS font catalog.
  - Color, font size, tracking, and justification are fully preserved.
* **Shape Layers (Boxes & Divs)**:
  - Fills and stroke colors with opacity.
  - Corner rounding (`border-radius`) maps to AE Vector Rect Roundness.
  - Drop shadows map to native `ADBE Drop Shadow` effects.
  - 2-color linear gradients map to native `ADBE Ramp` effects.
* **Vector SVG Geometries**:
  - `<path>`, `<polygon>`, `<circle>`, `<rect>` map to AE Shape Groups with cubic Bezier paths (`inTangents`, `outTangents`, vertices).
  - SVG fills, stroke widths, and caps are translated to native AE Vector Fill/Stroke.
* **CSS 3D Scenes**:
  - `#scene` (`perspective`) + `.rig` (`transform-style: preserve-3d`) create a native **After Effects 3D Camera** (focal length derived from perspective) with depth-sorted 3D planar layers.
* **Hierarchy Parenting**:
  - Container groups (`.plane (group)`, `.badge (group)`) automatically parent nested children (text, icons, shapes) to the container shape.
  - Cancels out phantom motion drift and locks local offsets so badges scale as solid, rigid bodies.
* **Media & Audio**:
  - Images (`<img>`, SVG `<image>`) become footage layers.
  - Videos (`<video>`, H.264 MP4) become time-remapped footage layers.
  - Audio (`<audio data-start>`) becomes audio layers starting at the specified time offset.

---

## 3. What Gets Rendered as Pictures (and Why)
The panel converts almost everything into native vector shapes. A few CSS/browser features have no native AE shape equivalent and are rendered as raster footage layers:
* `<canvas>` and WebGL rendering (PNG/JPEG frames).
* Complex gradients with 3 or more color stops, conic gradients, or radial pattern repeats.
* Advanced SVG filters like displacement, turbulence, or custom SVG filter chains.
* Per-side asymmetric borders (different colors/widths on top vs left).
* Pseudo-element decorations (`::before` / `::after`).

---

## 4. Fonts and Typography
* Any Google Font included via `<link rel="stylesheet">` or local `@font-face` is supported.
* Standard font weights (100–900) map cleanly to After Effects font families.
