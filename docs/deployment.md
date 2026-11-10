# Deployment Guide: EzEdit

## 1. Hosting Architecture

Because EzEdit is a **100% Client-Side Application** (SPA), it deploys to edge static hosting platforms without a Node.js server runtime:
- **Cloudflare Pages** (Primary target — fast global CDN, unlimited bandwidth)
- **Vercel** (Static edge network)
- **Netlify**
- **GitHub Pages**

---

## 2. Build Pipeline

The production build generates optimized static HTML, CSS, JavaScript, and WebGL shader chunks:

```bash
# In frontend/ directory
pnpm build
```

The output is emitted to `frontend/dist/`.

---

## 3. Environment Variables & Public Configuration

Because EzEdit has no secrets, all configuration is public:

| Variable | Default Value | Description |
|---|---|---|
| `VITE_APP_TITLE` | `EzEdit` | Application title |
| `VITE_POLLINATIONS_ENDPOINT` | `https://image.pollinations.ai` | AI generation base URL |
| `VITE_AD_CLIENT_ID` | `""` | Optional ad provider client ID |
| `VITE_MAX_CANVAS_DIMENSION` | `8192` | Max hardware texture dimension safeguard |

Create a `.env.example` in `frontend/` reflecting safe defaults.

---

## 4. Content Security Policy (CSP)

To maintain maximum privacy and prevent script injection:

```http
Content-Security-Policy: default-src 'self'; img-src 'self' data: blob: https://image.pollinations.ai; connect-src 'self' https://image.pollinations.ai; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; frame-src 'self' https://googleads.g.doubleclick.net;
```
