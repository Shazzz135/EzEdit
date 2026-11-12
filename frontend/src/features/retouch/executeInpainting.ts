import { type Point } from './types'
import { runInpaintingMath } from './inpaintingMath'
import { executePollinationsInpainting } from './pollinationsInpaint'

export interface ExecuteInpaintingOptions {
  method: 'local-patch' | 'pollinations-ai'
  prompt?: string
  maskPaths?: Point[][]
  maskData?: Uint8ClampedArray
  onProgress?: (progress: number) => void
}

export async function executeInpainting(
  imageSrc: string,
  width: number,
  height: number,
  options: ExecuteInpaintingOptions
): Promise<{ url: string; blob: Blob; width: number; height: number }> {
  // 1. Prepare Base Image on Offscreen Canvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Could not get 2d context')

  const baseImg = await loadImage(imageSrc)
  ctx.drawImage(baseImg, 0, 0)
  const imgData = ctx.getImageData(0, 0, width, height)

  // 2. Prepare Mask Buffer
  let maskBuffer: Uint8ClampedArray
  if (options.maskData) {
    maskBuffer = options.maskData
  } else if (options.maskPaths && options.maskPaths.length > 0) {
    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = width
    maskCanvas.height = height
    const mCtx = maskCanvas.getContext('2d')
    if (!mCtx) throw new Error('Could not get mask context')
    mCtx.fillStyle = '#000000'
    mCtx.fillRect(0, 0, width, height)

    mCtx.fillStyle = '#FFFFFF'
    for (const path of options.maskPaths) {
      if (path.length < 3) continue
      mCtx.beginPath()
      mCtx.moveTo(path[0].x, path[0].y)
      for (let i = 1; i < path.length; i++) mCtx.lineTo(path[i].x, path[i].y)
      mCtx.closePath()
      mCtx.fill()
    }
    maskBuffer = mCtx.getImageData(0, 0, width, height).data
  } else {
    throw new Error('No inpainting mask provided')
  }

  // 3. Try Pollinations.ai Generative Inpainting if requested
  if (options.method === 'pollinations-ai') {
    options.onProgress?.(0.3)
    const aiBlob = await executePollinationsInpainting(imageSrc, {
      prompt: options.prompt,
      width,
      height,
    })

    if (aiBlob) {
      options.onProgress?.(0.8)
      const aiImg = await loadImage(URL.createObjectURL(aiBlob))
      const aiCanvas = document.createElement('canvas')
      aiCanvas.width = width
      aiCanvas.height = height
      const aiCtx = aiCanvas.getContext('2d')
      if (aiCtx) {
        aiCtx.drawImage(aiImg, 0, 0, width, height)
        const aiData = aiCtx.getImageData(0, 0, width, height).data
        const outData = imgData.data

        for (let i = 0; i < width * height; i++) {
          const mVal = maskBuffer[i * 4 + 3] || maskBuffer[i * 4]
          if (mVal > 32) {
            const idx = i * 4
            outData[idx] = aiData[idx]
            outData[idx + 1] = aiData[idx + 1]
            outData[idx + 2] = aiData[idx + 2]
            outData[idx + 3] = 255
          }
        }
        ctx.putImageData(imgData, 0, 0)
        options.onProgress?.(1.0)
        return canvasToResult(canvas, width, height)
      }
    }
  }

  // 4. Local Web Worker Inpainting (or direct calculation if Worker unavailable)
  const resultData = await runWorkerInpainting(imgData.data, maskBuffer, width, height, options.onProgress)
  const finalImageData = ctx.createImageData(width, height)
  finalImageData.data.set(resultData)
  ctx.putImageData(finalImageData, 0, 0)

  return canvasToResult(canvas, width, height)
}

function runWorkerInpainting(
  imgData: Uint8ClampedArray,
  maskBuffer: Uint8ClampedArray,
  width: number,
  height: number,
  onProgress?: (progress: number) => void
): Promise<Uint8ClampedArray> {
  return new Promise((resolve) => {
    if (typeof Worker !== 'undefined') {
      try {
        const worker = new Worker(new URL('./inpainting.worker.ts', import.meta.url), { type: 'module' })
        worker.onmessage = (e) => {
          if (e.data.type === 'progress') {
            onProgress?.(e.data.progress)
          } else if (e.data.type === 'complete') {
            worker.terminate()
            resolve(e.data.result)
          } else if (e.data.type === 'error') {
            worker.terminate()
            resolve(runInpaintingMath(imgData, maskBuffer, width, height, onProgress))
          }
        }
        worker.onerror = () => {
          worker.terminate()
          resolve(runInpaintingMath(imgData, maskBuffer, width, height, onProgress))
        }
        worker.postMessage({ imageBuffer: imgData, maskBuffer, width, height })
        return
      } catch {
        // Fallback to sync math
      }
    }
    resolve(runInpaintingMath(imgData, maskBuffer, width, height, onProgress))
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function canvasToResult(canvas: HTMLCanvasElement, width: number, height: number): Promise<{ url: string; blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Canvas export failed'))
      const url = URL.createObjectURL(blob)
      resolve({ url, blob, width, height })
    }, 'image/png')
  })
}
