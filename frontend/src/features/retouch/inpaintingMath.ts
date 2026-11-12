export interface InpaintingProgressCallback {
  (progress: number): void
}

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

  // Mask status: 0 = known/unmasked, 1 = boundary, 2 = inside hole
  const status = new Uint8Array(totalPixels)
  let holePixelCount = 0

  for (let i = 0; i < totalPixels; i++) {
    // Mask can be 1-channel or 4-channel; check if alpha or red > 32
    const mVal = maskBuffer.length === totalPixels ? maskBuffer[i] : maskBuffer[i * 4 + 3] || maskBuffer[i * 4]
    if (mVal > 32) {
      status[i] = 2
      holePixelCount++
    }
  }

  if (holePixelCount === 0) return result

  // Find initial boundary pixels (hole pixels adjacent to at least one known pixel)
  const boundaryQueue: number[] = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (status[idx] !== 2) continue

      let hasKnownNeighbor = false
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            if (status[ny * width + nx] === 0) {
              hasKnownNeighbor = true
              break
            }
          }
        }
        if (hasKnownNeighbor) break
      }

      if (hasKnownNeighbor) {
        status[idx] = 1
        boundaryQueue.push(idx)
      }
    }
  }

  const initialBoundaryCount = boundaryQueue.length
  let processedHolePixels = 0

  // Multi-pass Telea-style Fast Marching inward propagation
  while (boundaryQueue.length > 0) {
    const idx = boundaryQueue.shift()!
    const x = idx % width
    const y = Math.floor(idx / width)

    let sumR = 0, sumG = 0, sumB = 0, sumWeight = 0
    const searchRadius = 3

    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        if (dx === 0 && dy === 0) continue
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIdx = ny * width + nx
          // Only sample known or already-inpainted pixels
          if (status[nIdx] === 0) {
            const dist = Math.hypot(dx, dy)
            const weight = 1 / (dist * dist + 0.1)
            const pIdx = nIdx * 4
            sumR += result[pIdx] * weight
            sumG += result[pIdx + 1] * weight
            sumB += result[pIdx + 2] * weight
            sumWeight += weight
          }
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

    // Mark current pixel as known
    status[idx] = 0
    processedHolePixels++

    if (processedHolePixels % 200 === 0 && onProgress) {
      onProgress(Math.min(0.95, processedHolePixels / (holePixelCount + initialBoundaryCount)))
    }

    // Check 4-connected neighbors to add new boundary pixels
    const neighbors = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ]

    for (const nb of neighbors) {
      if (nb.x >= 0 && nb.x < width && nb.y >= 0 && nb.y < height) {
        const nIdx = nb.y * width + nb.x
        if (status[nIdx] === 2) {
          status[nIdx] = 1
          boundaryQueue.push(nIdx)
        }
      }
    }
  }

  onProgress?.(1.0)
  return result
}
