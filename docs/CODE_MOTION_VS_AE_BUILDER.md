# Code Motion vs. AE Builder: Architecture & Strategic Roadmap

> **Document Purpose**: Analysis of **Code Motion** (our native CEP extension) versus **ae-builder** (the AI ExtendScript generation skill), comparing workflows, architectural advantages, and future integration opportunities.

---

## 1. Executive Summary

Both tools share the same ultimate destination—creating native, fully editable compositions inside Adobe After Effects. However, they approach the problem from two completely different paradigms:

- **ae-builder**: A **Generative Script Workflow**. It prompts an LLM (Claude) to write a custom, 2,000+ line standalone ExtendScript (`.jsx`) file from scratch for each animation, packaging it into a `.zip` with bundled fonts and assets.
- **Code Motion**: A **Real-Time Client Extension (CEP)**. It uses a dedicated in-app Chromium panel and local headless browser tracer to convert live HTML/CSS into native AE comps in ~5 seconds via drag-and-drop or clipboard paste (`Ctrl+V`).

---

## 2. Head-to-Head Workflow Comparison

| Step | **Code Motion** (Our Extension) | **ae-builder** (The Skill) |
| :--- | :--- | :--- |
| **Step 1: Ideation** | Ask AI (ChatGPT/Claude/DeepSeek) for HTML/CSS motion graphics. | Ask Claude to write an animation (HTML/canvas/code). |
| **Step 2: Conversion** | Press **`Ctrl + V`** (or drag-and-drop file) into the Code Motion AE panel. | Prompt Claude a *second time* with the `ae-builder` skill to write a custom `.jsx` script. |
| **Step 3: Compilation** | Click **"Build in AE"**. Headless Chrome traces exact DOM styles & matrices in virtual time. | Wait 3–5 minutes while Claude writes 2,000+ lines of ExtendScript code, runs Python curve fitters, and packs a `.zip`. |
| **Step 4: AE Execution** | **Instant**: Native layers appear in AE timeline within ~5 seconds. | Download zip $\to$ unzip folder $\to$ Open AE $\to$ Go to `File > Scripts > Run Script File`. |
| **Step 5: Iteration** | Tweak a CSS property in the panel's code drawer $\to$ click Build again. | Re-prompt Claude $\to$ wait 3–5 minutes for a full script rewrite $\to$ re-download zip. |

---

## 3. Why Code Motion Wins for Web & UI Motion Graphics

### 1. Speed & Immediate Feedback
- **Code Motion**: **~5 seconds** end-to-end turnaround.
- **ae-builder**: **3–5 minutes** per build due to LLM generation latency and file downloads.

### 2. Token Cost & Computational Efficiency
- **Code Motion**: Highly token-efficient. The AI only outputs concise HTML/CSS markup (a few hundred lines). All heavy lifting (matrix calculation, layer creation, parenting, easing curves) is handled locally and deterministically by our Node/ExtendScript engine.
- **ae-builder**: Burns 10,000–30,000 tokens per prompt because Claude has to write repetitive, verbose ES3 ExtendScript code line-by-line.

### 3. Pixel Precision (No Guesswork)
- **Code Motion**: Uses a real Chromium browser engine via Chrome DevTools Protocol (CDP). It measures real CSS flexbox spacing, letter tracking, bounding boxes, 3D perspective transforms, and SVG geometry with mathematical accuracy.
- **ae-builder**: The AI must estimate and manually calculate layout offsets, margins, and bounding boxes in ExtendScript math, which often leads to alignment drift.

---

## 4. Where `ae-builder` Has Unique Strengths

`ae-builder` was specifically engineered for scenarios where web code does not exist or where complex procedural rigging is needed:

1. **Video MP4 Rebuilding**:
   - If the user only has a video recording of an animation and no source code, `ae-builder` extracts video frames and tracks channel motion to build AE keyframes.
2. **2-Bone Character Puppet IK Rigging**:
   - Includes custom rigging math for cartoon limbs (arms, legs, knees, elbows) with flip checkboxes and controller nulls (`CTRL_Body`, `CTRL_Head`).
3. **Particle Bursts & Confetti**:
   - Includes a slider-driven particle system (`makeBurst` / `addToBurst`) for impact sparks and confetti without 3rd-party plugins.
4. **Native Text Animators (Typewriter Cascades)**:
   - Uses `ADBE Text Expressible Selector` to build character-by-character typewriter and cascading drop-in text effects.

---

## 5. What We Have Already Taken from `ae-builder`

We successfully harvested `ae-builder`'s core stability and aesthetic features into Code Motion:
- ✅ **Studio Timeline Color-Coding**: Automatic assignment of native AE label colors (Red for cameras/nulls, Lavender for typography, Sandstone for shapes/cards, Purple for precomps, Orange for footage).
- ✅ **ExtendScript Crash Armor**: Added `setEaseSafe` to handle 2 vs. 3 dimensional scale eases across varying AE versions, plus hold-only property validation to prevent C++ rejections.
- ✅ **Native Trim Paths Pipeline**: Added `data-ae-trim` support in `main.js` and wired it to `ADBE Vector Filter - Trim` in `builder.jsx`.

---

## 6. Future Expansion Roadmap (Opportunities to Borrow Later)

When we want to expand Code Motion beyond UI and layout cards, we can adapt these features from `ae-builder`:

### Feature A: Typewriter & Character Cascade Directives
- **Directive**: `data-ae-text-animation="typewriter"` or `data-ae-text-animation="cascade"`.
- **Implementation**: Adapt `ae-builder`'s `ADBE Text Expressible Selector` in `builder.jsx` so text layers can automatically have animated in-points or typewriter effects in After Effects.

### Feature B: Particle & Burst Generator
- **Directive**: `data-ae-burst="confetti"` or `data-ae-burst="sparks"`.
- **Implementation**: Adapt `ae-builder`'s `makeBurst()` helper to generate an animated particle burst null system on click/pop events.

### Feature C: Standalone `.jsx` Export Option
- **Concept**: Add an "Export Standalone .JSX" button in the Code Motion panel.
- **Benefit**: Allows users who don't have the Code Motion extension installed on a secondary machine or render farm to run the build via a single portable script file.

---

## 7. Conclusion
**Code Motion is fundamentally the superior workflow for UI, web, and layout motion graphics.** It provides instant 1-click execution, zero token waste, and browser-perfect pixel alignment.

By selectively adopting `ae-builder`'s ExtendScript bug fixes and rigging patterns into our extension, Code Motion now possesses both the **speed of a modern CEP extension** and the **battle-tested durability of a studio rigging pipeline**.
