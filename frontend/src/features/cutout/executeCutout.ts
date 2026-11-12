import { type Point } from '@/types/selection'
import {
  type RemoveBackgroundOptions,
  removeBackgroundFloodFill,
  removeBackgroundFromSelection,
} from './backgroundRemoval'

export async function callRemoveBgApi(imageSrc: string, apiKey: string): Promise<Blob> {
  const fetchRes = await fetch(imageSrc)
  const imageBlob = await fetchRes.blob()

  const formData = new FormData()
  formData.append('image_file', imageBlob)
  formData.append('size', 'auto')

  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: formData,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`remove.bg API error (${res.status}): ${errText || res.statusText}`)
  }

  return await res.blob()
}

export async function executeCutout(
  imageSrc: string,
  options: RemoveBackgroundOptions = {},
  paths?: Point[][]
): Promise<{ blob: Blob; url: string; width: number; height: number }> {
  // 1. If remove.bg API key provided, call official remove.bg API
  if (!paths?.length && options.removeBgApiKey) {
    try {
      const apiBlob = await callRemoveBgApi(imageSrc, options.removeBgApiKey)
      const url = URL.createObjectURL(apiBlob)
      const dims = await new Promise<{ width: number; height: number }>((resolve) => {
        const i = new Image()
        i.onload = () => resolve({ width: i.naturalWidth, height: i.naturalHeight })
        i.src = url
      })
      return { blob: apiBlob, url, width: dims.width, height: dims.height }
    } catch (err) {
      console.warn('remove.bg API call failed, falling back to neural model:', err)
    }
  }

  // 2. Try neural AI background removal for auto cutout
  if (!paths?.length && options.useAi !== false) {
    try {
      const { removeBackground } = await import('@imgly/background-removal')
      const aiBlob = await removeBackground(imageSrc)
      const aiUrl = URL.createObjectURL(aiBlob)
      const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
        const i = new Image()
        i.onload = () => resolve({ width: i.naturalWidth, height: i.naturalHeight })
        i.src = aiUrl
      })
      return { blob: aiBlob, url: aiUrl, width: dimensions.width, height: dimensions.height }
    } catch (err) {
      console.warn('AI background removal unavailable, using precision flood fill:', err)
    }
  }

  // 3. Client-side canvas raster processing (selection cutout or fallback)
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
