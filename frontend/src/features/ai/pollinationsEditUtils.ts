import { type AIAspectRatio } from './types'

export function computeEditDimensions(
  sourceW: number,
  sourceH: number,
  maxDim = 1024
): { editW: number; editH: number } {
  const w = Math.max(1, sourceW)
  const h = Math.max(1, sourceH)
  const scale = Math.min(1, maxDim / Math.max(w, h))
  const editW = Math.max(64, Math.round((w * scale) / 16) * 16)
  const editH = Math.max(64, Math.round((h * scale) / 16) * 16)
  return { editW, editH }
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a))
  let y = Math.abs(Math.round(b))
  while (y !== 0) {
    const t = y
    y = x % y
    x = t
  }
  return x || 1
}

export function inferAspectRatio(width: number, height: number): AIAspectRatio {
  if (!width || !height) return '1:1'
  const ratio = width / height
  const candidates: Array<{ key: AIAspectRatio; value: number }> = [
    { key: '1:1', value: 1 },
    { key: '16:9', value: 16 / 9 },
    { key: '9:16', value: 9 / 16 },
    { key: '4:3', value: 4 / 3 },
    { key: '3:4', value: 3 / 4 },
  ]
  let best = candidates[0]
  let minDiff = Math.abs(ratio - best.value)
  for (const c of candidates) {
    const diff = Math.abs(ratio - c.value)
    if (diff < minDiff) {
      minDiff = diff
      best = c
    }
  }
  if (minDiff <= 0.08) return best.key
  const d = gcd(width, height)
  const rw = Math.round(width / d)
  const rh = Math.round(height / d)
  if (rw <= 32 && rh <= 32) {
    return `${rw}:${rh}` as AIAspectRatio
  }
  return best.key
}

export function base64ToBlob(b64: string, mimeType = 'image/jpeg'): Blob {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType })
}

export async function imageSrcToDataUri(
  src: string,
  sourceWidth?: number,
  sourceHeight?: number
): Promise<{ dataUri: string; origW: number; origH: number; editW: number; editH: number }> {
  const fallbackW = sourceWidth && sourceWidth > 0 ? sourceWidth : 1024
  const fallbackH = sourceHeight && sourceHeight > 0 ? sourceHeight : 1024

  if (src.startsWith('data:image/')) {
    const { editW, editH } = computeEditDimensions(fallbackW, fallbackH)
    return { dataUri: src, origW: fallbackW, origH: fallbackH, editW, editH }
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const origW = sourceWidth || img.naturalWidth || img.width || 1024
      const origH = sourceHeight || img.naturalHeight || img.height || 1024
      const { editW, editH } = computeEditDimensions(origW, origH)
      const canvas = document.createElement('canvas')
      canvas.width = editW
      canvas.height = editH
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to create canvas context for image editing.'))
        return
      }
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, editW, editH)
      resolve({
        dataUri: canvas.toDataURL('image/jpeg', 0.92),
        origW,
        origH,
        editW,
        editH,
      })
    }
    img.onerror = () => reject(new Error('Failed to read current active image for AI editing.'))
    img.src = src
  })
}

export async function scaleBase64ImageToExactDimensions(
  b64: string,
  targetW: number,
  targetH: number
): Promise<Blob> {
  const rawBlob = base64ToBlob(b64, 'image/jpeg')
  if (typeof document === 'undefined') return rawBlob

  const testCanvas = document.createElement('canvas')
  let ctx: CanvasRenderingContext2D | null = null
  try {
    ctx = testCanvas.getContext('2d')
  } catch {
    ctx = null
  }
  if (!ctx || typeof testCanvas.toBlob !== 'function') {
    return rawBlob
  }

  return new Promise((resolve) => {
    const img = new Image()
    const tempUrl = URL.createObjectURL(rawBlob)
    const cleanup = () => URL.revokeObjectURL(tempUrl)

    img.onload = () => {
      testCanvas.width = targetW
      testCanvas.height = targetH
      ctx!.imageSmoothingEnabled = true
      ctx!.imageSmoothingQuality = 'high'
      ctx!.drawImage(img, 0, 0, targetW, targetH)
      testCanvas.toBlob(
        (scaledBlob) => {
          cleanup()
          resolve(scaledBlob ?? rawBlob)
        },
        'image/png'
      )
    }
    img.onerror = () => {
      cleanup()
      resolve(rawBlob)
    }
    img.src = tempUrl
  })
}
