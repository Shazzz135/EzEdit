# Project Configuration: EzEdit (Approved)

## 1. Project Overview & Architectural Boundaries

- **Project Name**: EzEdit
- **Project Goal**: High-performance, client-side photo manipulation application.
- **Problem Statement**: Standard online photo editors either transmit private photos to remote servers, require accounts, lag, or lack 0.1 slider precision and professional retouching tools.
- **Target Audience**: Creators, photographers, and casual users needing desktop-grade image enhancements in the browser.
- **Architecture Constraint**: Frontend-Only. Zero backend servers. Transformations run locally via Canvas 2D, WebGL Shaders, Web Workers, and browser APIs.
- **External Dependencies**: Keyless REST API integration with `Pollinations.ai` for AI generation and complex inpainting.
- **Repository Structure**: `frontend/` subfolder architecture retained per admin specification.

---

## 2. Approved Technical Decisions

1. **Background Removal**: Modular high-fidelity removal utilizing high-accuracy client-side segmentation complemented by Canvas thresholding and Pollinations.ai fallback for studio-grade cutouts.
2. **Inpainting & Retouching**: Hybrid architecture: Local Poisson neighborhood blending & clone stamp for instant spot/blemish healing, plus Pollinations.ai generative inpainting for complex object removal and content-aware fill.
3. **Tab & Memory Budget**: Strict **6-tab maximum** limit. A warning dialog triggers when attempting to open a 7th tab. Maximum import dimension is capped at **4096px** with an automatic downscale prompt to prevent GPU/browser memory exhaustion.
4. **Ad Placements**:
   - **Desktop (Far Left)**: Permanent Skyscraper container (`160x600`), Editor (Middle, flex-1), Tools (Right, 320px).
   - **Mobile (Fixed Bottom)**: Permanent Standard Banner container (`320x50`).
   - Zero layout shift (CLS < 0.05).
5. **Precision Sliders**: Step precision of `0.1` across all 13 adjustment sliders.

---

## 3. Technology Stack Selection

- **Framework**: React 19 + TypeScript 6.
- **Build Tool**: Vite 8.
- **Styling**: Tailwind CSS + CSS Variables for dark mode design tokens.
- **Icons**: Lucide React.
- **State Management**: Zustand (multi-tab documents, active tool parameters, undo/redo).
- **Storage**: IndexedDB via `idb-keyval` for persistent canvas document states and blobs.
- **Image Pipeline**:
  - **WebGL 2.0 Fragment Shaders**: Real-time 60fps color grading, filters, and adjustments.
  - **Canvas 2D / OffscreenCanvas + Web Worker**: Cropping, scaling, lasso masking, clone stamp, and patch synthesis.
- **Testing**: Vitest + Testing Library + Playwright.
- **Code Quality**: ESLint 10, Prettier, TypeScript strict mode, 250-line file length limit.
- **CI/CD**: GitHub Actions (`.github/workflows/ci.yml`).

---

## 4. Configuration Approval & Status

- **Configuration Version**: 1.1.0 (APPROVED)
- **Status**: Formally Approved by Administrator
- **Implementation Status**: Proceeding to Milestone 1 & Milestone 2 implementation.
