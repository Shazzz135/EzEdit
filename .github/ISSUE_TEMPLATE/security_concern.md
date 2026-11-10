---
name: Security Concern
description: Report a client-side security, memory exhaustion, or data leakage concern
title: "[SEC]: "
labels: ["security"]
assignees: []
---

> **Note**: For sensitive vulnerability disclosures, please refer to our private security reporting policy in [SECURITY.md](SECURITY.md).

## 1. Security Overview
<!-- Description of the concern: XSS, untrusted image blob execution, unvalidated third-party scripts, memory denial-of-service, etc. -->

## 2. Threat Vector & Affected Component
- [ ] Image parsing / Blob URL handling
- [ ] Pollinations.ai API communication
- [ ] Ad banner iframe / container isolation
- [ ] Local storage / IndexedDB data tampering
- [ ] Web Worker memory bounds

## 3. Impact Assessment
<!-- What can happen if exploited? (e.g., client memory crash, unintended external network call) -->

## 4. Remediation Plan & Acceptance Criteria
- [ ] Sanitization / validation applied
- [ ] Memory limit / quota guard enforced
- [ ] Zero sensitive data leaked in client logs or bundles
