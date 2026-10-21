---
version: 1.0.0
name: AE Monochrome
description: Low-contrast, distraction-free monochrome workspace palette tailored to native Adobe After Effects panels, with strict non-rounded rectangular geometry.
colors:
  primary: "#D4D4D4"
  bright: "#F0F0F0"
  secondary: "#8A8A8A"
  faint: "#606060"
  neutral: "#1E1E1E"
  panel: "#262626"
  well: "#181818"
  border: "#383838"
  border-subtle: "#2D2D2D"
  button-bg: "#333333"
  button-hover: "#404040"
  button-active: "#222222"
  button-primary: "#3E3E3E"
  button-primary-hover: "#4C4C4C"
  on-primary: "#FFFFFF"
typography:
  display:
    fontFamily: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 13.5px
    fontWeight: 600
    letterSpacing: "-0.01em"
  h1:
    fontFamily: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 13px
    fontWeight: 600
  body:
    fontFamily: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 11.5px
    lineHeight: 1.5
  label:
    fontFamily: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 10px
    letterSpacing: "0.08em"
    textTransform: uppercase
  mono:
    fontFamily: "JetBrains Mono", Consolas, "SF Mono", monospace
    fontSize: 10.5px
    lineHeight: 1.5
rounded:
  sm: 0px
  md: 0px
  lg: 0px
spacing:
  sm: 6px
  md: 12px
  lg: 16px
components:
  button-primary:
    backgroundColor: "{colors.button-primary}"
    textColor: "{colors.on-primary}"
    borderColor: "#505050"
    rounded: "{rounded.md}"
    padding: 10px 16px
    textTransform: uppercase
    letterSpacing: 0.06em
  button-secondary:
    backgroundColor: "{colors.button-bg}"
    textColor: "{colors.primary}"
    borderColor: "{colors.border}"
    rounded: "{rounded.sm}"
    padding: 8px 14px
  card:
    backgroundColor: "{colors.panel}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
    padding: 14px
  well:
    backgroundColor: "{colors.well}"
    borderColor: "{colors.border}"
    rounded: "{rounded.md}"
    padding: 28px 16px
  segmented-control:
    backgroundColor: "{colors.well}"
    borderColor: "{colors.border}"
    selectedBg: "#3C3C3C"
    selectedColor: "{colors.bright}"
    rounded: "{rounded.sm}"
---

## Overview

Designed specifically for motion designers working inside Adobe After Effects. It eliminates visual distraction, avoids harsh contrast, and feels like a native After Effects tool panel (matching Character, Paragraph, and Essential Graphics).

## Colors

The palette is strictly monochromatic and calibrated to After Effects' dark gray UI:

- **Neutral Canvas (`#1E1E1E`):** The base window background.
- **Panel Surface (`#262626`):** Card containers and foreground sections.
- **Inset Well (`#181818`):** Recessed drop zone, stats cells, and console output.
- **Hairline Borders (`#383838` / `#2D2D2D`):** Clean separation rules.
- **Text Levels:**
  - **Bright (`#F0F0F0`):** Headlines, active selections, and key metrics.
  - **Primary (`#D4D4D4`):** General UI text and button labels.
  - **Secondary (`#8A8A8A`):** Captions, labels, and metadata.
  - **Faint (`#606060`):** Helper tips, status indicators, and subtle rules.

## Typography

- **System UI Font:** Clean, modern, highly legible sans-serif (`Inter`, `Segoe UI`, system-ui).
- **Tabular Figures:** Numbers in the bento inspection grid use `font-variant-numeric: tabular-nums` to maintain stability during dynamic updates.
- **Monospace Console:** Terminal logs render in `"JetBrains Mono"`, Consolas, or monospace at 10.5px.

## Geometry

- **Non-rounded rectangles:** All corners are strictly `0px` (`border-radius: 0 !important`).
- No bubbles, rounded pills, or floating cards.

## Do's and Don'ts

- **Do** keep all corners strictly `0px` (sharp non-rounded rectangles).
- **Do** maintain comfortable, low-eye-strain contrast that blends into After Effects.
- **Do** use uppercase tracked labels for metadata headers.
- **Don't** introduce high-contrast white backgrounds or decorative serif fonts.
- **Don't** add colored gradients or neon saturation.
