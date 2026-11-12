import { describe, it, expect } from 'vitest'
import {
  computeBrushWeight,
  blendCloneStampBuffer,
  blendHealingBuffer,
  blendSpotHealingBuffer,
} from '../retouchMath'

describe('Retouching Math & Algorithms', () => {
  describe('computeBrushWeight', () => {
    it('returns 0 for points outside brush radius or non-positive radius', () => {
      expect(computeBrushWeight(10, 10, 0.5)).toBe(0)
      expect(computeBrushWeight(15, 10, 0.5)).toBe(0)
      expect(computeBrushWeight(5, 0, 0.5)).toBe(0)
    })

    it('returns 1 inside inner hardness radius', () => {
      const radius = 20
      const hardness = 0.5 // inner radius is 10
      expect(computeBrushWeight(0, radius, hardness)).toBe(1)
      expect(computeBrushWeight(5, radius, hardness)).toBe(1)
      expect(computeBrushWeight(10, radius, hardness)).toBe(1)
    })

    it('smoothly interpolates between inner and outer radius', () => {
      const radius = 20
      const hardness = 0.5
      const mid = computeBrushWeight(15, radius, hardness)
      expect(mid).toBeGreaterThan(0)
      expect(mid).toBeLessThan(1)
      expect(Math.abs(mid - 0.5)).toBeLessThan(0.01) // at midpoint cosine gives 0.5
    })
  })

  describe('blendCloneStampBuffer', () => {
    it('transfers source pixel patch to destination coordinates', () => {
      const width = 20
      const height = 20
      const src = new Uint8ClampedArray(width * height * 4)
      const dst = new Uint8ClampedArray(width * height * 4)

      // Draw red at source (5, 5)
      const sIdx = (5 * width + 5) * 4
      src[sIdx] = 255 // R
      src[sIdx + 3] = 255 // A

      // Clone stamp from (5, 5) to (15, 15)
      blendCloneStampBuffer(src, dst, width, height, { x: 5, y: 5 }, { x: 15, y: 15 }, 3, 1.0, 1.0)

      const tIdx = (15 * width + 15) * 4
      expect(dst[tIdx]).toBe(255) // Red transferred to target
      expect(dst[tIdx + 1]).toBe(0)
      expect(dst[tIdx + 2]).toBe(0)
    })
  })

  describe('blendHealingBuffer', () => {
    it('blends sampled texture into destination lighting gradient', () => {
      const width = 20
      const height = 20
      const src = new Uint8ClampedArray(width * height * 4)
      const dst = new Uint8ClampedArray(width * height * 4)

      // Fill destination with dark skin tone (100, 70, 50)
      for (let i = 0; i < width * height; i++) {
        dst[i * 4] = 100
        dst[i * 4 + 1] = 70
        dst[i * 4 + 2] = 50
        dst[i * 4 + 3] = 255
      }

      // Source has bright highlights (200, 180, 160)
      for (let i = 0; i < width * height; i++) {
        src[i * 4] = 200
        src[i * 4 + 1] = 180
        src[i * 4 + 2] = 160
        src[i * 4 + 3] = 255
      }

      // Heal target (10, 10) from source (5, 5)
      blendHealingBuffer(src, dst, width, height, { x: 5, y: 5 }, { x: 10, y: 10 }, 4, 1.0, 1.0)

      const tIdx = (10 * width + 10) * 4
      // Healing adjusts source colors to match destination background ring!
      expect(dst[tIdx]).toBeLessThan(150)
      expect(dst[tIdx]).toBeGreaterThan(80)
    })
  })

  describe('blendSpotHealingBuffer', () => {
    it('eliminates central spot by blending neighborhood boundary colors inward', () => {
      const width = 20
      const height = 20
      const data = new Uint8ClampedArray(width * height * 4)

      // Fill with smooth background color (200, 150, 100)
      for (let i = 0; i < width * height; i++) {
        data[i * 4] = 200
        data[i * 4 + 1] = 150
        data[i * 4 + 2] = 100
        data[i * 4 + 3] = 255
      }

      // Create dark blemish at (10, 10)
      const bIdx = (10 * width + 10) * 4
      data[bIdx] = 20
      data[bIdx + 1] = 10
      data[bIdx + 2] = 5

      // Before healing, verify dark blemish
      expect(data[bIdx]).toBe(20)

      // Apply spot healing at (10, 10) with radius 4
      blendSpotHealingBuffer(data, width, height, { x: 10, y: 10 }, 4, 0.8)

      // Center pixel is healed to match surrounding background
      expect(data[bIdx]).toBeGreaterThan(150)
      expect(data[bIdx + 1]).toBeGreaterThan(100)
    })
  })
})
