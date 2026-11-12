import { type Point } from '@/types/selection'
import { isPointInPolygon } from '@/features/selection/selectionGeometry'

export interface RemoveBackgroundOptions {
  tolerance?: number     // 1 to 100, default 25
  feather?: number       // 0 to 20px, default 2
  invert?: boolean
  contiguous?: boolean   // default true
  sampleColor?: { r: number; g: number; b: number }
  useAi?: boolean        // Use AI neural background removal if available
  removeBgApiKey?: string // Optional remove.bg API key
}

// Redmean perceptual color distance (approximates CIE76 human eye perception)
export function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const rmean = (r1 + r2) / 2
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  return Math.sqrt((((512 + rmean) * dr * dr) >> 8) + 4 * dg * dg + (((767 - rmean) * db * db) >> 8))
}

export function sampleEdgeColor(data: Uint8ClampedArray, width: number, _height: number) {
  // Sample top corners (safest background reference in portraits and products)
  const samplePoints = [
    0, // (0, 0)
    Math.min(width - 1, 4) * 4, // near (0, 0)
    (width - 1) * 4, // (w-1, 0)
    (width - Math.min(width, 5)) * 4, // near (w-1, 0)
  ]
  let r = 0, g = 0, b = 0, count = 0
  for (const idx of samplePoints) {
    if (data[idx + 3] > 0) {
      r += data[idx]
      g += data[idx + 1]
      b += data[idx + 2]
      count++
    }
  }
  if (count === 0) return { r: 255, g: 255, b: 255 }
  return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) }
}

function smoothMask(mask: Float32Array, width: number, height: number, radius: number): Float32Array {
  if (radius <= 0) return mask
  const rad = Math.min(10, Math.max(1, Math.round(radius)))
  const temp = new Float32Array(width * height)
  const output = new Float32Array(width * height)

  // Horizontal blur pass
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width
    for (let x = 0; x < width; x++) {
      let sum = 0, count = 0
      for (let k = -rad; k <= rad; k++) {
        const nx = x + k
        if (nx >= 0 && nx < width) {
          sum += mask[rowOffset + nx]
          count++
        }
      }
      temp[rowOffset + x] = sum / count
    }
  }

  // Vertical blur pass
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let sum = 0, count = 0
      for (let k = -rad; k <= rad; k++) {
        const ny = y + k
        if (ny >= 0 && ny < height) {
          sum += temp[ny * width + x]
          count++
        }
      }
      output[y * width + x] = sum / count
    }
  }
  return output
}

export function removeBackgroundFloodFill(imageData: ImageData, options: RemoveBackgroundOptions = {}): ImageData {
  const { tolerance = 25, feather = 2, invert = false, contiguous = true, sampleColor } = options
  const { width, height, data } = imageData

  const targetColor = sampleColor || sampleEdgeColor(data, width, height)
  const maxDist = (tolerance / 100) * 400
  const rawMask = new Float32Array(width * height) // 1.0 = remove, 0.0 = keep

  if (!contiguous) {
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4
      if (data[idx + 3] === 0) continue
      const dist = colorDistance(data[idx], data[idx + 1], data[idx + 2], targetColor.r, targetColor.g, targetColor.b)
      if (dist <= maxDist) rawMask[i] = 1.0
    }
  } else {
    const queue: number[] = []
    const visited = new Uint8Array(width * height)

    // Seed top edge and upper side boundaries to protect subject below
    for (let x = 0; x < width; x++) queue.push(x)
    const maxSideY = Math.min(height - 1, Math.floor(height * 0.45))
    for (let y = 1; y <= maxSideY; y++) {
      queue.push(y * width, y * width + (width - 1))
    }

    while (queue.length > 0) {
      const p = queue.pop()!
      if (visited[p]) continue
      visited[p] = 1

      const idx = p * 4
      if (data[idx + 3] === 0) continue
      const dist = colorDistance(data[idx], data[idx + 1], data[idx + 2], targetColor.r, targetColor.g, targetColor.b)

      if (dist <= maxDist) {
        rawMask[p] = 1.0
        const x = p % width
        const y = Math.floor(p / width)

        if (x > 0 && !visited[p - 1]) queue.push(p - 1)
        if (x < width - 1 && !visited[p + 1]) queue.push(p + 1)
        if (y > 0 && !visited[p - width]) queue.push(p - width)
        if (y < height - 1 && !visited[p + width]) queue.push(p + width)
      }
    }
  }

  // Smooth mask edges for clean, anti-aliased contours
  const finalMask = feather > 0 ? smoothMask(rawMask, width, height, feather) : rawMask

  for (let i = 0; i < width * height; i++) {
    const removalFactor = invert ? 1.0 - finalMask[i] : finalMask[i]
    if (removalFactor > 0) {
      const aIdx = i * 4 + 3
      data[aIdx] = Math.round(data[aIdx] * (1.0 - Math.min(1.0, removalFactor)))
    }
  }

  return imageData
}

export function removeBackgroundFromSelection(imageData: ImageData, paths: Point[][], invert = false): ImageData {
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
      const shouldRemove = invert ? inside : !inside
      if (shouldRemove) {
        data[(y * width + x) * 4 + 3] = 0
      }
    }
  }
  return imageData
}
