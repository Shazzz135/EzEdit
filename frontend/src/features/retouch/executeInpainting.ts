import { type Point, type MaskStroke } from './types'
import { executePollinationsInpainting } from './pollinationsInpaint'
import { computeEditDimensions } from '@/features/ai/pollinationsEditUtils'

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
  ctx.drawImage(baseImg, 0, 0, width, height)
  const imgData = ctx.getImageData(0, 0, width, height)

  // 2. Prepare Mask Buffer (black background R=0, white mask strokes R=255 with soft feathering)
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

    mCtx.filter = 'blur(3px)'
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

  // 3. Build Reference Data URI with masked region neutralized so AI reconstructs it from context
  const refDataUri = buildMaskedReferenceDataUri(imgData, maskBuffer, width, height)

  // 4. Execute Pollinations.ai Image-to-Image Inpainting
  options.onProgress?.(0.3)
  const aiBlob = await executePollinationsInpainting(refDataUri, {
    prompt: options.prompt,
    width,
    height,
  })

  if (!aiBlob) {
    throw new Error('Pollinations.ai inpainting service unavailable')
  }

  // 5. Composite ONLY the masked pixels (Red channel maskBuffer[i * 4]) onto the original image
  options.onProgress?.(0.8)
  const aiUrl = URL.createObjectURL(aiBlob)
  try {
    const aiImg = await loadImage(aiUrl)
    const aiCanvas = document.createElement('canvas')
    aiCanvas.width = width
    aiCanvas.height = height
    const aiCtx = aiCanvas.getContext('2d')
    if (aiCtx) {
      aiCtx.imageSmoothingEnabled = true
      aiCtx.imageSmoothingQuality = 'high'
      aiCtx.drawImage(aiImg, 0, 0, width, height)
      const aiData = aiCtx.getImageData(0, 0, width, height).data
      const outData = imgData.data

      for (let i = 0; i < width * height; i++) {
        const mVal = maskBuffer[i * 4]
        if (mVal > 8) {
          const alpha = mVal / 255
          const inv = 1 - alpha
          const idx = i * 4
          outData[idx] = Math.round(outData[idx] * inv + aiData[idx] * alpha)
          outData[idx + 1] = Math.round(outData[idx + 1] * inv + aiData[idx + 1] * alpha)
          outData[idx + 2] = Math.round(outData[idx + 2] * inv + aiData[idx + 2] * alpha)
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

function buildMaskedReferenceDataUri(
  imgData: ImageData,
  maskBuffer: Uint8ClampedArray,
  width: number,
  height: number
): string {
  const workCanvas = document.createElement('canvas')
  workCanvas.width = width
  workCanvas.height = height
  const wCtx = workCanvas.getContext('2d')
  if (!wCtx) return ''

  const copy = new ImageData(new Uint8ClampedArray(imgData.data), width, height)
  let rSum = 0, gSum = 0, bSum = 0, count = 0
  for (let i = 0; i < width * height; i++) {
    const m = maskBuffer[i * 4]
    if (m > 0 && m < 180) {
      rSum += copy.data[i * 4]
      gSum += copy.data[i * 4 + 1]
      bSum += copy.data[i * 4 + 2]
      count++
    }
  }
  const avgR = count > 0 ? Math.round(rSum / count) : 128
  const avgG = count > 0 ? Math.round(gSum / count) : 128
  const avgB = count > 0 ? Math.round(bSum / count) : 128

  for (let i = 0; i < width * height; i++) {
    const m = maskBuffer[i * 4]
    if (m > 32) {
      const t = (m / 255) * 0.85
      const idx = i * 4
      copy.data[idx] = Math.round(copy.data[idx] * (1 - t) + avgR * t)
      copy.data[idx + 1] = Math.round(copy.data[idx + 1] * (1 - t) + avgG * t)
      copy.data[idx + 2] = Math.round(copy.data[idx + 2] * (1 - t) + avgB * t)
    }
  }
  wCtx.putImageData(copy, 0, 0)

  const { editW, editH } = computeEditDimensions(width, height, 1024)
  const scaledCanvas = document.createElement('canvas')
  scaledCanvas.width = editW
  scaledCanvas.height = editH
  const sCtx = scaledCanvas.getContext('2d')
  if (!sCtx) return workCanvas.toDataURL('image/jpeg', 0.9)
  sCtx.imageSmoothingEnabled = true
  sCtx.imageSmoothingQuality = 'high'
  sCtx.drawImage(workCanvas, 0, 0, editW, editH)
  return scaledCanvas.toDataURL('image/jpeg', 0.9)
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
