# Code Motion — Architecture & Codebase Map

> [!IMPORTANT]
> **Environment Notice**:  
> Current development was performed on the **father's laptop** (`d:\Code\OCTOBER 2026\14 Code flow extention`).  
> Sync this entire directory if moving back to your main workstation.

Code Motion is a high-performance Adobe After Effects (CEP) extension that converts web animations (HTML, SVG DOM hierarchies, Canvas, CSS keyframes, and web fonts) into native After Effects shape layers and keyframes.

---

## 1. Directory Structure

```
d:/Code/OCTOBER 2026/14 Code flow extention/
├── CodeMotion/                      # ACTIVE CEP Extension (Linked to Adobe CEP via Junction)
│   ├── CSXS/
│   │   └── manifest.xml             # CEP Extension descriptor (registers panel & permissions)
│   ├── client/                      # Front-End (Chromium CEF inside After Effects)
│   │   ├── css/
│   │   │   └── style.css            # Native AE monochrome panel styling + warning badges
│   │   ├── index.html               # Clean, semantic panel HTML structure
│   │   ├── main.js                  # Client controller, paste handler, effects scanner, warning display
│   │   ├── fonts.js                 # Automatic Windows & macOS font installer
│   │   ├── zip.js                   # CodeFlow package unpacker
│   │   ├── CSInterface.js           # Adobe CEP communication bridge
│   │   └── trace/
│   │       └── converter.js         # Headless Chrome trace engine (HTML DOM/Canvas -> JSON)
│   └── host/                        # ExtendScript Engine (Runs inside After Effects Core)
│       ├── boot.jsx                 # Lightweight host initialization
│       └── builder.jsx              # ExtendScript AE builder (creates comps, shapes, paths, text, effects, plugins)
│
├── .agents/                         # Agent Customizations & Skills
│   └── skills/
│       └── code-motion/             # Unified HTML/CSS to AE skill (Animated Mode A & Static 0-Keyframe Mode B)
│           ├── SKILL.md             # Master skill instruction file
│           └── references/          # Consolidated technical reference
│               └── convert.md       # Master CSS-to-AE mapping, SVG rules, effects, 3D math
│
├── checkpoints/                     # Safety backups for zero-risk rollbacks
│   └── checkpoint_20261019_pre_effects/ # Full baseline snapshot prior to effects & warning upgrades
│
├── tests/                           # Consolidated, self-contained test suites
│   ├── flowly-saas/                 # 2D rising chart + auto-parenting test
│   ├── custom-test/                 # 3D rotating cards + EMV chip test
│   ├── orbit-cards/                 # 3D orbiting card carousel
│   ├── spatial-player/              # 2D/3D audio player HUD
│   ├── spatial-audio-hud/           # Circular gauges & overlays
│   ├── engine-test/                 # 3D camera & 2-color gradient test
│   ├── static-card/                 # Pure static 0-keyframe SaaS card
│   └── pasted/                      # Clipboard paste staging area
│
├── scratch/                         # Automated simulation & audit engine (simulate_audit.js)
├── ARCHITECTURE.md                  # This architecture reference guide
├── CONTEXT.md                       # High-level architecture & solved engineering challenges
├── PROGRESS.md                      # Milestone & test suite progress tracker
└── design.md                        # User design system specification
```

---

## 2. Core Modules & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        1. User Interface                               │
│  - User drops an .html file or clicks "Browse…"                        │
│  - client/main.js handles drop & triggers pipeline                     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        2. Headless Tracer                              │
│  - client/trace/converter.js opens local Chrome via CDP                │
│  - Evaluates HTML frames at 30/60 fps                                  │
│  - Exports structured animation tree to codeflow.json + assets/        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        3. Font Manager                                 │
│  - client/fonts.js extracts web fonts from animation data              │
│  - Verifies & auto-registers fonts on Windows/macOS for After Effects  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        4. ExtendScript Host Engine                     │
│  - client/main.js invokes host/builder.jsx via CSInterface.evalScript  │
│  - MotionFlowBuilder.build(jsonPath, targetMode) creates comps         │
│  - Generates Shape Layers, Paths, Keyframes, Transforms, Gradients     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Module Responsibilities

### Module 1: Client Controller (`client/main.js`)
* **Role**: Orchestrates the UI panel, receives drag-and-drop actions, triggers conversion, and sends commands to ExtendScript.
* **DOM Contract**: Binds exactly 21 DOM IDs in `client/index.html`:
  - `empty`, `drop`, `open`: Empty-state drop zone.
  - `loaded`, `fname`, `fdir`, `fwhere`: Loaded file header and explorer link.
  - `sComps`, `sLayers`, `sDur`, `fontsRow`: Bento inspection metrics.
  - `targetBox`, `tNew`, `tActive`, `tHint`: Target composition switcher.
  - `buildBox`, `build`, `clear`: Primary action triggers.
  - `result`, `log`: Real-time monospace console drawer.
  - `statusFoot`, `ver`: Bottom bar status indicators.
* **Dev Guard**: Safely detects whether running inside Adobe CEP (`isNode`) or a standard browser to prevent crashes during external previewing.

### Module 2: Headless Tracer (`client/trace/converter.js`)
* **Role**: Launches headless Google Chrome using native Chrome DevTools Protocol (CDP) over WebSocket.
* **Outputs**:
  - `codeflow.json`: Schema containing compositions, layers, keyframe arrays, and text properties.
  - `assets/`: Extracted raster and vector graphics saved cleanly inside the animation folder.

### Module 3: Font Installer (`client/fonts.js`)
* **Role**: Automatically extracts web fonts (WOFF, TTF, OTF) referenced by the HTML animation and registers them with the operating system font cache so After Effects typography engines can render them without font missing errors.

### Module 4: AE Builder Engine (`host/builder.jsx`)
* **Role**: The core After Effects ExtendScript builder. Completely decoupled from UI.
* **Capabilities**:
  - **Layer Parenting & Hierarchy Harmonization**: Automatically identifies container shapes (like badges, chips, and cards) and parents nested children (text, icons, circles) to the container. Cancels out phantom drift keyframes and locks children to static local offsets, guaranteeing that cards and badges scale up as rigid, unified objects without elements flying apart.
  - Isolated try-catches on every typography property (prevents non-integer tracking bugs).
  - Path interpolation (`kind: "path"` with cubic bezier tangents `inTangents`, `outTangents`).
  - Native linear gradients via `ADBE Ramp`.
  - Drop shadows via `ADBE Drop Shadow`.
  - Clean project organization: automatically groups compositions and assets into dedicated project bin folders.

---

## 4. How After Effects Loads MotionFlow

MotionFlow is linked directly to Adobe's CEP extension directory via a Windows Directory Junction:
```
C:\Users\<User>\AppData\Roaming\Adobe\CEP\extensions\MotionFlow
  ↳ Points directly to: D:\Codes\00 Playground\14 Code flow extention\MotionFlow
```

* **Live Reloading**: Any change made to `index.html`, `css/style.css`, or `main.js` takes effect immediately inside After Effects by pressing **`F5`** or **`Ctrl + R`** inside the panel.
* **No Re-installation Needed**: No zip extraction or installer required during development.
