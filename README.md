# EzEdit — Client-Side Photo Editor

[![CI](https://github.com/Shazzz135/EzEdit/actions/workflows/ci.yml/badge.svg)](https://github.com/Shazzz135/EzEdit/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A high-performance, fully client-side photo editing web application featuring precise color grading, orientation transforms, retouching tools, AI enhancements, multi-tab editing, and responsive dark-mode UI.

---

## Overview

**EzEdit** is engineered to bring desktop-grade photo manipulation directly into the browser without requiring a backend server or uploading user imagery to remote databases. All image processing (transforms, adjustments, filters, masking, cloning, healing) executes locally inside the browser using WebGL shaders, Canvas 2D, and Web Workers, preserving user privacy and providing zero-latency responsiveness.

For generative AI transformations, EzEdit integrates with **Pollinations.ai** via keyless, client-side REST calls.

---

## Core Capabilities

- **Orientation & Alignment**: Free Crop, Fixed Aspect Ratio Crop, Canvas Resize, Rotate 90°/180°, Flip Horizontal/Vertical, Perspective/Free Stretch.
- **Color Grading & Adjustments (0.1 Slider Precision)**: Exposure, Brilliance, Highlights, Shadows, Contrast, Brightness, Saturation, Vibrance, Warmth, Tint, Sharpness, Definition, Noise Reduction.
- **Preset Filters**: Vivid, Warm, Cool, Dramatic, Heavy Warm, Heavy Cool, Mono, Noir.
- **Precise Selection & Masking**: Rectangular/Elliptical Marquee, Freehand Lasso, Background Removal, Transparency Masking, Copy, Cut.
- **Advanced Retouching**: Healing Brush, Clone Stamp, Object Removal, Spot/Blemish Remover, Content-Aware Fill.
- **User Tools**: Infinite Undo/Redo stack, Zoom & Pan (10% to 3200%), Multi-Document Tabbed Editing, Split Compare with Original, State Persistence via IndexedDB, High-Resolution Export (PNG, JPEG, WebP).
- **AI Integrations**: Generative fill and manipulation powered by Pollinations.ai.
- **UI/UX**: Adaptive layout (Desktop: Editor left, Tools right, Ad right; Mobile: Editor top, scrollable Tools bottom, Ad bottom), dark mode, clear active tool states.

---

## Project Structure

```text
EzEdit/
├── .github/                 # Workflows, Issue & PR templates
├── docs/                    # Architecture, design system, specifications
│   ├── project-configuration.md
│   ├── architecture.md
│   ├── milestones-and-issues.md
│   ├── design-system.md
│   ├── integrations.md
│   ├── development.md
│   ├── testing.md
│   ├── deployment.md
│   └── tools/
├── frontend/                # React 19 + TypeScript + Vite application
│   ├── src/
│   │   ├── app/             # Application shell & providers
│   │   ├── components/      # UI & layout primitives
│   │   ├── features/        # Editor features & tools
│   │   ├── hooks/           # Reusable state & viewport hooks
│   │   ├── services/        # Canvas, WebGL, Pollinations services
│   │   └── types/           # Domain & tool TypeScript interfaces
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
└── CHANGELOG.md
```

---

## Quick Start

### Prerequisites
- Node.js >= 20.x
- pnpm >= 9.x (or npm >= 10.x)

### Local Setup
```bash
# Clone the repository
git clone https://github.com/Shazzz135/EzEdit.git
cd EzEdit/frontend

# Install dependencies
pnpm install

# Start local development server
pnpm dev
```

Visit `http://localhost:5173` in your browser.

---

## Documentation

- [Project Configuration](docs/project-configuration.md)
- [Frontend Architecture](docs/architecture.md)
- [Milestones & Issues Roadmap](docs/milestones-and-issues.md)
- [Design System & UI Guidelines](docs/design-system.md)
- [Integrations (Pollinations.ai & Storage)](docs/integrations.md)
- [Development Guide](docs/development.md)
- [Testing Strategy](docs/testing.md)
- [Deployment Guide](docs/deployment.md)
- [Development Intelligence (Ponytail & Graphify)](docs/tools/ponytail.md)

---

## License

This project is licensed under the MIT License.
