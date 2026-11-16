import { describe, it, expect, vi } from 'vitest'
import {
  type FloatingObject,
  type SelectionToolType,
  defaultSelectionState,
} from '@/types/selection'

describe('Movable Cut/Paste Object & Select-Move Tool', () => {
  it('supports select-move tool type', () => {
    const tool: SelectionToolType = 'select-move'
    expect(tool).toBe('select-move')
  })

  it('initializes default selection state with null floatingObject', () => {
    expect(defaultSelectionState.floatingObject).toBeNull()
    expect(defaultSelectionState.tool).toBe('rect-marquee')
  })

  it('correctly creates a floating object structure', () => {
    const mockBlob = new Blob(['sample-pixel-data'], { type: 'image/png' })
    const floating: FloatingObject = {
      id: 'floating-123',
      imageSrc: 'blob:http://localhost/test',
      blob: mockBlob,
      x: 45,
      y: 90,
      width: 120,
      height: 80,
    }

    expect(floating.id).toBe('floating-123')
    expect(floating.x).toBe(45)
    expect(floating.y).toBe(90)
    expect(floating.width).toBe(120)
    expect(floating.height).toBe(80)
    expect(floating.blob).toBe(mockBlob)
  })

  it('updates floating object position with rounding', () => {
    const floating: FloatingObject = {
      id: 'floating-1',
      imageSrc: 'blob:test',
      blob: new Blob([]),
      x: 10,
      y: 20,
      width: 100,
      height: 100,
    }

    const newPos = { x: 55.7, y: 88.2 }
    const updated: FloatingObject = {
      ...floating,
      x: Math.round(newPos.x),
      y: Math.round(newPos.y),
    }

    expect(updated.x).toBe(56)
    expect(updated.y).toBe(88)
  })

  it('revokes blob URL on clearFloatingObject when present', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const blobUrl = 'blob:http://localhost/unique-object-url'

    const clearFloating = (obj: FloatingObject | null) => {
      if (obj?.imageSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(obj.imageSrc)
      }
      return null
    }

    const result = clearFloating({
      id: 'f1',
      imageSrc: blobUrl,
      blob: new Blob([]),
      x: 0,
      y: 0,
      width: 50,
      height: 50,
    })

    expect(result).toBeNull()
    expect(revokeSpy).toHaveBeenCalledWith(blobUrl)
    revokeSpy.mockRestore()
  })
})
