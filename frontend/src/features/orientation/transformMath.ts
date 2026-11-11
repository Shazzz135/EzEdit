import { type RotateDegree } from '@/types/transform'

export const MIN_DIMENSION = 1
export const MAX_DIMENSION = 8192

export function clampDimension(
  val: number,
  min: number = MIN_DIMENSION,
  max: number = MAX_DIMENSION
): number {
  if (isNaN(val) || !isFinite(val)) return min
  return Math.max(min, Math.min(max, Math.round(val)))
}

export function calculateRotatedDimensions(
  width: number,
  height: number,
  degrees: RotateDegree
): { width: number; height: number } {
  const normDeg = ((Math.round(degrees) % 360) + 360) % 360
  if (normDeg === 0 || normDeg === 180) {
    return { width, height }
  }
  if (normDeg === 90 || normDeg === 270) {
    return { width: height, height: width }
  }
  const rad = (normDeg * Math.PI) / 180
  const sin = Math.abs(Math.sin(rad))
  const cos = Math.abs(Math.cos(rad))
  const targetW = Math.round(width * cos + height * sin)
  const targetH = Math.round(width * sin + height * cos)
  return {
    width: clampDimension(targetW),
    height: clampDimension(targetH),
  }
}

export function calculateAspectResize(
  origW: number,
  origH: number,
  changedDimension: 'width' | 'height',
  newValue: number
): { width: number; height: number } {
  const safeOrigW = Math.max(1, origW)
  const safeOrigH = Math.max(1, origH)
  const safeVal = Math.max(1, newValue)

  if (changedDimension === 'width') {
    const calculatedHeight = Math.round((safeVal * safeOrigH) / safeOrigW)
    return {
      width: clampDimension(safeVal),
      height: clampDimension(calculatedHeight),
    }
  }

  const calculatedWidth = Math.round((safeVal * safeOrigW) / safeOrigH)
  return {
    width: clampDimension(calculatedWidth),
    height: clampDimension(safeVal),
  }
}

export function calculateStretchDimensions(
  origW: number,
  origH: number,
  scaleXPercent: number,
  scaleYPercent: number
): { width: number; height: number } {
  const safeW = Math.max(1, origW)
  const safeH = Math.max(1, origH)
  const targetW = Math.round(safeW * (Math.max(1, scaleXPercent) / 100))
  const targetH = Math.round(safeH * (Math.max(1, scaleYPercent) / 100))

  return {
    width: clampDimension(targetW),
    height: clampDimension(targetH),
  }
}
