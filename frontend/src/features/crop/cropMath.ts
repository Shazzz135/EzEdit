import { type AspectRatio, type CropRect, type CropHandle } from '@/types/crop'

export const MIN_CROP_SIZE = 24

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

export function getAspectRatioValue(
  ratio: AspectRatio,
  _imageWidth?: number,
  _imageHeight?: number
): number | null {
  switch (ratio) {
    case 'free':
      return null
    case '1:1':
      return 1.0
    case '16:9':
      return 16 / 9
    case '4:3':
      return 4 / 3
    case '9:16':
      return 9 / 16
    case '3:2':
      return 3 / 2
    case '2:3':
      return 2 / 3
    default:
      return null
  }
}

export function calculateInitialCrop(
  imageWidth: number,
  imageHeight: number,
  ratio: AspectRatio
): CropRect {
  const ratioValue = getAspectRatioValue(ratio, imageWidth, imageHeight)

  if (!ratioValue) {
    // Free crop fills the full space of the image (e.g. 200x200 fills 200x200)
    return { x: 0, y: 0, width: imageWidth, height: imageHeight }
  }

  const maxWidth = imageWidth * 0.9
  const maxHeight = imageHeight * 0.9

  let width: number
  let height: number

  if (maxWidth / maxHeight > ratioValue) {
    height = Math.round(maxHeight)
    width = Math.round(height * ratioValue)
  } else {
    width = Math.round(maxWidth)
    height = Math.round(width / ratioValue)
  }

  const x = Math.round((imageWidth - width) / 2)
  const y = Math.round((imageHeight - height) / 2)

  return { x, y, width, height }
}

export function calculateResizeCrop(
  start: CropRect,
  handle: CropHandle,
  deltaX: number,
  deltaY: number,
  imgW: number,
  imgH: number,
  ratioValue: number | null
): CropRect {
  if (handle === 'move') {
    const x = clamp(start.x + deltaX, 0, Math.max(0, imgW - start.width))
    const y = clamp(start.y + deltaY, 0, Math.max(0, imgH - start.height))
    return { x, y, width: start.width, height: start.height }
  }

  let x = start.x
  let y = start.y
  let w = start.width
  let h = start.height

  // Handle free resizing first
  if (handle.includes('e')) {
    w = clamp(start.width + deltaX, MIN_CROP_SIZE, imgW - start.x)
  }
  if (handle.includes('s')) {
    h = clamp(start.height + deltaY, MIN_CROP_SIZE, imgH - start.y)
  }
  if (handle.includes('w')) {
    const maxX = start.x + start.width - MIN_CROP_SIZE
    const newX = clamp(start.x + deltaX, 0, maxX)
    w = start.width + (start.x - newX)
    x = newX
  }
  if (handle.includes('n')) {
    const maxY = start.y + start.height - MIN_CROP_SIZE
    const newY = clamp(start.y + deltaY, 0, maxY)
    h = start.height + (start.y - newY)
    y = newY
  }

  // If aspect ratio is locked, fit dimensions proportionally
  if (ratioValue) {
    if (handle === 'e' || handle === 'w' || Math.abs(deltaX) > Math.abs(deltaY)) {
      h = Math.round(w / ratioValue)
      if (y + h > imgH) {
        h = imgH - y
        w = Math.round(h * ratioValue)
      }
    } else {
      w = Math.round(h * ratioValue)
      if (x + w > imgW) {
        w = imgW - x
        h = Math.round(w / ratioValue)
      }
    }

    // Ensure within image bounds
    if (handle.includes('n')) {
      y = start.y + (start.height - h)
    }
    if (handle.includes('w')) {
      x = start.x + (start.width - w)
    }

    x = clamp(x, 0, imgW - w)
    y = clamp(y, 0, imgH - h)
  }

  return { x, y, width: Math.max(MIN_CROP_SIZE, w), height: Math.max(MIN_CROP_SIZE, h) }
}
