# Code Motion: Studio-Grade Polish & AE Armor Implementation Plan

> **Goal:** Upgrade Code Motion's After Effects engine with automated studio timeline color-coding, battle-tested ExtendScript crash armor (from `ae-builder`), and native line-drawing Trim Paths support.

**Architecture:** 
1. Layer Classification & Color Styling in `CodeMotion/host/builder.jsx`.
2. Safe Keyframe Easing (`setEaseSafe`) & Property Validation in `builder.jsx`.
3. Trim Paths extraction pipeline in `CodeMotion/client/trace/converter.js` and builder execution in `builder.jsx`.
4. Prompt & Skill updates for `data-ae-trim` in `CODE_MOTION_SYSTEM_PROMPT.md` and `.agents/skills/`.
5. Automated verification in `scratch/simulate_all.js`.

**Tech Stack:** Adobe ExtendScript (ES3), Adobe CEP (CEF Chromium), Node.js.

---

## Global Constraints
- **ES3 Strict Compatibility**: No `let`, `const`, arrow functions, template strings, or ES3 reserved words (`char`, `class`, `default`, etc.) as unquoted keys in `builder.jsx`.
- **Zero Breaking Changes**: Existing test suites and HTML conversions must remain 100% functional.
- **Pass Verification**: `node scratch/simulate_all.js` must pass with 0 errors.

---

## Tasks

### Task 1: Studio Timeline Color-Coding (`builder.jsx`)
Automatically color-code layers in the After Effects timeline so every generated composition looks like a project organized by a senior motion designer.

**Files:**
- Modify: `CodeMotion/host/builder.jsx`
- Test: `scratch/simulate_all.js`

**Label Legend (Native AE Label Indices):**
- `layer.label = 1` (Red): Cameras, 3D Nulls, and Controllers
- `layer.label = 14` (Cyan) or `5` (Lavender): Live Text layers
- `layer.label = 15` (Sandstone / Peach): Shape Layers, Cards, and Rectangles
- `layer.label = 10` (Purple): Precomps and Nested Scenes
- `layer.label = 11` (Orange): Footage, Images, and Video textures
- `layer.label = 3` (Aqua): Masks and Mattes

---

### Task 2: ExtendScript Crash Armor (`builder.jsx`)
Fortify the keyframe interpolation and property setter against known Adobe C++ parameter rejections.

**Files:**
- Modify: `CodeMotion/host/builder.jsx`
- Test: `scratch/simulate_all.js`

**Step Details:**
1. **`setEaseSafe` Fallback**:
   - For properties with multi-dimensional ease (like `ADBE Scale`), some AE versions require 2 ease objects while others require 3 (including hidden Z).
   - Implement `setEaseSafe(prop, keyIndex, inEaseList, outEaseList)` which tries the expected count, falls back to 2, 3, or 1, and catches without throwing.
2. **Hold-Only Property Safety**:
   - Before setting `KeyframeInterpolationType.BEZIER`, check `prop.isInterpolationTypeValid(KeyframeInterpolationType.BEZIER)`.
   - If false, assign `KeyframeInterpolationType.HOLD` to avoid AE's "Invalid interpolation type for this property" error.
3. **Mask Offset MatchName Guard**:
   - Ensure mask expansion lookups always check `"ADBE Mask Offset"` first before any localized aliases.

---

### Task 3: Native Trim Paths Support (`converter.js` + `builder.jsx`)
Enable animated vector strokes and line-drawing effects in After Effects.

**Files:**
- Modify: `CodeMotion/client/trace/converter.js`
- Modify: `CodeMotion/host/builder.jsx`
- Test: `scratch/simulate_all.js`

**Step Details:**
1. **Converter Scanner (`converter.js`)**:
   - Detect `data-ae-trim="start,end,offset"` or `data-trim-start` / `data-trim-end` on SVG paths and vector elements.
   - Export structured `trim: { start: ..., end: ..., offset: ... }` into shape definitions in `codeflow.json`.
2. **Builder Generator (`builder.jsx`)**:
   - Ensure `ADBE Vector Filter - Trim` is created inside the shape group.
   - Apply `ADBE Vector Trim Start`, `ADBE Vector Trim End`, and `ADBE Vector Trim Offset` using `applyProperty()`.

---

### Task 4: Documentation & Master Prompt Update
Update the AI instruction so models know they can use `data-ae-trim` for line-drawing animations.

**Files:**
- Modify: `CODE_MOTION_SYSTEM_PROMPT.md`
- Modify: `.agents/skills/code-motion/SKILL.md`

**Step Details:**
1. Add a short, clear section: *"How to create animated line-draw / trim paths: use `data-ae-trim="0 100"` or animate SVG strokes."*

---

### Task 5: Automated Verification & Simulation
Verify syntax and end-to-end simulation across all suites.

**Files:**
- Modify: `scratch/simulate_all.js`
- Test: Run `node scratch/simulate_all.js`
