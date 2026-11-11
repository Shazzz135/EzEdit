import { describe, it, expect } from 'vitest'
import {
  clamp,
  getAspectRatioValue,
  calculateInitialCrop,
  calculateResizeCrop,
  MIN_CROP_SIZE,
} from '../cropMath'

describe('cropMath utilities and constraint engine', () => {
  it('clamps values correctly within bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-5, 0, 10)).toBe(0)
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('computes aspect ratio values accurately for all presets', () => {
    expect(getAspectRatioValue('free', 1920, 1080)).toBeNull()
    expect(getAspectRatioValue('1:1', 1920, 1080)).toBe(1.0)
    expect(getAspectRatioValue('16:9', 1920, 1080)).toBeCloseTo(16 / 9)
    expect(getAspectRatioValue('4:3', 1920, 1080)).toBeCloseTo(4 / 3)
    expect(getAspectRatioValue('9:16', 1920, 1080)).toBeCloseTo(9 / 16)
    expect(getAspectRatioValue('3:2', 1920, 1080)).toBeCloseTo(3 / 2)
    expect(getAspectRatioValue('2:3', 1920, 1080)).toBeCloseTo(2 / 3)
    expect(getAspectRatioValue('original', 1920, 1080)).toBeCloseTo(1920 / 1080)
  })

  it('calculates centered initial crop for free ratio', () => {
    const crop = calculateInitialCrop(1000, 800, 'free')
    expect(crop.width).toBe(900)
    expect(crop.height).toBe(720)
    expect(crop.x).toBe(50)
    expect(crop.y).toBe(40)
  })

  it('calculates centered initial crop for 1:1 aspect ratio', () => {
    const crop = calculateInitialCrop(1000, 800, '1:1')
    expect(crop.width).toBe(720)
    expect(crop.height).toBe(720)
    expect(crop.x).toBe(140)
    expect(crop.y).toBe(40)
  })

  it('calculates centered initial crop for 16:9 aspect ratio', () => {
    const crop = calculateInitialCrop(1920, 1080, '16:9')
    expect(crop.width / crop.height).toBeCloseTo(16 / 9, 2)
    expect(crop.x).toBeGreaterThan(0)
    expect(crop.y).toBeGreaterThan(0)
  })

  it('handles move handle and clamps to image boundaries', () => {
    const start = { x: 50, y: 50, width: 200, height: 200 }
    const moved = calculateResizeCrop(start, 'move', 10, 20, 500, 500, null)
    expect(moved.x).toBe(60)
    expect(moved.y).toBe(70)
    expect(moved.width).toBe(200)
    expect(moved.height).toBe(200)

    // Clamp against negative boundary
    const clampLeft = calculateResizeCrop(start, 'move', -100, -100, 500, 500, null)
    expect(clampLeft.x).toBe(0)
    expect(clampLeft.y).toBe(0)

    // Clamp against maximum boundary
    const clampRight = calculateResizeCrop(start, 'move', 400, 400, 500, 500, null)
    expect(clampRight.x).toBe(300)
    expect(clampRight.y).toBe(300)
  })

  it('resizes edge handles (n, s, e, w) accurately', () => {
    const start = { x: 50, y: 50, width: 200, height: 200 }

    // East handle (width increase)
    const eResized = calculateResizeCrop(start, 'e', 30, 0, 500, 500, null)
    expect(eResized.width).toBe(230)
    expect(eResized.height).toBe(200)

    // South handle (height increase)
    const sResized = calculateResizeCrop(start, 's', 0, 40, 500, 500, null)
    expect(sResized.width).toBe(200)
    expect(sResized.height).toBe(240)

    // West handle (x moves, width changes)
    const wResized = calculateResizeCrop(start, 'w', -20, 0, 500, 500, null)
    expect(wResized.x).toBe(30)
    expect(wResized.width).toBe(220)

    // North handle (y moves, height changes)
    const nResized = calculateResizeCrop(start, 'n', 0, -25, 500, 500, null)
    expect(nResized.y).toBe(25)
    expect(nResized.height).toBe(225)
  })

  it('resizes corner handles (nw, ne, sw, se) and respects minimum dimensions', () => {
    const start = { x: 50, y: 50, width: 200, height: 200 }

    // SE handle
    const se = calculateResizeCrop(start, 'se', 50, 50, 500, 500, null)
    expect(se.width).toBe(250)
    expect(se.height).toBe(250)

    // Minimum size clamping
    const minClamped = calculateResizeCrop(start, 'se', -250, -250, 500, 500, null)
    expect(minClamped.width).toBe(MIN_CROP_SIZE)
    expect(minClamped.height).toBe(MIN_CROP_SIZE)

    // NW handle
    const nw = calculateResizeCrop(start, 'nw', 20, 20, 500, 500, null)
    expect(nw.x).toBe(70)
    expect(nw.y).toBe(70)
    expect(nw.width).toBe(180)
    expect(nw.height).toBe(180)
  })

  it('enforces 1:1, 16:9, and 9:16 aspect ratios during resizing', () => {
    const start = { x: 0, y: 0, width: 100, height: 100 }

    // 1:1 ratio
    const square = calculateResizeCrop(start, 'se', 60, 20, 500, 500, 1.0)
    expect(square.width).toBe(square.height)

    // 16:9 ratio
    const wide = calculateResizeCrop(start, 'se', 60, 20, 500, 500, 16 / 9)
    expect(wide.width / wide.height).toBeCloseTo(16 / 9, 1)

    // 9:16 ratio
    const story = calculateResizeCrop(start, 'se', 30, 80, 500, 500, 9 / 16)
    expect(story.width / story.height).toBeCloseTo(9 / 16, 1)
  })
})
