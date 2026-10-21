# Code Motion ⚡

> **Convert HTML, CSS, SVG & Canvas into Native, Fully Editable Adobe After Effects Compositions.**

[![Adobe After Effects](https://img.shields.io/badge/Adobe%20After%20Effects-2022--2026%2B-9999FF?logo=adobeaftereffects&logoColor=white)](https://www.adobe.com/products/aftereffects.html)
[![CEP Version](https://img.shields.io/badge/Adobe%20CEP-11.0%2B-orange.svg)](https://github.com/Adobe-CEP)
[![Status](https://img.shields.io/badge/status-active%20%7C%20production%20ready-brightgreen.svg)](#)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#)

---

## 📖 Overview

**Code Motion** (by Revived Naim) is an Adobe After Effects CEP extension and execution pipeline that transforms code-driven animations and modern web layouts directly into **100% native, hand-editable After Effects layers**.

Instead of screen recordings, rasterized movie clips, or painful manual rebuilding:
1. Code Motion renders your HTML/CSS/SVG in headless Chromium in virtual time.
2. It samples bounding geometry, computed CSS styles, 3D matrices, typography, and SVG Bézier paths.
3. It constructs native **AE Shape Layers**, **Live Text Layers**, **2-Color Ramps**, **3D Cameras**, and **Bézier Keyframe Easing** inside your After Effects timeline.

---

## ✨ Key Features

* ✍️ **100% Live Editable Typography**: Headings, paragraphs, and spans map to native AE Text Layers with exact font weights, colors, tracking (letter-spacing), and alignment.
* 🔷 **Parametric Vector Shapes**: Divs with backgrounds become native AE Shape Layers. `border-radius` maps to parametric Vector Rect Roundness; borders map to Vector Strokes.
* 📐 **True SVG Bézier Paths**: Inline `<svg>` icons, paths, polygons, and circles convert into native AE Bézier Shape paths with editable vertices and tangents.
* 🌈 **Native 2-Color Ramps**: CSS `linear-gradient` and `radial-gradient` convert into native `ADBE Ramp` effects (Linear & Radial shapes).
* 🎥 **Native CSS 3D Scene Rigs**: Perspective containers (`perspective: 1600px` and `transform-style: preserve-3d`) create a real two-node **After Effects 3D Camera** with layers positioned at exact Z-depths.
* ✂️ **Parametric Trim Paths**: Add `data-ae-trim="0 100"` to any stroked shape or vector path to generate native `ADBE Vector Filter - Trim` (Trim Paths) with animatable Start/End/Offset.
* 🛡️ **Anti-Drift Parenting Harmonizer**: Eliminates coordinate drift during scale entrance pops by automatically parenting child elements to container cards with static local offsets.
* ✨ **3rd-Party Plugin Integration**: Declare professional effects with `data-ae-effect="Deep Glow"`. If Deep Glow is installed, it applies natively; if absent, Code Motion automatically falls back to native 40px Gaussian Blur without failing.
* 📋 **Instant Clipboard Paste (Ctrl+V)**: Drop files into the panel or simply press `Ctrl+V` to paste raw HTML code directly into After Effects.
* 🏷️ **Studio Timeline Color-Coding**: Automatically color-codes layers in your AE timeline (🔴 Red: Cameras/Nulls, 🔵 Lavender: Typography, 🟨 Sandstone: Shapes/Cards, 🟣 Purple: Precomps, 🟠 Orange: Media/Footage).

---

## 🎯 Two Operating Modes

Code Motion supports two distinct production workflows:

### Mode A: Animated Motion Graphic
* **Use Cases**: Product promos, kinetic typography, animated UI cards, rising charts, 3D rotating devices, social reels.
* **Mechanism**: Runs virtual-time frame sampling driven by `window.seek(t)`, `renderFrame(t)`, and `const DURATION`.
* **Output**: Smooth, frame-accurate cubic Bézier keyframe easing on Position, Scale, Rotation, and Opacity.

### Mode B: Static Layout / Zero Keyframes
* **Use Cases**: Dashboards, bento grids, design systems, landing pages, and UI components created for manual animation in AE.
* **Mechanism**: Evaluates the resting layout at $t = 0$ with **zero animation loops** and **zero CSS transitions**.
* **Output**: A pristine composition containing all structural shapes, vectors, live text, and shadows with **0 keyframes**, ready for motion designers to animate by hand.

---

## 📊 CSS to After Effects Translation Matrix

| CSS / HTML Feature | After Effects Layer & Property | Editable in AE? |
| :--- | :--- | :---: |
| `<h1>`, `<p>`, `<span>`, SVG `<text>` | Native AE Text Layer (`Source Text`) | ✅ Live Text |
| `font-size`, `color`, `letter-spacing` | Character Tracking, Normalized Fill RGB | ✅ |
| `background-color` | `ADBE Vector Graphic - Fill` | ✅ Color Picker |
| `border-radius: 20px` | `ADBE Vector Rect Roundness` | ✅ Parametric |
| `border: 2px solid Color` | `ADBE Vector Graphic - Stroke` | ✅ Width & Color |
| `stroke-dasharray="8 6"` | `ADBE Vector Dashes` (Dash & Gap) | ✅ |
| `stroke-linecap="round"` | Vector Line Cap (`Round Cap`) | ✅ |
| `<svg><path ... /></svg>` | `ADBE Vector Shape` (Bézier Path) | ✅ Pen Tool & Vertices |
| Inline SVGs (`♥`, `★`, `✓`, icons) | Vector Shape Group (`ADBE Vector Shape - Group`) | ✅ Vector Resolution-Free |
| `linear-gradient` (2 stops) | Native Layer Effect `ADBE Ramp` (Linear, shape 1) | ✅ Ramp Points & Colors |
| `radial-gradient` (2 stops) | Native Layer Effect `ADBE Ramp` (Radial, shape 2) | ✅ Radius & Center |
| `box-shadow` | Native Layer Effect `ADBE Drop Shadow` | ✅ Softness & Distance |
| `data-ae-trim="0 100"` | `ADBE Vector Filter - Trim` (Trim Paths) | ✅ Start, End, Offset |
| `data-ae-effect="Deep Glow"` | 3rd-Party Plugin (auto-fallback to 40px Blur) | ✅ Safe Fallback |
| `#scene` + `#rig` (3D CSS) | Real Two-Node 3D Camera & Planar 3D Layers | ✅ True 3D Space |

> ⚠️ **Important Typography Rule**: Always use inline `<svg>` for icons and symbols. Standard web fonts lack pictographic symbol glyph tables; while browsers silently fall back, After Effects renders unmapped Unicode characters as missing question marks (`?`) or invisible blanks (`nil`).

---

## 🚀 Installation

### 1. Copy Extension Files
Copy the `CodeMotion` folder into your Adobe CEP extensions directory:

* **Windows**:
  ```text
  C:\Users\<YourUsername>\AppData\Roaming\Adobe\CEP\extensions\CodeMotion
  ```
  *(Or system-wide: `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\CodeMotion`)*

* **macOS**:
  ```text
  ~/Library/Application Support/Adobe/CEP/extensions/CodeMotion
  ```
  *(Or system-wide: `/Library/Application Support/Adobe/CEP/extensions/CodeMotion`)*

### 2. Enable Debug Mode
Ensure Adobe CEP allows unsigned development extensions:

* **Windows (PowerShell)**:
  ```powershell
  reg add "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d "1" /f
  ```
* **macOS (Terminal)**:
  ```bash
  defaults write com.adobe.CSXS.11 PlayerDebugMode 1
  ```

### 3. Launch in After Effects
1. Open Adobe After Effects (2022, 2023, 2024, 2025, or 2026+).
2. Go to **Window → Extensions → Code Motion**.
3. Dock the sleek monochrome panel anywhere in your workspace.

---

## 🛠️ Usage

### Workflow 1: Drag & Drop
1. Author your HTML file (or use an AI to generate one using our skills).
2. Drag and drop `index.html` onto the Code Motion panel.
3. Review the parsed statistics (Compositions, Layers, Duration, Fonts).
4. Choose target: **New Composition** or **Active Composition**.
5. Click **Build in AE**.

### Workflow 2: Instant Clipboard Paste (`Ctrl + V`)
1. Copy any HTML snippet from your browser, chat, or editor (`Ctrl + C`).
2. Focus the Code Motion panel in AE and press **`Ctrl + V`** (or click **Paste Code**).
3. Click **Build in AE** — the composition builds instantly.

---

## 🤖 AI Agent Integration

Code Motion includes complete integrations for modern AI agents and coding assistants:

### 1. Agent Skill (`.agents/skills/code-motion/`)
For IDEs that support agent skills (Cursor, Antigravity, Claude Code):
* **Master Skill**: [.agents/skills/code-motion/SKILL.md](file:///.agents/skills/code-motion/SKILL.md)
* **Master Technical Reference**: [.agents/skills/code-motion/references/convert.md](file:///.agents/skills/code-motion/references/convert.md)
* **Standalone Distributable Skill**: Located in `codeflow-skill/codeflow/`

### 2. Universal Master System Prompt (`CODE_MOTION_SYSTEM_PROMPT.md`)
For standard web AI models (ChatGPT, Claude Web, Gemini Web, DeepSeek):
* Copy and paste [CODE_MOTION_SYSTEM_PROMPT.md](file:///CODE_MOTION_SYSTEM_PROMPT.md) into your chat. The model will reliably generate 100% compliant Code Motion HTML code.

---

## 🧪 Testing & Verification

Code Motion includes an automated headless simulation suite that verifies DOM extraction, ExtendScript building, layer parenting, keyframe curves, and SVG paths:

```bash
node scratch/simulate_all.js
```

```text
================================================================
TOTAL SUITES: 5/5 PASSED
TOTAL CHECKS: 72/72 PASSED
================================================================
>>> ALL SIMULATIONS PASSED WITH 0 ERRORS! <<<
```

---

## 📁 Repository Structure

```text
├── CodeMotion/               # The Adobe CEP Extension
│   ├── CSXS/manifest.xml     # Extension registration & permissions
│   ├── client/               # Chromium CEP frontend (monochrome UI, tracer, fonts)
│   └── host/                 # ExtendScript engine (builder.jsx, boot.jsx)
│
├── .agents/skills/           # AI Customization System
│   └── code-motion/          # Unified Master Skill (Animated & Static)
│       ├── SKILL.md          # Skill instruction file
│       └── references/       # Consolidated technical reference
│           └── convert.md    # CSS-to-AE mapping, SVG rules, effects, 3D math
│
├── codeflow-skill/           # Standalone exportable skill package
├── tests/                    # Pre-built HTML test suites (cards, SAAS, 3D HUDs)
├── scratch/                  # Headless testing & simulation runner
├── CODE_MOTION_SYSTEM_PROMPT.md # Universal prompt for standard web AI models
├── ARCHITECTURE.md           # Detailed technical architecture breakdown
├── CONTEXT.md                # Engineering milestones & solved challenges
└── PROGRESS.md               # Feature & test milestone tracker
```

---

## 👤 Author & Credits

* **Developer**: Revived Naim ([MDNaimBala](https://github.com/MDNaimBala))
* **Repository**: [https://github.com/MDNaimBala/code-motion](https://github.com/MDNaimBala/code-motion)

---

## 📄 License

MIT License. Feel free to use, modify, and distribute for commercial or personal motion graphics projects.
