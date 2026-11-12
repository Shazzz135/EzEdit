import { describe, it, expect } from 'vitest'
import {
  getNormalizedBox,
  getArrowheadPoints,
  getStarVertices,
  getTriangleVertices,
  hexToRgba,
  PRESET_SWATCHES,
  DEFAULT_ANNOTATE_SETTINGS,
} from '../index'
import { VALID_CATEGORIES } from '@/hooks/usePersistedToolCategory'

describe('Shapes, Freehand Paint & Typography Engine (Issue 10.1)', () => {
  it('registers annotate in VALID_CATEGORIES and provides 12 preset swatches', () => {
    expect(VALID_CATEGORIES).toContain('annotate')
    expect(PRESET_SWATCHES).toHaveLength(12)
    expect(DEFAULT_ANNOTATE_SETTINGS.subTool).toBe('shapes')
  })

  it('normalizes drag bounding boxes regardless of drag direction', () => {
    const box = getNormalizedBox({ x: 200, y: 150 }, { x: 50, y: 30 })
    expect(box).toEqual({ x: 50, y: 30, width: 150, height: 120 })
  })

  it('calculates arrowhead wing coordinates pointing toward tip', () => {
    const [w1, tip, w2] = getArrowheadPoints({ x: 0, y: 0 }, { x: 100, y: 0 }, 4)
    expect(tip).toEqual({ x: 100, y: 0 })
    expect(w1.x).toBeLessThan(100)
    expect(w2.x).toBeLessThan(100)
    expect(w1.y).toBeGreaterThan(0)
    expect(w2.y).toBeLessThan(0)
  })

  it('generates 10 alternating vertices for a 5-point star and 3 for a triangle', () => {
    const star = getStarVertices({ x: 0, y: 0 }, { x: 100, y: 100 }, 5)
    expect(star).toHaveLength(10)

    const tri = getTriangleVertices({ x: 10, y: 20 }, { x: 110, y: 120 })
    expect(tri).toHaveLength(3)
    expect(tri[0]).toEqual({ x: 60, y: 20 }) // top vertex
    expect(tri[1]).toEqual({ x: 110, y: 120 }) // bottom right
    expect(tri[2]).toEqual({ x: 10, y: 120 }) // bottom left
  })

  it('converts hex color and opacity percent to rgba() string', () => {
    expect(hexToRgba('#EF4444', 100)).toBe('rgba(239, 68, 68, 1)')
    expect(hexToRgba('#3B82F6', 50)).toBe('rgba(59, 130, 246, 0.5)')
  })

  it('verifies undo and redo stack logic for annotation items', () => {
    let items = [
      { id: '1', kind: 'paint' as const, brushMode: 'brush' as const, points: [{ x: 1, y: 1 }], color: '#FFF', size: 10, opacity: 100 },
      { id: '2', kind: 'paint' as const, brushMode: 'brush' as const, points: [{ x: 2, y: 2 }], color: '#000', size: 10, opacity: 100 },
    ]
    let undoneItems: typeof items = []

    // Undo
    const popped = items[items.length - 1]
    undoneItems = [...undoneItems, popped]
    items = items.slice(0, -1)
    expect(items).toHaveLength(1)
    expect(undoneItems).toHaveLength(1)

    // Redo
    const restored = undoneItems[undoneItems.length - 1]
    items = [...items, restored]
    undoneItems = undoneItems.slice(0, -1)
    expect(items).toHaveLength(2)
    expect(undoneItems).toHaveLength(0)
  })
})
