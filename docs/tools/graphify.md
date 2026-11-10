# Development Intelligence: Codebase Knowledge Graph

## 1. Overview

To maintain architectural integrity across multiple milestones and tools, EzEdit tracks component, service, and data dependencies through a structured codebase dependency graph.

---

## 2. Dependency & Flow Graph

```mermaid
graph TD
    App[src/app/App.tsx] --> Shell[src/components/layout/WorkspaceShell.tsx]
    Shell --> AdSlot[src/components/layout/AdContainer.tsx]
    Shell --> Header[src/components/layout/Header.tsx]
    Shell --> TabBar[src/features/tabs/TabBar.tsx]
    Shell --> Viewport[src/features/canvas/CanvasViewport.tsx]
    Shell --> ToolsPanel[src/features/tools/ToolsPanel.tsx]

    TabBar --> DocStore[src/features/tabs/useDocumentStore.ts]
    DocStore --> Storage[src/services/storage/indexedDbService.ts]

    ToolsPanel --> OrientTools[src/features/orientation/]
    ToolsPanel --> AdjustTools[src/features/adjustments/]
    ToolsPanel --> FilterTools[src/features/filters/]
    ToolsPanel --> SelectTools[src/features/selection/]
    ToolsPanel --> RetouchTools[src/features/retouch/]
    ToolsPanel --> AITools[src/features/ai/]

    Viewport --> WebGL[src/services/webgl/ShaderPipeline.ts]
    Viewport --> Worker[src/services/workers/inpaintWorker.ts]
    AITools --> Pollinations[src/services/pollinations/client.ts]
```

---

## 3. Maintenance Protocol

Whenever a file or module is added or refactored:
1. Verify how the new module connects into `WorkspaceShell` or `ToolsPanel`.
2. Ensure no circular dependencies are introduced.
3. Update this diagram when component boundaries shift.
