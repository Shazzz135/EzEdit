import { describe, it, expect } from 'vitest'
import {
  clampDimension,
  calculateRotatedDimensions,
  calculateAspectResize,
  calculateStretchDimensions,
} from '../transformMath'

describe('transformMath', () => {
  describe('clampDimension', () => {
    it('clamps values below minimum to minimum', () => {
      expect(clampDimension(0)).toBe(1)
      expect(clampDimension(-50)).toBe(1)
    })

    it('clamps values above maximum to maximum', () => {
      expect(clampDimension(10000, 1, 8192)).toBe(8192)
    })

    it('handles NaN and non-finite values gracefully', () => {
      expect(clampDimension(NaN)).toBe(1)
      expect(clampDimension(Infinity)).toBe(1)
    })

    it('rounds floating point inputs to integers', () => {
      expect(clampDimension(123.6)).toBe(124)
    })
  })

  describe('calculateRotatedDimensions', () => {
    it('swaps width and height for 90 degrees', () => {
      const result = calculateRotatedDimensions(1920, 1080, 90)
      expect(result).toEqual({ width: 1080, height: 1920 })
    })

    it('swaps width and height for 270 degrees', () => {
      const result = calculateRotatedDimensions(1920, 1080, 270)
      expect(result).toEqual({ width: 1080, height: 1920 })
    })

    it('preserves dimensions for 180 degrees', () => {
      const result = calculateRotatedDimensions(1920, 1080, 180)
      expect(result).toEqual({ width: 1920, height: 1080 })
    })
  })

  describe('calculateAspectResize', () => {
    it('calculates proportional height when width changes', () => {
      // 1920x1080 is 16:9 -> if width becomes 960, height should be 540
      const result = calculateAspectResize(1920, 1080, 'width', 960)
      expect(result).toEqual({ width: 960, height: 540 })
    })

    it('calculates proportional width when height changes', () => {
      // 1920x1080 is 16:9 -> if height becomes 540, width should be 960
      const result = calculateAspectResize(1920, 1080, 'height', 540)
      expect(result).toEqual({ width: 960, height: 540 })
    })

    it('handles 1:1 square aspect ratio correctly', () => {
      const result = calculateAspectResize(500, 500, 'width', 800)
      expect(result).toEqual({ width: 800, height: 800 })
    })

    it('handles edge case inputs gracefully', () => {
      const result = calculateAspectResize(0, 0, 'width', 100)
      expect(result.width).toBe(100)
      expect(result.height).toBe(100)
    })
  })

  describe('calculateStretchDimensions', () => {
    it('scales dimensions according to percentages', () => {
      const result = calculateStretchDimensions(1000, 800, 150, 50)
      expect(result).toEqual({ width: 1500, height: 400 })
    })

    it('handles 100% scale without alteration', () => {
      const result = calculateStretchDimensions(1920, 1080, 100, 100)
      expect(result).toEqual({ width: 1920, height: 1080 })
    })

    it('prevents zero or negative dimensions', () => {
      const result = calculateStretchDimensions(100, 100, 0, -20)
      expect(result.width).toBeGreaterThanOrEqual(1)
      expect(result.height).toBeGreaterThanOrEqual(1)
    })
  })
})
