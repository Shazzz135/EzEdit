import { type FloatingObject } from '@/types/selection'
import { calculatePastePosition } from './selectionGeometry'

/**
 * Creates a movable FloatingObject from an image Blob.
 */
export async function createFloatingObject(
  blob: Blob,
  explicitPos?: { x: number; y: number } | null,
  targetBounds?: { width: number; height: number }
): Promise<FloatingObject> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const url = URL.createObjectURL(blob)

    img.onload = () => {
      const w = img.naturalWidth || 100
      const h = img.naturalHeight || 100

      let finalPos: { x: number; y: number }
      if (explicitPos) {
        finalPos = explicitPos
      } else if (targetBounds) {
        finalPos = calculatePastePosition(targetBounds.width, targetBounds.height, w, h, null)
      } else {
        finalPos = { x: 20, y: 20 }
      }

      resolve({
        id: `floating-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        imageSrc: url,
        blob,
        x: Math.round(finalPos.x),
        y: Math.round(finalPos.y),
        width: w,
        height: h,
      })
    }

    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }

    img.src = url
  })
}

/**
 * Composites the movable FloatingObject onto the target image at its current coordinates.
 */
export async function stampFloatingObject(
  targetImageSrc: string,
  floating: FloatingObject
): Promise<{ blob: Blob; url: string; width: number; height: number } | null> {
  return new Promise((resolve, reject) => {
    const targetImg = new Image()
    targetImg.crossOrigin = 'anonymous'

    targetImg.onload = () => {
      const floatingImg = new Image()
      floatingImg.crossOrigin = 'anonymous'

      floatingImg.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = targetImg.naturalWidth
        canvas.height = targetImg.naturalHeight
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          return reject(new Error('Failed to get 2D canvas context'))
        }

        ctx.drawImage(targetImg, 0, 0)
        ctx.drawImage(floatingImg, floating.x, floating.y, floating.width, floating.height)

        canvas.toBlob((blob) => {
          if (!blob) return resolve(null)
          resolve({
            blob,
            url: URL.createObjectURL(blob),
            width: canvas.width,
            height: canvas.height,
          })
        }, 'image/png')
      }

      floatingImg.onerror = (e) => reject(e)
      floatingImg.src = floating.imageSrc
    }

    targetImg.onerror = (e) => reject(e)
    targetImg.src = targetImageSrc
  })
}
