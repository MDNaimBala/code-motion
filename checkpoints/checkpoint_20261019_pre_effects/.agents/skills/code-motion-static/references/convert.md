# Static HTML/CSS to Native After Effects Reference Guide

This document outlines how the **Code Motion** extension (by Revived Naim) converts static web layouts into pristine, editable Adobe After Effects compositions with **zero keyframes**.

---

## 1. How Static Conversion Works

When a static HTML file is dropped into Code Motion:
1. **Headless Browser Launch**: Chrome or Edge opens the HTML file at the native resolution specified by `#stage`.
2. **DOM Traversal & Computed Style Extraction**: Every element's bounding rect, computed styles, text metrics, border radii, shadows, and SVG paths are sampled at resting state ($t = 0$).
3. **Zero-Keyframe JSON Output**: The converter writes `codeflow.json` containing the composition structure, all layer dimensions, static transform values, and font references. No keyframes are created (`keys: 0`).
4. **ExtendScript Build**: Inside After Effects, `builder.jsx` builds native compositions, text layers, vector shape layers, and masks.

---

## 2. CSS-to-After Effects Translation Table

| CSS Property | After Effects Mapping | Editable in AE? |
| :--- | :--- | :--- |
| `font-family`, `font-size`, `color` | Native AE Text Layer (`Source Text`) | **Yes** (live text) |
| `font-weight`, `letter-spacing` | Text Document tracking & faux weight | **Yes** |
| `background-color` | Vector Shape `ADBE Vector Graphic - Fill` | **Yes** (color picker) |
| `border-radius` | Vector Shape `ADBE Vector Rect Roundness` | **Yes** (parametric) |
| `border: Xpx solid Color` | Vector Shape `ADBE Vector Graphic - Stroke` | **Yes** (stroke width & color) |
| `box-shadow` | Native Layer Effect `ADBE Drop Shadow` | **Yes** (distance, softness, angle) |
| `linear-gradient(2 stops)` | Native Layer Effect `ADBE Ramp` (Gradient) | **Yes** (start/end colors & points) |
| `<svg><path ... /></svg>` | Vector Shape `ADBE Vector Shape` (Bezier Path) | **Yes** (pen tool & vertices) |
| `<svg><circle ... /></svg>` | Vector Shape `ADBE Vector Shape - Ellipse` | **Yes** (parametric size) |
| `opacity` | Transform `ADBE Opacity` | **Yes** (0–100%) |
| `transform: scale() rotate()` | Transform `ADBE Scale`, `ADBE Rotation` | **Yes** (resting values) |
| `<img>`, SVG `<image>` | Footage Layer (`assets/image.png`) | **Yes** (standard footage) |

---

## 3. What Stays Native Vector vs What Gets Rasterized

### 100% Native Vector (Preferred):
* **Live Text**: All headings, paragraphs, spans with Google Fonts or web fonts.
* **Containers & Cards**: Rectangles with rounded corners, solid fills, and drop shadows.
* **Vector Icons**: Standard SVG paths, polygons, circles, and rectangles.
* **2-Color Linear Gradients**: Maps directly to AE's native `Ramp` effect.

### Rasterized to Footage (Avoid if you want full vector control):
* Complex gradients with 3+ color stops, radial gradient repeats, or conic gradients.
* Asymmetric borders (e.g. `border-top: 2px solid red` but `border-bottom: 0`).
* Complex CSS filter chains (e.g. `filter: blur(10px) contrast(200%)`).
* CSS `clip-path: polygon(...)` (use standard SVG shapes instead).
* Pseudo-elements (`::before`, `::after`).

---

## 4. Setting Comp Size & Duration

* **Composition Size**: Defined strictly by `#stage` width & height:
  ```html
  <div id="stage" style="width: 1920px; height: 1080px; position: absolute; left: 0; top: 0;">
  ```
* **Composition Duration**:
  - Code Motion defaults to **5 seconds** if no script is present.
  - To specify a custom duration (e.g. 10 or 15 seconds), add a one-line script:
    ```html
    <script>const DURATION = 10;</script>
    ```

---

## 5. Web Fonts & Asset Handling

* Google Fonts linked via `<link rel="stylesheet">` are automatically downloaded and registered into the system font registry by the Code Motion panel before the build begins.
* Local images and textures must be stored in an `assets/` subfolder right next to `index.html` to guarantee relative asset paths resolve without error.
