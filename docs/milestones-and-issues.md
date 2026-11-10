# Milestones and GitHub Issues Roadmap: EzEdit

This document establishes the structured roadmap and granular issue breakdowns for EzEdit. Every issue is designed to be independently reviewable, traceable, and verified against strict acceptance criteria.

---

## Milestone 1: Project Scaffolding & Repository Infrastructure
- **Objective**: Establish development tooling, code quality enforcement, CI pipelines, and base architecture.

### Issue 1.1: Repository Restructure & Base Package Standardization
- **Milestone**: 1
- **Labels**: `infrastructure`, `setup`
- **Scope**: Reorganize repository to clean single-repo or monorepo structure, align `package.json`, TypeScript configs, and path aliases.
- **Acceptance Criteria**:
  - [ ] TypeScript strict mode enabled with path alias `@/*`.
  - [ ] Project builds cleanly via `pnpm build`.
  - [ ] Vitest unit testing harness configured.
  - [ ] Maximum 250-line rule automated via ESLint `max-lines`.

### Issue 1.2: CI/CD Pipeline & Code Quality Automation
- **Milestone**: 1
- **Labels**: `infrastructure`, `ci/cd`
- **Scope**: Implement GitHub Actions workflow running linting, formatting, type checking, and unit tests on PRs and pushes.
- **Acceptance Criteria**:
  - [ ] `.github/workflows/ci.yml` runs on push and pull request.
  - [ ] Pull requests fail if ESLint, TypeScript, or Vitest fail.
  - [ ] File length validation script included in CI step.

---

## Milestone 2: Dark Theme Design System & App Shell Layout
- **Objective**: Build responsive desktop & mobile shells, dark theme design tokens, and ad banner containers.

### Issue 2.1: Design Tokens & Base UI Component Primitives
- **Milestone**: 2
- **Labels**: `ui/ux`, `design-system`
- **Scope**: Create dark mode design system tokens (neutral darks, high contrast accents), and reusable UI primitives (Button, Slider with 0.1 precision, Tooltip, Dropdown, Modal).
- **Acceptance Criteria**:
  - [ ] Dark theme palette implemented with zero vibrant/neon distractions.
  - [ ] Number slider component supports continuous drag and keyboard nudge with 0.1 decimal precision.
  - [ ] Accessible ARIA attributes for all interactive primitives.

### Issue 2.2: Responsive Workspace Shell with Permanent Ad Slots
- **Milestone**: 2
- **Labels**: `ui/ux`, `layout`
- **Scope**: Desktop layout (Editor Left, Tools Right 320px, Permanent Skyscraper Ad 160x600 Far Right) and Mobile layout (Editor Top, Tools Carousel Bottom, Permanent Standard Banner Ad 320x50 Bottom).
- **Acceptance Criteria**:
  - [ ] Desktop layout cleanly partitions Editor (flex-1), Tools (320px), and Permanent Skyscraper Ad (160x600 fixed).
  - [ ] Mobile viewport (<768px) switches to top canvas, bottom horizontal tools carousel, and fixed bottom 320x50 ad banner.
  - [ ] Zero layout shift (CLS < 0.05) when permanent ad placeholders mount.

---

## Milestone 3: Canvas Viewport Engine & Document Tab Management
- **Objective**: Multi-document tabbed workspace with high-performance canvas pan, zoom, and coordinate translation.

### Issue 3.1: Multi-Document Tab Bar & State Manager (6-Tab Limit)
- **Milestone**: 3
- **Labels**: `feature`, `state`
- **Scope**: Tab management using Zustand: opening an image creates a new tab on the right side up to 6 tabs maximum; warning modal on 7th tab; 4096px maximum import dimension check.
- **Acceptance Criteria**:
  - [ ] Tabs display thumbnail, filename, and close button.
  - [ ] Importing an image while editing appends a new active tab to the right.
  - [ ] Warning dialog shown when attempting to open more than 6 tabs.
  - [ ] Images exceeding 4096px trigger auto-downscale confirmation prompt.
  - [ ] Closing a tab prompts if unsaved or frees memory textures.

### Issue 3.2: High-Performance Canvas Viewport (Pan & Zoom)
- **Milestone**: 3
- **Labels**: `feature`, `canvas`
- **Scope**: Canvas viewport supporting smooth zoom (10% to 3200%), mouse wheel zoom to cursor, spacebar drag-to-pan, and fit-to-screen.
- **Acceptance Criteria**:
  - [ ] Smooth zoom and pan with 60fps performance on high-DPI displays.
  - [ ] Pixel grid overlay appears automatically at zoom levels > 800%.
  - [ ] Screen-to-canvas coordinate mapping function accurate under all rotations and zoom levels.

### Issue 3.3: IndexedDB Persistence & Autosave Service
- **Milestone**: 3
- **Labels**: `feature`, `storage`
- **Scope**: Automatic background serialization of open tabs, document states, and layers to IndexedDB.
- **Acceptance Criteria**:
  - [ ] Reloading the browser restores all open tabs, images, and edit histories.
  - [ ] Storage quota checks and error fallback when disk space is constrained.

---

## Milestone 4: Orientation & Alignment Tools
- **Objective**: Crop, resize, rotate, flip, and stretch transformation tools.

