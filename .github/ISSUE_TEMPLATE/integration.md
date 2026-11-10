---
name: External Integration Change
description: Changes or additions to external services (Pollinations.ai, IndexedDB, etc.)
title: "[INTEGRATION]: "
labels: ["integration"]
assignees: []
---

## 1. External Service
- [ ] Pollinations.ai (AI Image Generation / Manipulation)
- [ ] IndexedDB (`idb-keyval` / browser storage)
- [ ] Ad Provider Container / Scripts
- [ ] Other External API / CDN

## 2. Interface Changes & Request/Response Contracts
<!-- Document endpoint, parameters, response parsing, and error status handling -->

## 3. Privacy, CORS & Fallback Strategy
- [ ] Zero private secrets or API keys introduced
- [ ] Graceful fallback for offline / rate-limited conditions
- [ ] User consent / explicit trigger confirmed prior to network dispatch

## 4. Acceptance Criteria
- [ ] Integration thoroughly tested with mock and live calls
- [ ] Error states surfaced cleanly in UI with retry option
- [ ] docs/integrations.md updated
