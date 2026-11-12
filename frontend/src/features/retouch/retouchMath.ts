import { type Point } from './types'

export function computeBrushWeight(dist: number, radius: number, hardness: number): number {
  if (dist >= radius || radius <= 0) return 0
  const innerRadius = radius * Math.max(0, Math.min(1, hardness))
  if (dist <= innerRadius) return 1
  const t = (dist - innerRadius) / (radius - innerRadius)
  return 0.5 * (1 + Math.cos(t * Math.PI))
}

export function blendCloneStampBuffer(
  srcData: Uint8ClampedArray,
  dstData: Uint8ClampedArray,
  width: number,
  height: number,
  sourcePt: Point,
  targetPt: Point,
  radius: number,
  hardness: number,
  opacity: number
): void {
  const r = Math.ceil(radius)
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const dist = Math.hypot(dx, dy)
      if (dist >= radius) continue
      const tx = Math.round(targetPt.x + dx)
      const ty = Math.round(targetPt.y + dy)
      const sx = Math.round(sourcePt.x + dx)
      const sy = Math.round(sourcePt.y + dy)
      if (tx < 0 || tx >= width || ty < 0 || ty >= height) continue
      if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue

      const weight = computeBrushWeight(dist, radius, hardness) * opacity
      const tIdx = (ty * width + tx) * 4
      const sIdx = (sy * width + sx) * 4

      dstData[tIdx] = Math.round(dstData[tIdx] * (1 - weight) + srcData[sIdx] * weight)
      dstData[tIdx + 1] = Math.round(dstData[tIdx + 1] * (1 - weight) + srcData[sIdx + 1] * weight)
      dstData[tIdx + 2] = Math.round(dstData[tIdx + 2] * (1 - weight) + srcData[sIdx + 2] * weight)
    }
  }
}

export function blendHealingBuffer(
  srcData: Uint8ClampedArray,
  dstData: Uint8ClampedArray,
  width: number,
  height: number,
  sourcePt: Point,
  targetPt: Point,
  radius: number,
  hardness: number,
  opacity: number
): void {
  const r = Math.ceil(radius)
  let destR = 0, destG = 0, destB = 0, destCount = 0
  let srcR = 0, srcG = 0, srcB = 0, srcCount = 0

  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const dist = Math.hypot(dx, dy)
      const tx = Math.round(targetPt.x + dx)
      const ty = Math.round(targetPt.y + dy)
      const sx = Math.round(sourcePt.x + dx)
      const sy = Math.round(sourcePt.y + dy)

      if (dist >= radius * 0.75 && dist <= radius && tx >= 0 && tx < width && ty >= 0 && ty < height) {
        const tIdx = (ty * width + tx) * 4
        destR += dstData[tIdx]
        destG += dstData[tIdx + 1]
        destB += dstData[tIdx + 2]
        destCount++
      }
      if (dist < radius && sx >= 0 && sx < width && sy >= 0 && sy < height) {
        const sIdx = (sy * width + sx) * 4
        srcR += srcData[sIdx]
        srcG += srcData[sIdx + 1]
        srcB += srcData[sIdx + 2]
        srcCount++
      }
    }
  }

  const dR = (destCount > 0 ? destR / destCount : 128) - (srcCount > 0 ? srcR / srcCount : 128)
  const dG = (destCount > 0 ? destG / destCount : 128) - (srcCount > 0 ? srcG / srcCount : 128)
  const dB = (destCount > 0 ? destB / destCount : 128) - (srcCount > 0 ? srcB / srcCount : 128)

  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const dist = Math.hypot(dx, dy)
      if (dist >= radius) continue
      const tx = Math.round(targetPt.x + dx)
      const ty = Math.round(targetPt.y + dy)
      const sx = Math.round(sourcePt.x + dx)
      const sy = Math.round(sourcePt.y + dy)
      if (tx < 0 || tx >= width || ty < 0 || ty >= height) continue
      if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue

      const weight = computeBrushWeight(dist, radius, hardness) * opacity
      const tIdx = (ty * width + tx) * 4
      const sIdx = (sy * width + sx) * 4

      const healedR = Math.min(255, Math.max(0, srcData[sIdx] + dR))
      const healedG = Math.min(255, Math.max(0, srcData[sIdx + 1] + dG))
      const healedB = Math.min(255, Math.max(0, srcData[sIdx + 2] + dB))

      dstData[tIdx] = Math.round(dstData[tIdx] * (1 - weight) + healedR * weight)
      dstData[tIdx + 1] = Math.round(dstData[tIdx + 1] * (1 - weight) + healedG * weight)
      dstData[tIdx + 2] = Math.round(dstData[tIdx + 2] * (1 - weight) + healedB * weight)
    }
  }
}

