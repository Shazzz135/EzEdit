import {
  type TransformResult,
  type RotateDegree,
  type FlipDirection,
} from '@/types/transform'
import { clampDimension } from './transformMath'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image for transform'))
    img.src = src
  })
}

function canvasToResult(canvas: HTMLCanvasElement): Promise<TransformResult> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create transformed image blob'))
        return
      }
      const url = URL.createObjectURL(blob)
      resolve({
        blob,
        url,
        width: canvas.width,
        height: canvas.height,
      })
    }, 'image/png')
  })
}

export async function executeRotate(
  imageSrc: string,
  degrees: RotateDegree
): Promise<TransformResult> {
  const img = await loadImage(imageSrc)
  const normDeg = ((Math.round(degrees) % 360) + 360) % 360

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to acquire canvas 2D context')

  if (normDeg === 90) {
    canvas.width = img.height
    canvas.height = img.width
    ctx.translate(canvas.width, 0)
    ctx.rotate((90 * Math.PI) / 180)
    ctx.drawImage(img, 0, 0)
  } else if (normDeg === 180) {
    canvas.width = img.width
    canvas.height = img.height
    ctx.translate(canvas.width, canvas.height)
    ctx.rotate(Math.PI)
    ctx.drawImage(img, 0, 0)
  } else if (normDeg === 270) {
    canvas.width = img.height
    canvas.height = img.width
    ctx.translate(0, canvas.height)
    ctx.rotate((270 * Math.PI) / 180)
    ctx.drawImage(img, 0, 0)
  } else {
    const rad = (normDeg * Math.PI) / 180
    const sin = Math.abs(Math.sin(rad))
    const cos = Math.abs(Math.cos(rad))
    const targetW = clampDimension(Math.round(img.width * cos + img.height * sin))
    const targetH = clampDimension(Math.round(img.width * sin + img.height * cos))

    canvas.width = targetW
    canvas.height = targetH

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(rad)
    ctx.drawImage(img, -img.width / 2, -img.height / 2)
  }

  return canvasToResult(canvas)
}

export async function executeFlip(
  imageSrc: string,
  direction: FlipDirection
): Promise<TransformResult> {
  const img = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to acquire canvas 2D context')

  if (direction === 'horizontal') {
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
  } else {
    ctx.translate(0, canvas.height)
    ctx.scale(1, -1)
  }

  ctx.drawImage(img, 0, 0)
  return canvasToResult(canvas)
}

export async function executeResize(
  imageSrc: string,
  targetWidth: number,
  targetHeight: number
): Promise<TransformResult> {
  const img = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = clampDimension(targetWidth)
  canvas.height = clampDimension(targetHeight)

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to acquire canvas 2D context')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  return canvasToResult(canvas)
}

export async function executeStretch(
  imageSrc: string,
  scaleXPercent: number,
  scaleYPercent: number
): Promise<TransformResult> {
  const img = await loadImage(imageSrc)
  const targetW = clampDimension(Math.round(img.width * (scaleXPercent / 100)))
  const targetH = clampDimension(Math.round(img.height * (scaleYPercent / 100)))

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to acquire canvas 2D context')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, targetW, targetH)

  return canvasToResult(canvas)
}
