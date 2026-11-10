## 1. Issue Reference
<!-- Link the issue being resolved, e.g., Closes #123 -->
Closes #

---

## 2. Purpose & Implementation Scope
<!-- Concise summary of what this pull request accomplishes and why -->

---

## 3. Detailed Changes
<!-- Bulleted breakdown of changes by feature/module -->
- **Components & Layout**:
- **Canvas / WebGL Engine**:
- **State & Storage**:
- **Documentation**:

---

## 4. Modified & Added Files
<!-- List primary files touched -->
- [ ] Added: `...`
- [ ] Modified: `...`
- [ ] Deleted: `...`

---

## 5. Acceptance Criteria Verification
<!-- Check each criterion confirmed working with concrete evidence -->
- [ ] All criteria listed in the linked issue are completely met
- [ ] Hard rule: All source files are strictly <= 250 lines
- [ ] No dead code, unused imports, or duplicate logic remains
- [ ] Dark theme aesthetic preserved (sharp, clean, no distracting colors)

---

## 6. Testing & Quality Checks Executed
- [ ] **Type Checking**: `pnpm build` (TypeScript clean, zero errors)
- [ ] **Linting & Formatting**: `pnpm lint` (ESLint 10 passed with zero warnings)
- [ ] **Unit Tests**: `pnpm test` (All tests passed)
- [ ] **Manual UI Verification**: Tested on Desktop and Mobile viewports

---

## 7. Security, Privacy & Performance Verification
- [ ] Zero secrets, private tokens, or backend credentials included
- [ ] Images processed strictly on client-side (unless user opted into Pollinations.ai)
- [ ] WebGL contexts and textures cleanly freed on document close
- [ ] Ad banner rendering does not shift canvas or cause layout reflow (CLS < 0.05)

---

## 8. Ponytail & Code Simplification Review
- [ ] Simplification check performed (YAGNI, native platform APIs preferred over libs)
- [ ] No unnecessary abstractions or speculative scaffolding

---

## 9. Visual Evidence (Screenshots / Recordings)
<!-- Attach screenshots of desktop and mobile views, active tool states, or test output -->

---

## 10. Developer Approval & Merge Protocol
> [!IMPORTANT]
> This PR requires explicit human developer confirmation prior to creation and merge. Do not auto-merge.
