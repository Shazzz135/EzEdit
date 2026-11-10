# Development Intelligence: Ponytail in EzEdit

## 1. What is Ponytail?

Ponytail represents the senior-developer principle of **intentional simplicity and minimal code**:
- Prioritizing native web APIs (`<canvas>`, `OffscreenCanvas`, CSS variables, `Math.*`) before importing heavy external dependencies.
- Eliminating speculative abstractions (no interfaces with single implementations, no unneeded factories).
- Shortest working diff wins once the problem is fully understood.
- Keeping source files strictly under 250 lines without sacrificing readability.

---

## 2. Ponytail Ladder in EzEdit

Before writing or modifying any canvas tool or UI component, climb the ladder:
1. **Does this need to exist at all?** (YAGNI)
2. **Already in this codebase?** (Reuse existing math transform or matrix helper)
3. **Stdlib or Web Platform does it?** (`ctx.drawImage()`, `CanvasPattern`, `Path2D`)
4. **Already-installed dependency solves it?** (Lucide icons, Zustand)
5. **Can it be done in one concise function?**
6. **Only then:** write minimal, tested custom logic.

---

## 3. Review Checklist for Every Issue
- [ ] Is there an unrequested abstraction? If yes, remove it.
- [ ] Did we import a library when 5 lines of canvas 2D code suffices?
- [ ] Are public interfaces preserved during simplification?
- [ ] Do automated unit tests pass after refactoring?
