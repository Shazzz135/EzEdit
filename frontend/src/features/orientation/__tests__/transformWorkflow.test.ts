import { describe, it, expect, beforeEach } from 'vitest'
import { useDocumentStore } from '@/features/tabs/useDocumentStore'
import { calculateRotatedDimensions, calculateStretchDimensions } from '../transformMath'

describe('Transform History & Undo/Redo Workflow', () => {
  beforeEach(() => {
    useDocumentStore.getState().clearAllDocuments()
  })

  it('records sequential rotation, flip, and stretch transforms with full undo/redo', () => {
    const store = useDocumentStore.getState()
    const doc = store.addDocument({
      name: 'landscape.jpg',
      originalWidth: 1920,
      originalHeight: 1080,
      currentWidth: 1920,
      currentHeight: 1080,
      imageSrc: 'blob:orig',
    })
    const id = doc.id!

    // Step 1: 90 deg rotation (CW) swaps dimensions
    const rotatedDims = calculateRotatedDimensions(1920, 1080, 90)
    store.applyRasterTransform(id, {
      url: 'blob:rot90',
      blob: new Blob(['rot90']),
      width: rotatedDims.width,
      height: rotatedDims.height,
    })

    let current = store.getActiveDocument()
    expect(current?.currentWidth).toBe(1080)
    expect(current?.currentHeight).toBe(1920)
    expect(current?.historyIndex).toBe(1)
    expect(current?.isModified).toBe(true)

    // Step 2: Horizontal flip
    store.applyRasterTransform(id, {
      url: 'blob:flipH',
      blob: new Blob(['flipH']),
      width: 1080,
      height: 1920,
    })

    current = store.getActiveDocument()
    expect(current?.imageSrc).toBe('blob:flipH')
    expect(current?.historyIndex).toBe(2)

    // Step 3: Bilinear stretch
    const stretchDims = calculateStretchDimensions(1080, 1920, 150, 50)
    store.applyRasterTransform(id, {
      url: 'blob:stretch',
      blob: new Blob(['stretch']),
      width: stretchDims.width,
      height: stretchDims.height,
    })

    current = store.getActiveDocument()
    expect(current?.currentWidth).toBe(1620)
    expect(current?.currentHeight).toBe(960)
    expect(current?.historyIndex).toBe(3)

    // Step 4: Undo to step 2 (Flip)
    store.undo(id)
    current = store.getActiveDocument()
    expect(current?.currentWidth).toBe(1080)
    expect(current?.currentHeight).toBe(1920)
    expect(current?.imageSrc).toBe('blob:flipH')
    expect(current?.historyIndex).toBe(2)

    // Step 5: Undo to step 1 (Rotated)
    store.undo(id)
    current = store.getActiveDocument()
    expect(current?.imageSrc).toBe('blob:rot90')
    expect(current?.historyIndex).toBe(1)

    // Step 6: Undo to original
    store.undo(id)
    current = store.getActiveDocument()
    expect(current?.currentWidth).toBe(1920)
    expect(current?.currentHeight).toBe(1080)
    expect(current?.imageSrc).toBe('blob:orig')
    expect(current?.historyIndex).toBe(0)

    // Step 7: Redo back to Rotated
    store.redo(id)
    current = store.getActiveDocument()
    expect(current?.currentWidth).toBe(1080)
    expect(current?.currentHeight).toBe(1920)
    expect(current?.historyIndex).toBe(1)

    // Step 8: Branching history - apply new transform after undo
    store.applyRasterTransform(id, {
      url: 'blob:branched',
      blob: new Blob(['branched']),
      width: 500,
      height: 500,
    })

    current = store.getActiveDocument()
    expect(current?.imageSrc).toBe('blob:branched')
    expect(current?.historyIndex).toBe(2)
    expect(current?.history).toHaveLength(3) // [orig, rot90, branched]
  })
})
