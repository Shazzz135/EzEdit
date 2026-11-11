import { type CropRect } from '@/types/crop'

export interface CropResult {
  blob: Blob
  url: string
  width: number
  height: number
}

export async function executeCrop(
  imageSrc: string,
  cropRect: CropRect
): Promise<CropResult> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const targetW = Math.max(1, Math.round(cropRect.width))
      const targetH = Math.max(1, Math.round(cropRect.height))

      canvas.width = targetW
      canvas.height = targetH

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to create canvas context'))
        return
      }

      ctx.drawImage(
        img,
        Math.round(cropRect.x),
        Math.round(cropRect.y),
        targetW,
        targetH,
        0,
        0,
        targetW,
        targetH
      )

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create cropped image blob'))
          return
        }
        const url = URL.createObjectURL(blob)
        resolve({
          blob,
          url,
          width: targetW,
          height: targetH,
        })
      }, 'image/png')
    }

    img.onerror = () => {
      reject(new Error('Failed to load image for cropping'))
    }

    img.src = imageSrc
  })
}
