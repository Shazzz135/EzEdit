import { type Point } from '@/types/selection'
import {
  type RemoveBackgroundOptions,
  removeBackgroundFloodFill,
  removeBackgroundFromSelection,
} from './backgroundRemoval'

function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const i = new Image()
    i.onload = () => resolve({ width: i.naturalWidth, height: i.naturalHeight })
    i.onerror = () => resolve({ width: 800, height: 600 })
    i.src = url
  })
}

export async function executeCutout(
  imageSrc: string,
  options: RemoveBackgroundOptions = {},
  paths?: Point[][]
): Promise<{ blob: Blob; url: string; width: number; height: number }> {
  // Selection-based cutout
  if (paths && paths.length > 0) {
    return executeRasterCutout(imageSrc, options, paths)
  }

  // 1. Try local rembg HTTP server (e.g. rembg s --port 5000)
  if (options.useAi !== false) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 1200)
      const imgRes = await fetch(imageSrc)
      const imgBlob = await imgRes.blob()
      const formData = new FormData()
      formData.append('file', imgBlob, 'image.png')

      const rembgRes = await fetch('http://localhost:5000/api/remove', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })
      clearTimeout(timer)
      if (rembgRes.ok) {
        const blob = await rembgRes.blob()
        const url = URL.createObjectURL(blob)
        const dims = await getImageDimensions(url)
        return { blob, url, width: dims.width, height: dims.height }
      }
    } catch {
      // Proceed to client-side rembg neural model
    }

    // 2. Client-side neural background removal (IS-Net / U2-Net rembg model via WebAssembly)
    try {
      const { removeBackground } = await import('@imgly/background-removal')
      const aiBlob = await removeBackground(imageSrc)
      const aiUrl = URL.createObjectURL(aiBlob)
      const dims = await getImageDimensions(aiUrl)
      return { blob: aiBlob, url: aiUrl, width: dims.width, height: dims.height }
    } catch (err) {
      console.warn('Neural background removal unavailable, using fallback flood-fill:', err)
    }
  }

  // 3. Fallback: perceptual color distance flood-fill
  return executeRasterCutout(imageSrc, options)
}

function executeRasterCutout(
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
