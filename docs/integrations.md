# External Integrations & Storage: EzEdit

## 1. Pollinations.ai Integration

EzEdit integrates with **Pollinations.ai**, a free, keyless AI generative and image manipulation service.

### 1.1 Architectural Boundaries
- **Client-Side Direct REST**: Requests are initiated directly from the client's browser using `fetch()`. No intermediate backend server or proxy is introduced.
- **No API Secrets**: Pollinations.ai requires no API keys, eliminating risk of token exposure in client bundles.
- **CORS Support**: Pollinations.ai endpoints are natively CORS-enabled for web applications.

### 1.2 Endpoints & Interaction Flow
1. **Text-to-Image Generation**:
   - `GET https://image.pollinations.ai/prompt/{prompt}?width={w}&height={h}&seed={seed}&model={model}`
   - Directly streams image bytes into a Blob, loaded into an `HTMLImageElement` and appended to EzEdit as a new document tab.
2. **Image-to-Image / Inpainting Manipulation**:
   - Uses `POST https://image.pollinations.ai/` or prompt query referencing the current selection.
   - For privacy, the user must explicitly click "Generate with AI" before any image pixel data is transmitted.

### 1.3 Error Handling & Network Resilience
- **Timeout**: Set to 30 seconds with an abort controller.
- **Fallback**: In case of rate limits or offline state, an error banner informs the user without impacting local Canvas/WebGL editing tools.

---

## 2. Browser Storage & IndexedDB (`idb-keyval`)

### 2.1 Storage Architecture
EzEdit uses IndexedDB to store document metadata, raster bitmaps, and adjustment states across browser sessions.

```text
IndexedDB: "EzEditDB"
└── Object Store: "documents"
    ├── Key: documentId (UUID)
    └── Value: {
          id: string,
          name: string,
          createdAt: number,
          updatedAt: number,
          dimensions: { width: number, height: number },
          originalBlob: Blob,
          currentRasterBlob: Blob,
          adjustments: AdjustmentValues,
          historyStack: ActionDelta[],
          historyIndex: number
        }
```

### 2.2 Storage Limits & Quota Handling
- Automatically detects storage quota using `navigator.storage.estimate()`.
- Warns user when disk storage exceeds 80% quota.
- Automatic cleanup of temporary preview thumbnails.
