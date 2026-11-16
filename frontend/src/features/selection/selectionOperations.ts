import { type Point } from '@/types/selection'
import { buildPath2D, getBoundingBox, calculatePastePosition } from './selectionGeometry'

export interface CutResult {
  extractedBlob: Blob
  extractedUrl: string
  newImageBlob: Blob
  newImageUrl: string
  width: number
  height: number
}

export interface PasteResult {
  pastedBlob: Blob
  pastedUrl: string
  newImageBlob: Blob
  newImageUrl: string
  width: number
  height: number
  x: number
  y: number
}

// Internal memory clipboard fallback in case navigator.clipboard is unavailable
let internalClipboardBlob: Blob | null = null
let internalClipboardPosition: { x: number; y: number } | null = null

export function getInternalClipboardBlob(): Blob | null {
  return internalClipboardBlob
}

export function setInternalClipboardBlob(
  blob: Blob | null,
  pos?: { x: number; y: number } | null
): void {
  internalClipboardBlob = blob
  internalClipboardPosition = pos ?? null
}

export function getInternalClipboardPosition(): { x: number; y: number } | null {
  return internalClipboardPosition
}

export function hasPasteableContent(): boolean {
  return internalClipboardBlob !== null
}

export async function copySelection(
  imageSrc: string,
  paths: Point[][],
  inverted = false,
  feather = 0
): Promise<{ blob: Blob; url: string } | null> {
  const bbox = getBoundingBox(paths)
  if (!bbox || paths.length === 0) return null

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = bbox.width
      canvas.height = bbox.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Failed to get 2D canvas context'))

      ctx.save()
      ctx.translate(-bbox.minX, -bbox.minY)
      if (feather > 0) ctx.filter = `blur(${feather}px)`

      const path2d = buildPath2D(paths)
      if (inverted) {
        const fullPath = new Path2D()
        fullPath.rect(0, 0, img.naturalWidth, img.naturalHeight)
        ctx.clip(fullPath)
      } else {
        ctx.clip(path2d)
      }
      ctx.drawImage(img, 0, 0)
      ctx.restore()

      canvas.toBlob(async (blob) => {
        if (!blob) return resolve(null)
        internalClipboardBlob = blob
        internalClipboardPosition = { x: bbox.minX, y: bbox.minY }
        try {
          if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          }
        } catch {
          // Clipboard write permission denied or unavailable; fallback retained
        }
        resolve({ blob, url: URL.createObjectURL(blob) })
      }, 'image/png')
    }
    img.onerror = (e) => reject(e)
    img.src = imageSrc
  })
}

export async function cutSelection(
  imageSrc: string,
  paths: Point[][],
  inverted = false,
  feather = 0
): Promise<CutResult | null> {
  const copyRes = await copySelection(imageSrc, paths, inverted, feather)
  if (!copyRes) return null

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Failed to get 2D canvas context'))

      ctx.drawImage(img, 0, 0)
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      if (feather > 0) ctx.filter = `blur(${feather}px)`
      ctx.fill(buildPath2D(paths))
      ctx.restore()

      canvas.toBlob((newBlob) => {
        if (!newBlob) return resolve(null)
        resolve({
          extractedBlob: copyRes.blob,
          extractedUrl: copyRes.url,
          newImageBlob: newBlob,
          newImageUrl: URL.createObjectURL(newBlob),
          width: canvas.width,
          height: canvas.height,
        })
      }, 'image/png')
    }
    img.onerror = (e) => reject(e)
    img.src = imageSrc
  })
}

export async function getPasteableBlob(): Promise<Blob | null> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.read) {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          if (blob) return blob
        }
      }
    }
  } catch {
    // Clipboard permission denied or API unsupported; fallback to internal
  }
  return internalClipboardBlob
}

export async function pasteSelection(
  targetImageSrc: string,
  explicitBlob?: Blob | null,
  explicitPosition?: { x: number; y: number } | null
): Promise<PasteResult | null> {
  const blobToPaste = explicitBlob ?? (await getPasteableBlob())
  if (!blobToPaste) return null

  return new Promise((resolve, reject) => {
    const targetImg = new Image()
    targetImg.crossOrigin = 'anonymous'
    targetImg.onload = () => {
      const pastedImg = new Image()
      pastedImg.crossOrigin = 'anonymous'
      const pastedUrl = URL.createObjectURL(blobToPaste)

      pastedImg.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = targetImg.naturalWidth
        canvas.height = targetImg.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(pastedUrl)
          return reject(new Error('Failed to get 2D canvas context'))
        }

        ctx.drawImage(targetImg, 0, 0)
        const pos = calculatePastePosition(
          targetImg.naturalWidth, targetImg.naturalHeight,
          pastedImg.naturalWidth, pastedImg.naturalHeight,
          explicitPosition ?? internalClipboardPosition
        )
        internalClipboardPosition = pos
        ctx.drawImage(pastedImg, pos.x, pos.y)

        canvas.toBlob((newBlob) => {
          if (!newBlob) return resolve(null)
          resolve({
            pastedBlob: blobToPaste,
            pastedUrl,
            newImageBlob: newBlob,
            newImageUrl: URL.createObjectURL(newBlob),
            width: canvas.width,
            height: canvas.height,
            x: pos.x,
            y: pos.y,
          })
        }, 'image/png')
      }

      pastedImg.onerror = (e) => {
        URL.revokeObjectURL(pastedUrl)
        reject(e)
      }
      pastedImg.src = pastedUrl
    }
    targetImg.onerror = (e) => reject(e)
    targetImg.src = targetImageSrc
  })
}
