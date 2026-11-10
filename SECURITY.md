# Security Policy: EzEdit

## 1. Scope & Philosophy

EzEdit is committed to client-side data protection and privacy:
- All photo manipulation (rendering, scaling, adjustments, filters, retouching) is executed strictly locally on the user's device.
- No user imagery or metadata is transmitted over the network, except when the user explicitly triggers generative AI tools powered by Pollinations.ai.
- No privileged API tokens, credentials, or secrets are bundled or stored in the frontend application.

---

## 2. Reporting a Vulnerability

If you discover a security vulnerability (such as an XSS vector in image metadata parsing, CSP bypass, or unvalidated third-party scripts):

1. **Do not create a public GitHub issue.**
2. Send an email to the repository owner or submit via GitHub Private Vulnerability Reporting.
3. Include detailed steps to reproduce, affected browsers, and potential impact.
4. We will acknowledge receipt within 48 hours and work on a verified fix promptly.
