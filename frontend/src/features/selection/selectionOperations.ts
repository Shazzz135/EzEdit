import { type Point } from '@/types/selection'
import { buildPath2D, getBoundingBox } from './selectionGeometry'

export interface CutResult {
  extractedBlob: Blob
  extractedUrl: string
  newImageBlob: Blob
  newImageUrl: string
  width: number
  height: number
}

// Internal memory clipboard fallback in case navigator.clipboard is unavailable
let internalClipboardBlob: Blob | null = null

export function getInternalClipboardBlob(): Blob | null {
  return internalClipboardBlob
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
      if (!ctx) {
        reject(new Error('Failed to get 2D canvas context'))
        return
      }

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
        if (!blob) {
          resolve(null)
          return
        }
        internalClipboardBlob = blob
        try {
          if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          }
        } catch {
          // Clipboard write permission denied or unavailable; memory clipboard retained
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
      if (!ctx) {
        reject(new Error('Failed to get 2D canvas context'))
        return
      }

      // 1. Draw base image
      ctx.drawImage(img, 0, 0)

      // 2. Erase selected region to transparent
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      if (feather > 0) ctx.filter = `blur(${feather}px)`

      const path2d = buildPath2D(paths)
      ctx.fill(path2d)
      ctx.restore()

      canvas.toBlob((newBlob) => {
        if (!newBlob) {
          resolve(null)
          return
        }
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
