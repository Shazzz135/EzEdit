import { describe, it, expect, beforeEach } from 'vitest'
import {
  createRectPath,
  createEllipsePath,
  isPointInPolygon,
  getBoundingBox,
  combinePaths,
  calculatePastePosition,
} from '../selectionGeometry'
import {
  getInternalClipboardBlob,
  setInternalClipboardBlob,
  getInternalClipboardPosition,
  hasPasteableContent,
  pasteSelection,
} from '../selectionOperations'
import { type Point } from '@/types/selection'

describe('Milestone 6 - Issue 6.1: Vector Selection Geometry & Modes', () => {
  describe('createRectPath', () => {
    it('creates a 4-point closed rectangular path matching drag boundaries', () => {
      const p1: Point = { x: 10, y: 20 }
      const p2: Point = { x: 110, y: 70 }
      const rect = createRectPath(p1, p2)

      expect(rect).toHaveLength(4)
      expect(rect[0]).toEqual({ x: 10, y: 20 })
      expect(rect[1]).toEqual({ x: 110, y: 20 })
      expect(rect[2]).toEqual({ x: 110, y: 70 })
      expect(rect[3]).toEqual({ x: 10, y: 70 })
    })

    it('handles negative drag directions correctly', () => {
      const p1: Point = { x: 200, y: 150 }
      const p2: Point = { x: 50, y: 30 }
      const rect = createRectPath(p1, p2)

      expect(rect[0]).toEqual({ x: 50, y: 30 })
      expect(rect[2]).toEqual({ x: 200, y: 150 })
    })
  })

  describe('createEllipsePath', () => {
    it('generates an ellipse polygon with specified segment count', () => {
      const p1: Point = { x: 0, y: 0 }
      const p2: Point = { x: 100, y: 100 }
      const ellipse = createEllipsePath(p1, p2, 16)

      expect(ellipse).toHaveLength(16)
      for (const pt of ellipse) {
        expect(pt.x).toBeGreaterThanOrEqual(-0.01)
        expect(pt.x).toBeLessThanOrEqual(100.01)
        expect(pt.y).toBeGreaterThanOrEqual(-0.01)
        expect(pt.y).toBeLessThanOrEqual(100.01)
      }
    })
  })

  describe('isPointInPolygon', () => {
    const square: Point[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]

    it('returns true for points inside the polygon', () => {
      expect(isPointInPolygon({ x: 50, y: 50 }, square)).toBe(true)
      expect(isPointInPolygon({ x: 10, y: 90 }, square)).toBe(true)
    })

    it('returns false for points outside the polygon', () => {
      expect(isPointInPolygon({ x: 150, y: 50 }, square)).toBe(false)
      expect(isPointInPolygon({ x: -10, y: 50 }, square)).toBe(false)
      expect(isPointInPolygon({ x: 50, y: 150 }, square)).toBe(false)
    })
  })

  describe('getBoundingBox', () => {
    it('returns null for empty paths', () => {
      expect(getBoundingBox([])).toBeNull()
    })

    it('calculates bounding box spanning all loops', () => {
      const loop1: Point[] = [{ x: 10, y: 20 }, { x: 50, y: 60 }]
      const loop2: Point[] = [{ x: 100, y: 80 }, { x: 200, y: 150 }]
      const bbox = getBoundingBox([loop1, loop2])

      expect(bbox).not.toBeNull()
      expect(bbox?.minX).toBe(10)
      expect(bbox?.minY).toBe(20)
      expect(bbox?.maxX).toBe(200)
      expect(bbox?.maxY).toBe(150)
      expect(bbox?.width).toBe(190)
      expect(bbox?.height).toBe(130)
    })
  })

  describe('combinePaths Boolean Operations', () => {
    const pathA: Point[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]
    const pathB: Point[] = [
      { x: 200, y: 200 },
      { x: 300, y: 200 },
      { x: 300, y: 300 },
      { x: 200, y: 300 },
    ]

    it('replaces existing paths in new mode', () => {
      const result = combinePaths([pathA], pathB, 'new')
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(pathB)
    })

    it('appends path in add mode', () => {
      const result = combinePaths([pathA], pathB, 'add')
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(pathA)
      expect(result[1]).toEqual(pathB)
    })

    it('subtracts overlapping path in subtract mode', () => {
      // Subtraction covering pathA
      const bigCover: Point[] = [
        { x: -10, y: -10 },
        { x: 110, y: -10 },
        { x: 110, y: 110 },
        { x: -10, y: 110 },
      ]
      const result = combinePaths([pathA, pathB], bigCover, 'subtract')
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(pathB)
    })
  })

  describe('Standard Selection Keyboard Commands (Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+I, Esc/Ctrl+Shift+D)', () => {
    it('defines expected standard shortcut combinations without browser bookmark conflict', () => {
      const shortcuts = {
        copy: 'Ctrl+C',
        cut: 'Ctrl+X',
        paste: 'Ctrl+V',
        invert: 'Ctrl+I',
        deselect: 'Esc / Ctrl+Shift+D',
      }
      expect(shortcuts.copy).toBe('Ctrl+C')
      expect(shortcuts.cut).toBe('Ctrl+X')
      expect(shortcuts.paste).toBe('Ctrl+V')
      expect(shortcuts.invert).toBe('Ctrl+I')
      expect(shortcuts.deselect).toBe('Esc / Ctrl+Shift+D')
    })
  })

  describe('Issue #47: Copy-Paste for Precision Tools', () => {
    beforeEach(() => {
      setInternalClipboardBlob(null, null)
    })

    describe('calculatePastePosition', () => {
      it('centers pasted object when last position is not provided', () => {
        const pos = calculatePastePosition(800, 600, 200, 100)
        expect(pos.x).toBe(300)
        expect(pos.y).toBe(250)
      })

      it('offsets by 20px when a prior position exists', () => {
        const pos = calculatePastePosition(800, 600, 200, 100, { x: 50, y: 80 })
        expect(pos.x).toBe(70)
        expect(pos.y).toBe(100)
      })

      it('clamps position so pasted object does not overflow target canvas', () => {
        const pos = calculatePastePosition(800, 600, 200, 100, { x: 700, y: 550 }, 50)
        expect(pos.x).toBe(600)
        expect(pos.y).toBe(500)
      })
    })

    describe('Internal Clipboard State & Paste Execution', () => {
      it('correctly tracks clipboard blob, position, and pasteable state', () => {
        expect(hasPasteableContent()).toBe(false)
        expect(getInternalClipboardBlob()).toBeNull()
        expect(getInternalClipboardPosition()).toBeNull()

        const mockBlob = new Blob(['mock-png'], { type: 'image/png' })
        setInternalClipboardBlob(mockBlob, { x: 40, y: 60 })

        expect(hasPasteableContent()).toBe(true)
        expect(getInternalClipboardBlob()).toBe(mockBlob)
        expect(getInternalClipboardPosition()).toEqual({ x: 40, y: 60 })
      })

      it('returns null from pasteSelection when clipboard is empty', async () => {
        const result = await pasteSelection('data:image/png;base64,abc')
        expect(result).toBeNull()
      })
    })
  })
})
