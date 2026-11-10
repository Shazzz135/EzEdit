# Contributing to EzEdit

Thank you for contributing to EzEdit! To maintain the highest code quality and predictability, all development follows strict standards.

---

## 1. Development Principles

1. **Frontend-Only**: EzEdit runs entirely in the browser. Never introduce backend services, server endpoints, or database infrastructure.
2. **250-Line Limit**: Every source file (`.ts`, `.tsx`, `.css`) must remain strictly under 250 lines. Files exceeding this limit will fail CI.
3. **No Unused Code**: Clean code without dead imports, commented blocks, or unused functions.
4. **Issue-Driven Workflow**: Every PR must reference an approved GitHub issue with clear acceptance criteria.

---

## 2. Issue & Pull Request Protocol

1. **Check Existing Issues**: Choose an existing issue from the active milestone or propose a new one using the appropriate issue template.
2. **Create a Feature Branch**: `git checkout -b feat/<issue-id>-description`.
3. **Implement & Test**: Write concise, modular code following the Ponytail simplicity ladder. Run `pnpm lint`, `pnpm test`, and `pnpm build`.
4. **Verification**: Verify each acceptance criterion with concrete evidence.
5. **PR Creation**: Complete all fields in `.github/PULL_REQUEST_TEMPLATE.md`.
6. **Developer Approval**: The project administrator / human developer retains sole authority to merge pull requests into `main`. Never push directly to `main`.
