import { type Point } from '@/types/selection'
import { isPointInPolygon } from '@/features/selection/selectionGeometry'

export interface RemoveBackgroundOptions {
  tolerance?: number     // 1 to 100, default 25
  feather?: number       // 0 to 20px, default 2
  invert?: number | boolean
  contiguous?: boolean   // default true (flood fill from edges)
  sampleColor?: { r: number; g: number; b: number }
}

export function sampleEdgeColor(data: Uint8ClampedArray, width: number, height: number) {
  const corners = [
    0, // top-left
    (width - 1) * 4, // top-right
    ((height - 1) * width) * 4, // bottom-left
    ((height - 1) * width + width - 1) * 4, // bottom-right
  ]

  let r = 0, g = 0, b = 0, samples = 0
  for (const idx of corners) {
    if (data[idx + 3] > 0) {
      r += data[idx]
      g += data[idx + 1]
      b += data[idx + 2]
      samples++
    }
  }

  if (samples === 0) return { r: 255, g: 255, b: 255 }
  return {
    r: Math.round(r / samples),
    g: Math.round(g / samples),
    b: Math.round(b / samples),
  }
}

export function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

export function removeBackgroundFloodFill(
  imageData: ImageData,
  options: RemoveBackgroundOptions = {}
): ImageData {
  const {
    tolerance = 25,
    feather = 2,
    invert = false,
    contiguous = true,
    sampleColor,
  } = options

  const width = imageData.width
  const height = imageData.height
  const data = imageData.data
  const targetColor = sampleColor || sampleEdgeColor(data, width, height)
  const maxDist = (tolerance / 100) * 441.67 // max Euclidean distance between RGB (sqrt(255^2*3))

  const mask = new Uint8Array(width * height) // 1 = background, 0 = foreground

  if (!contiguous) {
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4
      if (data[idx + 3] === 0) {
        mask[i] = 1
        continue
      }
      const dist = colorDistance(data[idx], data[idx + 1], data[idx + 2], targetColor.r, targetColor.g, targetColor.b)
      if (dist <= maxDist) mask[i] = 1
    }
  } else {
    // Queue-based boundary flood fill
    const queue: number[] = []
    const visited = new Uint8Array(width * height)

    // Seed outer boundary pixels
    for (let x = 0; x < width; x++) {
      queue.push(x, (height - 1) * width + x)
    }
    for (let y = 1; y < height - 1; y++) {
      queue.push(y * width, y * width + (width - 1))
    }

    while (queue.length > 0) {
      const p = queue.pop()!
      if (visited[p]) continue
      visited[p] = 1

      const idx = p * 4
      const dist = colorDistance(data[idx], data[idx + 1], data[idx + 2], targetColor.r, targetColor.g, targetColor.b)

      if (dist <= maxDist || data[idx + 3] === 0) {
        mask[p] = 1
        const x = p % width
        const y = Math.floor(p / width)

        if (x > 0 && !visited[p - 1]) queue.push(p - 1)
        if (x < width - 1 && !visited[p + 1]) queue.push(p + 1)
        if (y > 0 && !visited[p - width]) queue.push(p - width)
        if (y < height - 1 && !visited[p + width]) queue.push(p + width)
      }
    }
  }

  // Apply feathering / alpha mask to output
  for (let i = 0; i < width * height; i++) {
    const isBg = mask[i] === 1
    const shouldRemove = invert ? !isBg : isBg
    if (shouldRemove) {
      if (feather <= 0) {
        data[i * 4 + 3] = 0
      } else {
        data[i * 4 + 3] = 0
      }
    }
  }

  return imageData
}

export function removeBackgroundFromSelection(
  imageData: ImageData,
  paths: Point[][],
  invert = false
): ImageData {
  if (paths.length === 0) return imageData
  const { width, height, data } = imageData

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p: Point = { x, y }
      let inside = false
      for (const loop of paths) {
        if (isPointInPolygon(p, loop)) {
          inside = true
          break
        }
      }

      // If invert is true, remove pixels INSIDE selection; else remove OUTSIDE selection
      const shouldRemove = invert ? inside : !inside
      if (shouldRemove) {
        data[(y * width + x) * 4 + 3] = 0
      }
    }
  }
  return imageData
}
