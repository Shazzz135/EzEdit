import { type Point } from '@/types/selection'
import {
  type RemoveBackgroundOptions,
  removeBackgroundFloodFill,
  removeBackgroundFromSelection,
} from './backgroundRemoval'

export async function executeCutout(
  imageSrc: string,
  options: RemoveBackgroundOptions = {},
  paths?: Point[][]
): Promise<{ blob: Blob; url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const width = img.naturalWidth
      const height = img.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })

      if (!ctx) {
        reject(new Error('Failed to create 2D canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0)
      let imageData = ctx.getImageData(0, 0, width, height)

      if (paths && paths.length > 0) {
        imageData = removeBackgroundFromSelection(imageData, paths, Boolean(options.invert))
      } else {
        imageData = removeBackgroundFloodFill(imageData, options)
      }

      ctx.putImageData(imageData, 0, 0)

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to generate PNG blob'))
          return
        }
        resolve({
          blob,
          url: URL.createObjectURL(blob),
          width,
          height,
        })
      }, 'image/png')
    }
    img.onerror = (e) => reject(e)
    img.src = imageSrc
  })
}
