# Development Guide: EzEdit

## 1. Prerequisites

- **Node.js**: v20.x or higher
- **Package Manager**: pnpm v9.x or higher (recommended) or npm v10.x
- **Modern Browser**: Chrome 120+, Firefox 120+, or Safari 17+ with WebGL 2.0 and OffscreenCanvas support.

---

## 2. Getting Started

```bash
# Clone the repository
git clone https://github.com/Shazzz135/EzEdit.git
cd EzEdit/frontend

# Install dependencies outside sandbox on Windows if installing new packages
pnpm install

# Run the local development server
pnpm dev

# Run unit and component tests
pnpm test

# Run linter and type-checker
pnpm lint
pnpm build
```

---

## 3. Coding Guidelines & Standards

1. **Max 250 Lines per File**: Keep components, hooks, shaders, and services focused and modular.
2. **Explicit Interfaces**: All props, states, and canvas action payloads must have complete TypeScript definitions.
3. **Pure Utility Functions**: Math calculations, matrix transforms, and color conversions must be pure functions with 100% unit test coverage.
4. **WebGL Shader Safety**: Always check shader compilation and link status; release GPU textures when tabs close.
5. **No Backend Creep**: Do not create API endpoints, server handlers, or backend microservices.

---

## 4. Branching & Commit Workflow

- **Main Branch**: `main` (protected; requires PR and passing CI).
- **Feature Branches**: `feat/<issue-number>-short-description` (e.g., `feat/3.1-tab-manager`).
- **Bugfix Branches**: `fix/<issue-number>-short-description`.
- **Commit Messages**: Conventional Commits standard:
  - `feat: add 0.1 precision slider component`
  - `fix: prevent WebGL texture leak on tab close`
  - `docs: update milestones and issue tracker`
