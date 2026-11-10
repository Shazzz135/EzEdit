---
name: Refactoring & Technical Debt
description: Simplify code, reduce duplication, or enforce the 250-line file limit
title: "[REFACTOR]: "
labels: ["refactor"]
assignees: []
---

## 1. Target Module / File(s)
<!-- Path to file(s) requiring refactoring or splitting (e.g., src/features/adjustments/AdjustmentSliders.tsx) -->

## 2. Motivation & Technical Debt
- [ ] Exceeds 250 lines per file rule
- [ ] Unnecessary complexity / violates Ponytail simplicity principles
- [ ] Duplicated canvas manipulation logic
- [ ] Performance bottleneck / redundant re-renders

## 3. Refactoring Plan
<!-- Explain how modules will be split or simplified without altering public interfaces or runtime behavior -->

## 4. Acceptance Criteria
- [ ] All split files strictly <= 250 lines
- [ ] No regression in functionality or performance
- [ ] 100% test suite passes without modification to external contracts