### Issue 4.1: Crop & Aspect Ratio System
- **Milestone**: 4
- **Labels**: `feature`, `orientation`
- **Scope**: Interactive crop overlay with corner/edge handles, rule-of-thirds grid, and aspect ratio presets (Free, 1:1, 16:9, 4:3, 9:16).
- **Acceptance Criteria**:
  - [ ] Crop handles support smooth dragging with boundary clamping.
  - [ ] Non-destructive crop preview with commit and cancel actions.

### Issue 4.2: Rotate, Flip & Stretch Transforms
- **Milestone**: 4
- **Labels**: `feature`, `orientation`
- **Scope**: Rotate 90° CW/CCW, arbitrary degree slider, horizontal flip, vertical flip, and bilinear stretch transform.
- **Acceptance Criteria**:
  - [ ] Transforms execute instantly on canvas without losing original resolution.
  - [ ] Full undo/redo support for all orientation changes.

---

## Milestone 5: WebGL Color Grading & Preset Filters
- **Objective**: Real-time 60fps adjustments with 0.1 precision and preset filter shaders.

### Issue 5.1: WebGL 2.0 Adjustment Shader Pipeline
- **Milestone**: 5
- **Labels**: `feature`, `webgl`
- **Scope**: WebGL fragment shaders for Exposure, Brilliance, Highlights, Shadows, Contrast, Brightness, Saturation, Vibrance, Warmth, Tint, Sharpness, Definition, Noise.
- **Acceptance Criteria**:
  - [ ] All 13 sliders operate at 60fps with 0.1 precision updates.
  - [ ] Sliders reflect real-time GPU previews.
  - [ ] Reset button per adjustment and global reset.

### Issue 5.2: Preset Filter Shaders & Split Compare Tool
- **Milestone**: 5
- **Labels**: `feature`, `filters`
- **Scope**: Preset filters (Vivid, Warm, Cool, Dramatic, Heavy Warm, Heavy Cool, Mono, Noir) and Split Compare slider against original.
- **Acceptance Criteria**:
  - [ ] Filters render instant visual styles via LUT or shader curves.
  - [ ] Split-slider comparison or hold-to-compare shows before/after side by side.

---

## Milestone 6: Precise Selection & Masking Tools
- **Objective**: Lasso, marquee, background removal, and clipboard actions.

### Issue 6.1: Marquee & Lasso Vector Selection Engine
- **Milestone**: 6
- **Labels**: `feature`, `selection`
- **Scope**: Rectangular marquee, elliptical marquee, freehand lasso, and polygonal lasso with marching ants visualization.
- **Acceptance Criteria**:
  - [ ] Interactive marching ants animated overlay on selection boundary.
  - [ ] Invert selection, feathering, and deselect operations.

### Issue 6.2: Background Removal, Transparency & Clipboard Operations
- **Milestone**: 6
- **Labels**: `feature`, `selection`
- **Scope**: Client-side background removal (color threshold & edge detection), transparency canvas checkerboard, Copy, Cut, and Paste into new tab.
- **Acceptance Criteria**:
  - [ ] Cut and copy extract selected pixel region to internal clipboard.
  - [ ] Transparency export preserves alpha channel in PNG and WebP.

---

## Milestone 7: Advanced Retouching & Content-Aware Tools
- **Objective**: Inpainting, clone stamp, healing brush, and blemish removal.

### Issue 7.1: Clone Stamp & Healing Brush
- **Milestone**: 7
- **Labels**: `feature`, `retouch`
- **Scope**: Clone stamp with Alt-click sample point and radius/hardness slider; healing brush with neighborhood color blending.
- **Acceptance Criteria**:
  - [ ] Real-time brush cursor overlay indicating sample source and brush radius.
  - [ ] Seamless Poisson or patch blending for natural skin and texture healing.

### Issue 7.2: Content-Aware Fill & Blemish Remover
- **Milestone**: 7
- **Labels**: `feature`, `retouch`
- **Scope**: Client-side patch synthesis / Fast Marching Method for object removal, spot healing, and content-aware fill.
- **Acceptance Criteria**:
  - [ ] Web Worker execution prevents UI thread lag during patch synthesis.
  - [ ] Object removal blends surrounding texture into the masked area.

---

## Milestone 8: AI Integration (Pollinations.ai) & Export Engine
- **Objective**: Generative AI manipulation and high-resolution export.

### Issue 8.1: Pollinations.ai Integration Service
- **Milestone**: 8
- **Labels**: `feature`, `ai`
- **Scope**: Keyless client-side REST integration with Pollinations.ai for prompt-based image generation and style manipulation.
- **Acceptance Criteria**:
  - [ ] Modal dialog allows prompt entry, style selection, and seed configuration.
  - [ ] AI results render into a preview before user confirms applying or opening in a new tab.
  - [ ] Graceful error and timeout handling when external service is unreachable.

### Issue 8.2: Multi-Format High-Resolution Export
- **Milestone**: 8
- **Labels**: `feature`, `export`
- **Scope**: Export dialog supporting PNG, JPEG, WebP with custom dimensions, DPI settings, and compression quality slider.
- **Acceptance Criteria**:
  - [ ] Offscreen render exports full original resolution with all non-destructive adjustments applied.
  - [ ] Real-time estimated file size calculation.
