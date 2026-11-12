import { describe, it, expect } from 'vitest'
import {
  colorDistance,
  sampleEdgeColor,
  removeBackgroundFloodFill,
  removeBackgroundFromSelection,
} from '../backgroundRemoval'
import { type Point } from '@/types/selection'

describe('Milestone 6 - Issue 6.2: Background Removal & Transparency Engine', () => {
  describe('Color Math & Sampling', () => {
    it('calculates perceptual Redmean color distance accurately', () => {
      expect(colorDistance(0, 0, 0, 0, 0, 0)).toBe(0)
      const distRed = colorDistance(255, 0, 0, 0, 0, 0)
      expect(Math.round(distRed)).toBeGreaterThan(300)
      const maxDist = colorDistance(0, 0, 0, 255, 255, 255)
      expect(Math.round(maxDist)).toBe(765)
    })

    it('samples corner colors to determine background profile', () => {
      const width = 2
      const height = 2
      const data = new Uint8ClampedArray([
        255, 255, 255, 255,   255, 255, 255, 255,
        255, 255, 255, 255,   255, 255, 255, 255,
      ])
      const sampled = sampleEdgeColor(data, width, height)
      expect(sampled).toEqual({ r: 255, g: 255, b: 255 })
    })
  })

  describe('Flood-Fill Alpha Mask Cutout & Fill Cut', () => {
    it('sets matching background pixels to transparent (alpha = 0)', () => {
      const width = 4
      const height = 4
      const data = new Uint8ClampedArray(width * height * 4)
      data.fill(255) // white border

      // Center 2x2 to black (subject)
      const setCenter = (x: number, y: number) => {
        const idx = (y * width + x) * 4
        data[idx] = 0
        data[idx + 1] = 0
        data[idx + 2] = 0
        data[idx + 3] = 255
      }
      setCenter(1, 1)
      setCenter(2, 1)
      setCenter(1, 2)
      setCenter(2, 2)

      const imgData: ImageData = { width, height, data, colorSpace: 'srgb' }
      const result = removeBackgroundFloodFill(imgData, { tolerance: 20, contiguous: true, feather: 0 })

      // Outer boundary should be transparent (alpha = 0)
      expect(result.data[0 * 4 + 3]).toBe(0) // top-left
      expect(result.data[(width - 1) * 4 + 3]).toBe(0) // top-right

      // Center subject should remain fully opaque (alpha = 255)
      const centerIdx = (1 * width + 1) * 4
      expect(result.data[centerIdx + 3]).toBe(255)
      expect(result.data[centerIdx]).toBe(0) // black
    })

    it('inverts mask when invert option is true', () => {
      const width = 4
      const height = 4
      const data = new Uint8ClampedArray(width * height * 4)
      data.fill(255) // white border

      // Center 2x2 to black (subject)
      for (let y = 1; y <= 2; y++) {
        for (let x = 1; x <= 2; x++) {
          const idx = (y * width + x) * 4
          data[idx] = 0
          data[idx + 1] = 0
          data[idx + 2] = 0
          data[idx + 3] = 255
        }
      }

      const imgData: ImageData = { width, height, data, colorSpace: 'srgb' }
      const result = removeBackgroundFloodFill(imgData, { tolerance: 20, invert: true, feather: 0 })

      // Inverted: white border should remain opaque, black center should be transparent
      expect(result.data[0 * 4 + 3]).toBe(255) // top-left
      const centerIdx = (1 * width + 1) * 4
      expect(result.data[centerIdx + 3]).toBe(0) // center erased
    })
  })

  describe('Selection-Based Cutout', () => {
    it('erases pixels outside vector selection boundary', () => {
      const width = 10
      const height = 10
      const data = new Uint8ClampedArray(width * height * 4)
      data.fill(255)

      const selectionRect: Point[] = [
        { x: 2, y: 2 },
        { x: 8, y: 2 },
        { x: 8, y: 8 },
        { x: 2, y: 8 },
      ]

      const imgData: ImageData = { width, height, data, colorSpace: 'srgb' }
      const result = removeBackgroundFromSelection(imgData, [selectionRect], false)

      expect(result.data[0]).toBe(255)
      expect(result.data[3]).toBe(0)
      const insideIdx = (5 * width + 5) * 4
      expect(result.data[insideIdx + 3]).toBe(255)
    })

    it('erases pixels inside vector selection boundary when invert is true', () => {
      const width = 10
      const height = 10
      const data = new Uint8ClampedArray(width * height * 4)
      data.fill(255)

      const selectionRect: Point[] = [
        { x: 2, y: 2 },
        { x: 8, y: 2 },
        { x: 8, y: 8 },
        { x: 2, y: 8 },
      ]

      const imgData: ImageData = { width, height, data, colorSpace: 'srgb' }
      const result = removeBackgroundFromSelection(imgData, [selectionRect], true)

      const insideIdx = (5 * width + 5) * 4
      expect(result.data[insideIdx + 3]).toBe(0)
      expect(result.data[3]).toBe(255)
    })
  })
})
