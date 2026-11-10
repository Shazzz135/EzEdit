# Frontend Architecture Specification: EzEdit

## 1. Architectural Philosophy

EzEdit adheres strictly to a **Frontend-Only, Zero-Backend** architecture. All image processing computations run inside the browser runtime using modern web platform standards:
- **OffscreenCanvas & Web Workers** for asynchronous CPU-heavy pixel calculations.
- **WebGL 2.0 Fragment Shaders** for real-time 60fps color grading, tinting, curves, and convolution filters.
- **2D Canvas Context** for vector selection overlays, crop handles, transform bounds, and brush cursors.
- **Zustand** for lightweight, decoupled application state management.
- **IndexedDB (`idb-keyval`)** for robust, persistent storage across browser reloads.

```mermaid
flowchart TD
    UI[App Shell / UI Layout] --> Store[Zustand Tab & Document Store]
    Store --> IDB[(IndexedDB Storage)]
    UI --> CanvasViewport[Canvas Viewport Component]
    CanvasViewport --> WebGL[WebGL 2.0 Shaders (Adjustments & Filters)]
    CanvasViewport --> Worker[Web Worker (Healing, Clone Stamp, Selections)]
    Worker --> Canvas2D[Canvas 2D Offscreen Buffers]
    CanvasViewport --> Overlay[Vector Canvas Overlay (Crop/Lasso/Handles)]
    UI --> AIClient[Pollinations.ai REST Client]
    AIClient --> Store
```

---

## 2. Directory Structure & Modular Responsibilities

The codebase follows a feature-sliced architecture keeping source files under 250 lines:

```text
src/
├── app/                  # App shell, root providers, theme layout
├── components/
│   ├── layout/           # Desktop & Mobile responsive shells, Ad containers
│   ├── ui/               # Slider, Button, Dropdown, Modal, Tooltip primitives
│   └── shared/           # ColorPicker, SplitCompareSlider, ZoomControls
├── features/
│   ├── canvas/           # CanvasViewport, Zoom/Pan engine, Overlay
│   ├── tabs/             # TabBar, TabItem, Document switcher
│   ├── orientation/      # Crop, Resize, Rotate, Flip, Stretch
│   ├── adjustments/      # Exposure, Contrast, Brilliance, Sharpness, Noise
│   ├── filters/          # Preset filter lookup shaders & definitions
│   ├── selection/        # Lasso, Marquee, Transparency, Cut/Copy
│   ├── retouch/          # Healing Brush, Clone Stamp, Content-Aware Fill
│   ├── export/           # High-resolution export dialog & file writer
│   └── ai/               # Pollinations.ai integration prompt dialog & client
├── services/
│   ├── webgl/            # Shader programs, texture management, FBOs
│   ├── workers/          # Inpainting & pixel synthesis Web Workers
│   ├── storage/          # IndexedDB persistence service
│   └── pollinations/     # Keyless AI REST client
├── hooks/                # useKeyboardShortcuts, useCanvasPanZoom, useWindowSize
├── types/                # Domain models, DocumentState, ToolType, AdjustmentValues
└── utils/                # Math, color conversion, matrix transforms, file loaders
```

---

## 3. Image Processing Pipeline

### 3.1 Dual-Stage Rendering Architecture
1. **Base Source Buffer**: Loaded image preserved at native pixel resolution.
2. **Transform Stage (Canvas 2D / Matrix)**: Handles crop, resize, rotate, flip, and stretch.
3. **Filter & Adjustment Stage (WebGL Shader)**: Applies non-destructive adjustments (exposure, brilliance, highlights, shadows, saturation, vibrance, warmth, tint, sharpness, noise).
4. **Raster Edit Layer (Canvas 2D / Offscreen)**: Holds pixel modifications from Healing Brush, Clone Stamp, and manual retouching.
5. **Interactive Overlay (Canvas 2D)**: Renders marquee/lasso marching ants, crop guides, transformation anchors, and brush size cursors without re-rendering underlying pixels.

---

## 4. Multi-Document & Tab Management

- Each opened image is assigned a unique `documentId`.
- Importing an image while already editing opens a new tab on the right side of the tab bar.
- Switching tabs switches the active document in the store and loads its texture into the WebGL renderer.
- Each document maintains its own undo/redo history stack and non-destructive adjustment state.
- Automatic background serialization to IndexedDB guarantees work is saved after every stroke or slider release.

---

## 5. Coding & Modularity Constraints

- **Strict File Limit**: Maximum 250 lines per source file.
- **No Unused Code**: Tree-shaken imports, zero dead variables, strict ESLint enforcement.
- **Ponytail Principle**: Prefer standard web APIs (Canvas, Math, OffscreenCanvas) over bloated third-party libraries.
