# Testing Strategy: EzEdit

## 1. Testing Philosophy

Testing in EzEdit focuses on high-confidence client-side validation:
- **Unit Testing**: 100% test coverage for pure math utilities, matrix transformations, coordinate projections, color conversions, and adjustment lookup functions.
- **Component & UI Testing**: Validation of slider step precision (0.1 increments), active tool selection highlights, tab switching, and modal dialogs using Vitest + React Testing Library.
- **Integration Testing**: Dual-stage canvas pipeline, WebGL fallback detection, IndexedDB document serialization, and Pollinations.ai client error handling.
- **Visual & Layout Testing**: Verifying no layout shift (CLS < 0.05) when ad containers mount, and correct responsive switching between desktop and mobile.

---

## 2. Test Execution Commands

```bash
# Run all unit and integration tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with code coverage report
pnpm test:coverage
```

---

## 3. Test Directory Organization

```text
tests/
├── unit/
│   ├── math.test.ts          # Matrix & transform calculations
│   ├── color.test.ts         # RGB, HSL, Brightness & LUT helpers
│   └── coordinates.test.ts   # Screen-to-canvas coordinate projections
├── integration/
│   ├── storage.test.ts       # IndexedDB serialization & recovery
│   ├── tabs.test.ts          # Multi-document tab workflow
│   └── pollinations.test.ts  # Keyless AI REST client & mock responses
└── components/
    ├── Slider.test.tsx       # 0.1 precision & keyboard navigation
    └── TabBar.test.tsx       # Tab creation, selection, and closure
```

---

## 4. WebGL & Canvas Mocking Strategy

In headless Vitest / Node environments, Canvas 2D and WebGL are mocked via `vitest-canvas-mock` and lightweight offscreen context stubs to test state transitions without requiring a physical GPU in continuous integration.
