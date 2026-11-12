import { describe, it, expect } from 'vitest'
import {
  computeBrushWeight,
  blendCloneStampBuffer,
  blendHealingBuffer,
  blendSpotHealingBuffer,
} from '../retouchMath'
import { runInpaintingMath } from '../inpaintingMath'
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

  describe('runInpaintingMath (Fast Marching Content-Aware Fill)', () => {
    it('fills hole using surrounding boundary colors', () => {
      const width = 10
      const height = 10
      const img = new Uint8ClampedArray(width * height * 4)
      const mask = new Uint8ClampedArray(width * height)

      // Green grass image: #34D399 (52, 211, 153)
      for (let i = 0; i < width * height; i++) {
        img[i * 4] = 52
        img[i * 4 + 1] = 211
        img[i * 4 + 2] = 153
        img[i * 4 + 3] = 255
      }

      // Unwanted object in center 2x2 square: (4,4) to (5,5)
      for (let y = 4; y <= 5; y++) {
        for (let x = 4; x <= 5; x++) {
          const idx = y * width + x
          img[idx * 4] = 255 // bright white intruder
          img[idx * 4 + 1] = 255
          img[idx * 4 + 2] = 255
          mask[idx] = 255 // masked
        }
      }

      let progressCalled = false
      const result = runInpaintingMath(img, mask, width, height, (p) => {
        if (p > 0) progressCalled = true
      })

      expect(progressCalled).toBe(true)
      // Central pixels should now be inpainted green like surrounding grass
      const centerIdx = (4 * width + 4) * 4
      expect(result[centerIdx]).toBeLessThan(100)
      expect(result[centerIdx + 1]).toBeGreaterThan(180)
      expect(result[centerIdx + 2]).toBeGreaterThan(120)
    })

    it('returns copy of image unchanged when mask has no holes', () => {
      const width = 4
      const height = 4
      const img = new Uint8ClampedArray(width * height * 4).fill(128)
      const mask = new Uint8ClampedArray(width * height).fill(0)

      const result = runInpaintingMath(img, mask, width, height)
      expect(result).toEqual(img)
    })

    it('dilates mask to absorb object edge fringe and synthesizes clean background on larger images', () => {
      const width = 48
      const height = 48
      const img = new Uint8ClampedArray(width * height * 4)
      const mask = new Uint8ClampedArray(width * height * 4)

      for (let i = 0; i < width * height; i++) {
        img[i * 4] = 40
        img[i * 4 + 1] = 180
        img[i * 4 + 2] = 220
        img[i * 4 + 3] = 255
      }

      // Red unwanted object from (18,18) to (30,30), but user mask only covers (19,19) to (29,29)
      for (let y = 18; y <= 30; y++) {
        for (let x = 18; x <= 30; x++) {
          const idx = (y * width + x) * 4
          img[idx] = 250
          img[idx + 1] = 10
          img[idx + 2] = 10
        }
      }
      for (let y = 19; y <= 29; y++) {
        for (let x = 19; x <= 29; x++) {
          const idx = (y * width + x) * 4
          mask[idx] = 255
          mask[idx + 3] = 255
        }
      }

      const result = runInpaintingMath(img, mask, width, height)
      const centerIdx = (24 * width + 24) * 4
      expect(result[centerIdx]).toBeLessThan(80)
      expect(result[centerIdx + 1]).toBeGreaterThan(150)
      expect(result[centerIdx + 2]).toBeGreaterThan(190)
    })
  })

  describe('executePollinationsInpainting', () => {
    it('gracefully handles offline or network timeout without crashing', async () => {
      const res = await executePollinationsInpainting('data:image/png;base64,invalid', {
        width: 100,
        height: 100,
      })
      // In node test environment without browser network fetch, returns null gracefully
      expect(res === null || res instanceof Blob).toBe(true)
    })
  })
})
