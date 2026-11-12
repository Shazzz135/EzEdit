import { describe, it, expect, beforeEach } from 'vitest'
import { useDocumentStore } from '../useDocumentStore'

describe('Mass Reset & Transfer Edits Across Tabs', () => {
  beforeEach(() => {
    useDocumentStore.getState().clearAllDocuments()
  })

  it('resets a document completely across all tools, orientation, and raster history to unedited photo', () => {
    const store = useDocumentStore.getState()
    const doc = store.addDocument({
      name: 'photo.png',
      originalWidth: 1600,
      originalHeight: 1200,
      currentWidth: 1600,
      currentHeight: 1200,
      imageSrc: 'blob:original',
    })
    const id = doc.id!

    store.updateAdjustments(id, { exposure: 2.5, contrast: 40, saturation: -30 })
    store.updateFilter(id, { preset: 'noir', intensity: 85 })
    store.updateOrientation(id, { rotation: 90, flipH: true, scaleX: 1.5, scaleY: 0.8 })
    store.applyRasterTransform(id, {
      url: 'blob:cropped',
      blob: new Blob(['cropped']),
      width: 800,
      height: 600,
    })

    expect(useDocumentStore.getState().getActiveDocument()?.currentWidth).toBe(800)
    expect(useDocumentStore.getState().getActiveDocument()?.adjustments.exposure).toBe(2.5)
    expect(useDocumentStore.getState().getActiveDocument()?.filter.preset).toBe('noir')
    expect(useDocumentStore.getState().getActiveDocument()?.orientation.rotation).toBe(90)

    store.resetDocumentCompletely(id)

    const resetDoc = useDocumentStore.getState().getActiveDocument()!
    expect(resetDoc.imageSrc).toBe('blob:original')
    expect(resetDoc.currentWidth).toBe(1600)
    expect(resetDoc.currentHeight).toBe(1200)
    expect(resetDoc.adjustments.exposure).toBe(0)
    expect(resetDoc.adjustments.contrast).toBe(0)
    expect(resetDoc.adjustments.saturation).toBe(0)
    expect(resetDoc.orientation.rotation).toBe(0)
    expect(resetDoc.orientation.flipH).toBe(false)
    expect(resetDoc.orientation.scaleX).toBe(1.0)
    expect(resetDoc.orientation.scaleY).toBe(1.0)
    expect(resetDoc.filter.preset).toBe('none')
    expect(resetDoc.isModified).toBe(false)
    expect(resetDoc.historyIndex).toBe(0)
    expect(resetDoc.resetVersion).toBe(1)
  })

  it('transfers simple adjustments and preset filters from source photo to target photos', () => {
    const store = useDocumentStore.getState()
    const d1 = store.addDocument({
      name: 'source.png',
      originalWidth: 1920,
      originalHeight: 1080,
      currentWidth: 1920,
      currentHeight: 1080,
      imageSrc: 'blob:src',
    })
    const d2 = store.addDocument({
      name: 'target1.png',
      originalWidth: 1000,
      originalHeight: 800,
      currentWidth: 1000,
      currentHeight: 800,
      imageSrc: 'blob:t1',
    })
    const d3 = store.addDocument({
      name: 'target2.png',
      originalWidth: 1200,
      originalHeight: 900,
      currentWidth: 1200,
      currentHeight: 900,
      imageSrc: 'blob:t2',
    })

    store.updateAdjustments(d1.id!, { saturation: 55, warmth: -20 })
    store.updateFilter(d1.id!, { preset: 'dramatic', intensity: 70 })

    // Transfer only adjustments to d2 and d3 (not filter)
    store.transferEdits(d1.id!, [d2.id!, d3.id!], {
      adjustments: true,
      filter: false,
    })

    const docsAfterFirst = useDocumentStore.getState().documents
    const target1 = docsAfterFirst.find((d) => d.id === d2.id)!
    const target2 = docsAfterFirst.find((d) => d.id === d3.id)!

    expect(target1.adjustments.saturation).toBe(55)
    expect(target1.adjustments.warmth).toBe(-20)
    expect(target1.filter.preset).toBe('none')
    expect(target2.adjustments.saturation).toBe(55)
    expect(target2.filter.preset).toBe('none')

    // Now transfer filter to d2 only
    store.transferEdits(d1.id!, [d2.id!], {
      adjustments: false,
      filter: true,
    })

    const docsAfterSecond = useDocumentStore.getState().documents
    expect(docsAfterSecond.find((d) => d.id === d2.id)!.filter.preset).toBe('dramatic')
    expect(docsAfterSecond.find((d) => d.id === d2.id)!.filter.intensity).toBe(70)
    expect(docsAfterSecond.find((d) => d.id === d3.id)!.filter.preset).toBe('none')
  })
})
