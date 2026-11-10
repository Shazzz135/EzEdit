# Milestones and GitHub Issues Roadmap: EzEdit

This document establishes the official traceable roadmap and issue breakdown for EzEdit on GitHub (`https://github.com/Shazzz135/EzEdit`).

---

## Milestone 1: Project Scaffolding & Repository Infrastructure
- **Epic**: [#1 [Milestone 1 Epic]: Project Scaffolding & Repository Infrastructure](https://github.com/Shazzz135/EzEdit/issues/1)
- **Status**: In Progress

| Issue | Title | Status | Dependencies |
|---|---|---|---|
| [#2](https://github.com/Shazzz135/EzEdit/issues/2) | **Issue 1.1: Repository Restructure & Base Package Standardization** | Done (Local) | None |
| [#3](https://github.com/Shazzz135/EzEdit/issues/3) | **Issue 1.2: CI/CD Pipeline & Code Quality Automation** | Done (Local) | Blocked by #2 |

---

## Milestone 2: Dark Theme Design System & App Shell Layout
- **Epic**: [#4 [Milestone 2 Epic]: Dark Theme Design System & App Shell Layout](https://github.com/Shazzz135/EzEdit/issues/4)
- **Blocked by**: #3

| Issue | Title | Dependencies |
|---|---|---|
| [#5](https://github.com/Shazzz135/EzEdit/issues/5) | **Issue 2.1: Design Tokens & Base UI Component Primitives** (0.1 Precision Sliders) | Blocked by #4 |
| [#6](https://github.com/Shazzz135/EzEdit/issues/6) | **Issue 2.2: Responsive Workspace Shell with Permanent Ad Slots** (Skyscraper 160x600 & Banner 320x50) | Blocked by #5 |

---

## Milestone 3: Canvas Viewport Engine & Document Tab Management
- **Epic**: [#7 [Milestone 3 Epic]: Canvas Viewport Engine & Document Tab Management](https://github.com/Shazzz135/EzEdit/issues/7)
- **Blocked by**: #6

| Issue | Title | Dependencies |
|---|---|---|
| [#8](https://github.com/Shazzz135/EzEdit/issues/8) | **Issue 3.1: Multi-Document Tab Bar & State Manager** (Strict 6-Tab Limit & 4096px Check) | Blocked by #7 |
| [#9](https://github.com/Shazzz135/EzEdit/issues/9) | **Issue 3.2: High-Performance Canvas Viewport** (Pan & Zoom 10%-3200%) | Blocked by #8 |
| [#10](https://github.com/Shazzz135/EzEdit/issues/10) | **Issue 3.3: IndexedDB Document Persistence & Recovery** | Blocked by #8 |

---

## Milestone 4: Orientation & Alignment Tools
- **Epic**: [#11 [Milestone 4 Epic]: Orientation & Alignment Tools](https://github.com/Shazzz135/EzEdit/issues/11)
- **Blocked by**: #9

| Issue | Title | Dependencies |
|---|---|---|
| [#12](https://github.com/Shazzz135/EzEdit/issues/12) | **Issue 4.1: Interactive Crop & Aspect Ratio System** (Rule-of-Thirds Grid) | Blocked by #11 |
| [#13](https://github.com/Shazzz135/EzEdit/issues/13) | **Issue 4.2: Rotate, Flip & Bilinear Stretch Transforms** | Blocked by #12 |

---

## Milestone 5: WebGL Color Grading & Preset Filters
- **Epic**: [#14 [Milestone 5 Epic]: WebGL Color Grading & Preset Filters](https://github.com/Shazzz135/EzEdit/issues/14)
- **Blocked by**: #9

| Issue | Title | Dependencies |
|---|---|---|
| [#15](https://github.com/Shazzz135/EzEdit/issues/15) | **Issue 5.1: WebGL 2.0 Adjustment Shader Pipeline** (13 Sliders with 0.1 Precision) | Blocked by #14 |
| [#16](https://github.com/Shazzz135/EzEdit/issues/16) | **Issue 5.2: Preset Filter Shaders & Split-Compare Tool** | Blocked by #15 |

---

## Milestone 6: Precise Selection & High-Fidelity Background Removal
- **Epic**: [#17 [Milestone 6 Epic]: Precise Selection & High-Fidelity Background Removal](https://github.com/Shazzz135/EzEdit/issues/17)
- **Blocked by**: #9

| Issue | Title | Dependencies |
|---|---|---|
| [#18](https://github.com/Shazzz135/EzEdit/issues/18) | **Issue 6.1: Marquee & Lasso Vector Selection Engine** (Marching Ants) | Blocked by #17 |
| [#19](https://github.com/Shazzz135/EzEdit/issues/19) | **Issue 6.2: High-Fidelity Background Removal & Transparency Engine** | Blocked by #18 |

---

## Milestone 7: Advanced Retouching & Hybrid Inpainting
- **Epic**: [#20 [Milestone 7 Epic]: Advanced Retouching & Hybrid Inpainting](https://github.com/Shazzz135/EzEdit/issues/20)
- **Blocked by**: #15, #19

| Issue | Title | Dependencies |
|---|---|---|
| [#21](https://github.com/Shazzz135/EzEdit/issues/21) | **Issue 7.1: Clone Stamp & Local Neighborhood Healing Brush** | Blocked by #20 |
| [#22](https://github.com/Shazzz135/EzEdit/issues/22) | **Issue 7.2: Content-Aware Fill & Unwanted Object Removal** (Hybrid Local + AI) | Blocked by #21 |

---

## Milestone 8: Pollinations.ai Generative AI & Multi-Format Export
- **Epic**: [#23 [Milestone 8 Epic]: Pollinations.ai Generative AI & Multi-Format Export](https://github.com/Shazzz135/EzEdit/issues/23)
- **Blocked by**: #9, #22

| Issue | Title | Dependencies |
|---|---|---|
| [#24](https://github.com/Shazzz135/EzEdit/issues/24) | **Issue 8.1: Pollinations.ai Keyless Generative AI Integration** | Blocked by #23 |
| [#25](https://github.com/Shazzz135/EzEdit/issues/25) | **Issue 8.2: Multi-Format High-Resolution Export Engine** (PNG, JPEG, WebP) | Blocked by #24 |
