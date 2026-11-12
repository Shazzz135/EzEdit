import { describe, it, expect } from 'vitest'
import {
  computeBrushWeight,
  blendCloneStampBuffer,
  blendHealingBuffer,
  blendSpotHealingBuffer,
} from '../retouchMath'
import { executePollinationsInpainting } from '../pollinationsInpaint'

describe('Retouching Math & Algorithms', () => {
  describe('computeBrushWeight', () => {
    it('returns 0 for points outside brush radius or non-positive radius', () => {
      expect(computeBrushWeight(10, 10, 0.5)).toBe(0)
      expect(computeBrushWeight(15, 10, 0.5)).toBe(0)
      expect(computeBrushWeight(5, 0, 0.5)).toBe(0)
    })

    it('returns 1 inside inner hardness radius', () => {
      const radius = 20
      const hardness = 0.5
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
      expect(Math.abs(mid - 0.5)).toBeLessThan(0.01)
    })
  })

  describe('blendCloneStampBuffer', () => {
    it('transfers source pixel patch to destination coordinates', () => {
      const width = 20
      const height = 20
      const src = new Uint8ClampedArray(width * height * 4)
      const dst = new Uint8ClampedArray(width * height * 4)

      const sIdx = (5 * width + 5) * 4
      src[sIdx] = 255
      src[sIdx + 3] = 255

      blendCloneStampBuffer(src, dst, width, height, { x: 5, y: 5 }, { x: 15, y: 15 }, 3, 1.0, 1.0)

      const tIdx = (15 * width + 15) * 4
      expect(dst[tIdx]).toBe(255)
      expect(dst[tIdx + 1]).toBe(0)
    })
  })

  describe('blendHealingBuffer', () => {
    it('blends sampled texture into destination lighting gradient', () => {
      const width = 20
      const height = 20
      const src = new Uint8ClampedArray(width * height * 4)
      const dst = new Uint8ClampedArray(width * height * 4)

      for (let i = 0; i < width * height; i++) {
        dst[i * 4] = 100
        dst[i * 4 + 1] = 70
        dst[i * 4 + 2] = 50
        dst[i * 4 + 3] = 255
      }

      for (let i = 0; i < width * height; i++) {
        src[i * 4] = 200
        src[i * 4 + 1] = 180
        src[i * 4 + 2] = 160
        src[i * 4 + 3] = 255
      }

      blendHealingBuffer(src, dst, width, height, { x: 5, y: 5 }, { x: 10, y: 10 }, 4, 1.0, 1.0)

      const tIdx = (10 * width + 10) * 4
      expect(dst[tIdx]).toBeLessThan(150)
      expect(dst[tIdx]).toBeGreaterThan(80)
    })
  })

  describe('blendSpotHealingBuffer', () => {
    it('eliminates central spot by blending neighborhood boundary colors inward', () => {
      const width = 20
      const height = 20
      const data = new Uint8ClampedArray(width * height * 4)

      for (let i = 0; i < width * height; i++) {
        data[i * 4] = 200
        data[i * 4 + 1] = 150
        data[i * 4 + 2] = 100
        data[i * 4 + 3] = 255
      }

      const bIdx = (10 * width + 10) * 4
      data[bIdx] = 20
      data[bIdx + 1] = 10
      data[bIdx + 2] = 5

      blendSpotHealingBuffer(data, width, height, { x: 10, y: 10 }, 4, 0.8)

      expect(data[bIdx]).toBeGreaterThan(150)
      expect(data[bIdx + 1]).toBeGreaterThan(100)
    })
  })

  describe('executePollinationsInpainting', () => {
    it('gracefully handles offline or network timeout without crashing', async () => {
      const res = await executePollinationsInpainting('data:image/png;base64,invalid', {
        width: 100,
        height: 100,
      })
      expect(res === null || res instanceof Blob).toBe(true)
    })
  })
})
