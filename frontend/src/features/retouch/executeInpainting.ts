import { type Point, type MaskStroke } from './types'
import { executePollinationsInpainting } from './pollinationsInpaint'

export interface ExecuteInpaintingOptions {
  prompt?: string
  brushRadius?: number
  maskStrokes?: MaskStroke[]
  maskPaths?: Point[][]
  vectorPaths?: Point[][]
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

  // 2. Prepare Mask Buffer (supports brush strokes, vector polygons, or raw maskData)
  let maskBuffer: Uint8ClampedArray
  const hasStrokes = !!(options.maskStrokes && options.maskStrokes.length > 0)
  const hasPaths = !!(options.maskPaths && options.maskPaths.length > 0)
  const hasVector = !!(options.vectorPaths && options.vectorPaths.length > 0)

  if (options.maskData) {
    maskBuffer = options.maskData
  } else if (hasStrokes || hasPaths || hasVector) {
    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = width
    maskCanvas.height = height
    const mCtx = maskCanvas.getContext('2d')
    if (!mCtx) throw new Error('Could not get mask context')
    mCtx.fillStyle = '#000000'
    mCtx.fillRect(0, 0, width, height)

    mCtx.fillStyle = '#FFFFFF'
    mCtx.strokeStyle = '#FFFFFF'
    mCtx.lineCap = 'round'
    mCtx.lineJoin = 'round'

    const strokesToDraw: MaskStroke[] = options.maskStrokes
      ? options.maskStrokes
      : (options.maskPaths ?? []).map((points) => ({
          points,
          radius: options.brushRadius ?? 24,
        }))

    for (const stroke of strokesToDraw) {
      const pts = stroke.points
      const r = Math.max(2, stroke.radius)
      if (pts.length === 0) continue
      if (pts.length === 1) {
        mCtx.beginPath()
        mCtx.arc(pts[0].x, pts[0].y, r, 0, Math.PI * 2)
        mCtx.fill()
      } else {
        mCtx.lineWidth = r * 2
        mCtx.beginPath()
        mCtx.moveTo(pts[0].x, pts[0].y)
        for (let i = 1; i < pts.length; i++) {
          mCtx.lineTo(pts[i].x, pts[i].y)
        }
        mCtx.stroke()
      }
    }

    for (const poly of options.vectorPaths ?? []) {
      if (poly.length < 3) continue
      mCtx.beginPath()
      mCtx.moveTo(poly[0].x, poly[0].y)
      for (let i = 1; i < poly.length; i++) {
        mCtx.lineTo(poly[i].x, poly[i].y)
      }
      mCtx.closePath()
      mCtx.fill()
    }

    maskBuffer = mCtx.getImageData(0, 0, width, height).data
  } else {
    throw new Error('No inpainting mask provided')
  }

  // 3. Execute Pollinations.ai Generative Inpainting
  options.onProgress?.(0.3)
  const aiBlob = await executePollinationsInpainting(imageSrc, {
    prompt: options.prompt,
    width,
    height,
  })

  if (!aiBlob) {
    throw new Error('Pollinations.ai inpainting service unavailable')
  }

  options.onProgress?.(0.8)
  const aiUrl = URL.createObjectURL(aiBlob)
  try {
    const aiImg = await loadImage(aiUrl)
    const aiCanvas = document.createElement('canvas')
    aiCanvas.width = width
    aiCanvas.height = height
    const aiCtx = aiCanvas.getContext('2d')
    if (aiCtx) {
      aiCtx.drawImage(aiImg, 0, 0, width, height)
      const aiData = aiCtx.getImageData(0, 0, width, height).data
      const outData = imgData.data

      for (let i = 0; i < width * height; i++) {
        const mVal = maskBuffer[i * 4] || maskBuffer[i * 4 + 3]
        if (mVal > 32) {
          const idx = i * 4
          outData[idx] = aiData[idx]
          outData[idx + 1] = aiData[idx + 1]
          outData[idx + 2] = aiData[idx + 2]
          outData[idx + 3] = 255
        }
      }
      ctx.putImageData(imgData, 0, 0)
    }
  } finally {
    URL.revokeObjectURL(aiUrl)
  }

  options.onProgress?.(1.0)
  return canvasToResult(canvas, width, height)
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
