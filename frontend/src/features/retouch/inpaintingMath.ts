export interface InpaintingProgressCallback {
  (progress: number): void
}

const DIRS_8: readonly [number, number][] = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [-1, -1], [1, -1], [-1, 1],
]

export function runInpaintingMath(
  imageBuffer: Uint8ClampedArray,
  maskBuffer: Uint8ClampedArray,
  width: number,
  height: number,
  onProgress?: InpaintingProgressCallback
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(imageBuffer)
  const totalPixels = width * height
  if (totalPixels === 0) return result

  // 1. Extract initial mask (0 = clean background, 2 = masked hole)
  const rawMask = new Uint8Array(totalPixels)
  let rawHoleCount = 0
  for (let i = 0; i < totalPixels; i++) {
    const mVal = maskBuffer.length === totalPixels ? maskBuffer[i] : (maskBuffer[i * 4] || maskBuffer[i * 4 + 3])
    if (mVal > 32) {
      rawMask[i] = 2
      rawHoleCount++
    }
  }
  if (rawHoleCount === 0) return result

  // Dilate mask slightly on real images so object border fringes are never sampled as clean background
  const status = new Uint8Array(rawMask)
  const dilateRadius = width > 32 && height > 32
    ? Math.min(4, Math.max(2, Math.round(Math.sqrt(rawHoleCount) * 0.025)))
    : 0

  if (dilateRadius > 0 && rawHoleCount < totalPixels * 0.85) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (rawMask[y * width + x] !== 2) continue
        for (let dy = -dilateRadius; dy <= dilateRadius; dy++) {
          const ny = y + dy
          if (ny < 0 || ny >= height) continue
          for (let dx = -dilateRadius; dx <= dilateRadius; dx++) {
            const nx = x + dx
            if (nx >= 0 && nx < width && dx * dx + dy * dy <= dilateRadius * dilateRadius) {
              status[ny * width + nx] = 2
            }
          }
        }
      }
    }
  }

  const isHole = new Uint8Array(totalPixels)
  const distMap = new Int16Array(totalPixels)
  const queue = new Int32Array(totalPixels)
  let head = 0, tail = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (status[idx] !== 2) continue
      isHole[idx] = 1
      let touchesKnown = false
      for (let dy = -1; dy <= 1 && !touchesKnown; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = x + dx, ny = y + dy
          if (nx >= 0 && nx < width && ny >= 0 && ny < height && status[ny * width + nx] === 0) {
            touchesKnown = true
            break
          }
        }
      }
      if (touchesKnown) {
        status[idx] = 1
        distMap[idx] = 1
        queue[tail++] = idx
      }
    }
  }

  if (tail === 0) return result

  // 2. Stage 1: Multi-Radius Fast Marching Harmonic Illumination Fill
  while (head < tail) {
    const idx = queue[head++]
    const x = idx % width, y = (idx - x) / width
    const depth = distMap[idx]
    const searchRadius = Math.min(12, 4 + (depth >> 1))

    let sumR = 0, sumG = 0, sumB = 0, sumWeight = 0
    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      const ny = y + dy
      if (ny < 0 || ny >= height) continue
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        if (dx === 0 && dy === 0) continue
        const nx = x + dx
        if (nx < 0 || nx >= width) continue
        const nIdx = ny * width + nx
        if (status[nIdx] === 0) {
          const d2 = dx * dx + dy * dy
          const weight = 1 / ((d2 + 0.5) * (1 + distMap[nIdx] * 0.45))
          const pIdx = nIdx * 4
          sumR += result[pIdx] * weight
          sumG += result[pIdx + 1] * weight
          sumB += result[pIdx + 2] * weight
          sumWeight += weight
        }
      }
    }

    if (sumWeight > 0) {
      const pIdx = idx * 4
      result[pIdx] = Math.round(sumR / sumWeight)
      result[pIdx + 1] = Math.round(sumG / sumWeight)
      result[pIdx + 2] = Math.round(sumB / sumWeight)
      result[pIdx + 3] = 255
    }

    status[idx] = 0
    if (head % 400 === 0 && onProgress) {
      onProgress(Math.min(0.6, (head / Math.max(1, rawHoleCount)) * 0.6))
    }

    for (let k = 0; k < 4; k++) {
      const nx = x + DIRS_8[k][0], ny = y + DIRS_8[k][1]
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx
        if (status[nIdx] === 2) {
          status[nIdx] = 1
          distMap[nIdx] = depth + 1
          queue[tail++] = nIdx
        }
      }
    }
  }

  // 3. Stage 2: Coherent Exemplar Patch Synthesis (Texture & Detail Transfer)
  const harmonicBuffer = new Uint8ClampedArray(result)
  const sourceMap = new Int32Array(totalPixels).fill(-1)
  const maxRaySteps = Math.max(width, height)

  for (let q = 0; q < tail; q++) {
    const idx = queue[q]
    const x = idx % width, y = (idx - x) / width
    const pIdx = idx * 4
    const targetR = harmonicBuffer[pIdx], targetG = harmonicBuffer[pIdx + 1], targetB = harmonicBuffer[pIdx + 2]
    let bestSrc = -1, bestCost = 1e9

    // A. Coherent PatchMatch propagation from already-synthesized neighbors
    for (let k = 0; k < 4; k++) {
      const nx = x + DIRS_8[k][0], ny = y + DIRS_8[k][1]
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
      const nSrc = sourceMap[ny * width + nx]
      if (nSrc < 0) continue
      const sx = (nSrc % width) - DIRS_8[k][0], sy = Math.floor(nSrc / width) - DIRS_8[k][1]
      if (sx >= 1 && sx < width - 1 && sy >= 1 && sy < height - 1) {
        const candIdx = sy * width + sx
        if (isHole[candIdx] === 0) {
          const cIdx = candIdx * 4
          const dr = imageBuffer[cIdx] - targetR, dg = imageBuffer[cIdx + 1] - targetG, db = imageBuffer[cIdx + 2] - targetB
          const cost = (dr * dr + dg * dg + db * db) * 0.65
          if (cost < bestCost) { bestCost = cost; bestSrc = candIdx }
        }
      }
    }

    // B. Radial compass ray-cast into surrounding clean background ring
    const jitter = ((x * 73856093) ^ (y * 19349663)) >>> 0
    for (let d = 0; d < 8; d++) {
      const dx = DIRS_8[d][0], dy = DIRS_8[d][1]
      let rx = x + dx, ry = y + dy, steps = 0
      while (rx >= 1 && rx < width - 1 && ry >= 1 && ry < height - 1 && steps < maxRaySteps) {
        const rIdx = ry * width + rx
        if (isHole[rIdx] === 0) {
          const offsetSteps = 2 + ((jitter + d * 3) % 7)
          const sx = Math.max(1, Math.min(width - 2, rx + dx * offsetSteps))
          const sy = Math.max(1, Math.min(height - 2, ry + dy * offsetSteps))
          const candIdx = isHole[sy * width + sx] === 0 ? sy * width + sx : rIdx
          const cIdx = candIdx * 4
          const dr = imageBuffer[cIdx] - targetR, dg = imageBuffer[cIdx + 1] - targetG, db = imageBuffer[cIdx + 2] - targetB
          const cost = dr * dr + dg * dg + db * db + steps * 1.5
          if (cost < bestCost) { bestCost = cost; bestSrc = candIdx }
          break
        }
        rx += dx; ry += dy; steps++
      }
    }

    if (bestSrc >= 0) {
      sourceMap[idx] = bestSrc
      const sx = bestSrc % width, sy = (bestSrc - sx) / width
      let mR = 0, mG = 0, mB = 0, cnt = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = sx + dx, ny = sy + dy
          if (nx >= 0 && nx < width && ny >= 0 && ny < height && isHole[ny * width + nx] === 0) {
            const np = (ny * width + nx) * 4
            mR += imageBuffer[np]; mG += imageBuffer[np + 1]; mB += imageBuffer[np + 2]; cnt++
          }
        }
      }
      const sIdx4 = bestSrc * 4
      const detR = cnt > 0 ? imageBuffer[sIdx4] - mR / cnt : 0
      const detG = cnt > 0 ? imageBuffer[sIdx4 + 1] - mG / cnt : 0
      const detB = cnt > 0 ? imageBuffer[sIdx4 + 2] - mB / cnt : 0
      const edgeFeather = Math.min(1, distMap[idx] / 3)
      const baseMixR = targetR * (1 - 0.35 * edgeFeather) + imageBuffer[sIdx4] * (0.35 * edgeFeather)
      const baseMixG = targetG * (1 - 0.35 * edgeFeather) + imageBuffer[sIdx4 + 1] * (0.35 * edgeFeather)
      const baseMixB = targetB * (1 - 0.35 * edgeFeather) + imageBuffer[sIdx4 + 2] * (0.35 * edgeFeather)
      result[pIdx] = Math.max(0, Math.min(255, Math.round(baseMixR + detR * edgeFeather)))
      result[pIdx + 1] = Math.max(0, Math.min(255, Math.round(baseMixG + detG * edgeFeather)))
      result[pIdx + 2] = Math.max(0, Math.min(255, Math.round(baseMixB + detB * edgeFeather)))
    }
    if (q % 400 === 0 && onProgress) onProgress(0.6 + Math.min(0.38, (q / tail) * 0.38))
  }

  onProgress?.(1.0)
  return result
}