export function blendSpotHealingBuffer(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  targetPt: Point,
  radius: number,
  hardness: number
): void {
  const r = Math.ceil(radius)
  let ringR = 0, ringG = 0, ringB = 0, ringCount = 0

  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const dist = Math.hypot(dx, dy)
      const tx = Math.round(targetPt.x + dx)
      const ty = Math.round(targetPt.y + dy)
      if (dist >= radius * 0.75 && dist <= radius && tx >= 0 && tx < width && ty >= 0 && ty < height) {
        const idx = (ty * width + tx) * 4
        ringR += data[idx]
        ringG += data[idx + 1]
        ringB += data[idx + 2]
        ringCount++
      }
    }
  }

  if (ringCount === 0) return
  const avgR = ringR / ringCount
  const avgG = ringG / ringCount
  const avgB = ringB / ringCount

  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const dist = Math.hypot(dx, dy)
      if (dist >= radius) continue
      const tx = Math.round(targetPt.x + dx)
      const ty = Math.round(targetPt.y + dy)
      if (tx < 0 || tx >= width || ty < 0 || ty >= height) continue

      const weight = computeBrushWeight(dist, radius, hardness)
      const idx = (ty * width + tx) * 4

      data[idx] = Math.round(data[idx] * (1 - weight) + avgR * weight)
      data[idx + 1] = Math.round(data[idx + 1] * (1 - weight) + avgG * weight)
      data[idx + 2] = Math.round(data[idx + 2] * (1 - weight) + avgB * weight)
    }
  }
}

export function applyCloneStampPatch(
  ctx: CanvasRenderingContext2D,
  sourceImg: CanvasImageSource,
  sourcePt: Point,
  targetPt: Point,
  radius: number,
  hardness: number,
  opacity: number
): void {
  const w = ctx.canvas.width
  const h = ctx.canvas.height
  const tData = ctx.getImageData(0, 0, w, h)
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = w
  tempCanvas.height = h
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return
  tempCtx.drawImage(sourceImg, 0, 0)
  const sData = tempCtx.getImageData(0, 0, w, h)

  blendCloneStampBuffer(sData.data, tData.data, w, h, sourcePt, targetPt, radius, hardness, opacity)
  ctx.putImageData(tData, 0, 0)
}

export function applyHealingPatch(
  ctx: CanvasRenderingContext2D,
  sourceImg: CanvasImageSource,
  sourcePt: Point,
  targetPt: Point,
  radius: number,
  hardness: number,
  opacity: number
): void {
  const w = ctx.canvas.width
  const h = ctx.canvas.height
  const tData = ctx.getImageData(0, 0, w, h)
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = w
  tempCanvas.height = h
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return
  tempCtx.drawImage(sourceImg, 0, 0)
  const sData = tempCtx.getImageData(0, 0, w, h)

  blendHealingBuffer(sData.data, tData.data, w, h, sourcePt, targetPt, radius, hardness, opacity)
  ctx.putImageData(tData, 0, 0)
}

export function applySpotHealing(
  ctx: CanvasRenderingContext2D,
  targetPt: Point,
  radius: number,
  hardness: number
): void {
  const w = ctx.canvas.width
  const h = ctx.canvas.height
  const tData = ctx.getImageData(0, 0, w, h)
  blendSpotHealingBuffer(tData.data, w, h, targetPt, radius, hardness)
  ctx.putImageData(tData, 0, 0)
}
