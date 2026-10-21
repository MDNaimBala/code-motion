# Code Motion — Future Ideas & Superpower Roadmap

> **Note for Future Sessions**: This document preserves the breakthrough ideas and architectural blueprints developed during our exploration of native After Effects features and `ae-builder`. Whenever you return from a break, pick any item from this list to implement next!

---

## 🌟 1. Native Text Animator Engine (`Animate: >` in After Effects)

### The Vision
Access After Effects' internal **`ADBE Text Animators`** engine directly from web code. Instead of blurring or moving the whole text layer as one flat rectangle, After Effects animates each character or word individually!

### What it Enables:
1. **Apple-Style Letter Blur**:
   - Attribute: `data-ae-text-blur="20"`
   - Uses `ADBE Text Blur` + `ADBE Text Range Selector`.
   - Characters emerge smoothly from soft blur to razor-sharp focus one by one.
2. **Word-by-Word Kinetic Punch (TikTok / Reel Captions)**:
   - Attribute: `data-ae-text-words="true"`
   - Sets Range Selector `Based On: Words`. Words pop onto the screen in rhythmic beats.
3. **3D Letter Cascade & Tumble**:
   - Attribute: `data-ae-text-cascade="true"`
   - Uses `ADBE Text Position 3D` + `ADBE Text Rotation` + `ADBE Text Scale 3D`.
   - Letters tumble down from above, bounce with elastic overshoot, and lock into line.
4. **Elastic Tracking Expansion**:
   - Attribute: `data-ae-text-tracking="20"`
   - Uses `ADBE Text Tracking`. Letters start tightly compressed and breathe out elegantly.
5. **Hacker / Matrix Decipher Unscrambler**:
   - Attribute: `data-ae-text-decipher="true"`
   - Uses `ADBE Text Character Offset`. Characters cycle rapidly through random symbols before snapping into readable text.

### Implementation Blueprint:
* In `builder.jsx`, check if `lDef.type === 'text'` and has text animator directives.
* Add `ADBE Text Animator` to `textLayer.property("ADBE Text Properties").property("ADBE Text Animators")`.
* Attach requested properties (`ADBE Text Blur`, `ADBE Text Position 3D`, etc.).
* Attach `ADBE Text Range Selector` animating `Start` from 0% to 100%.

---

## ⚡ 2. Universal Expression Bridge (Physics Bounces, Springs, Wiggles)

### The Vision
Every keyframeable property in After Effects has a `.expression` field. We can inject real physics expressions with zero extra keyframes!

### What it Enables:
1. **Inertial Bounce**:
   - Attribute: `data-ae-bounce="true"` or `data-ae-spring="true"`
   - Code Motion automatically attaches the famous After Effects overshoot bounce expression to `ADBE Scale` or `ADBE Position`.
   - Badges, cards, and buttons snap and bounce naturally like real physics objects without manually keyframing 10 frames!
2. **Organic Wiggle**:
   - Attribute: `data-ae-wiggle="frequency,amount"` (e.g. `data-ae-wiggle="2,15"`)
   - Gives floating cards, badges, or HUD cursors an organic, continuous hover drift.

### Implementation Blueprint:
* In `builder.jsx`, check for `tf.bounce` or `lDef.expression`.
* Apply directly to property: `prop.expression = "var freq = 3; var decay = 5; ...";`.

---

## 🎨 3. Particle Bursts & Confetti System

### The Vision
Spawn celebration particles, impact sparks, or confetti on card pops or button clicks.

### Implementation Blueprint:
* Adapt `ae-builder`'s `makeBurst()` system.
* Generates a `CTRL_Burst` null with sliders: `Origin`, `Distance (%)`, `Size (%)`, `Spin (deg)`, and `Progress (%)`.
* Creates 8–12 small vector shape particles that shoot out radially from the button or badge.

---

## 🧪 4. Live AE Showcase Demo

### The Vision
Build a stunning, comprehensive showcase demo inside `tests/showcase/` containing:
- A glowing vector card with **Trim Paths** border drawing (`data-ae-trim="0 100"`).
- Color-coded layers (Red camera null, Lavender live typography, Sandstone cards).
- Drop shadow and 2-color radial ramp stage background.

---

*Take a well-deserved break! Everything is preserved, tested, and waiting for you.* ☕
