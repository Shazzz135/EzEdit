import { describe, it, expect, beforeEach } from 'vitest'
import { useDocumentStore } from '../useDocumentStore'
import { MAX_TAB_LIMIT, defaultAdjustments, defaultOrientation } from '@/types/document'

describe('useDocumentStore Multi-Document Tab Manager', () => {
  beforeEach(() => {
    useDocumentStore.getState().clearAllDocuments()
  })

  it('starts with an empty document list and null active document', () => {
    const { documents, activeDocumentId } = useDocumentStore.getState()
    expect(documents).toHaveLength(0)
    expect(activeDocumentId).toBeNull()
  })

  it('adds a document to the right and makes it active', () => {
    const store = useDocumentStore.getState()
    const res1 = store.addDocument({
      name: 'photo1.jpg',
      originalWidth: 1920,
      originalHeight: 1080,
      currentWidth: 1920,
      currentHeight: 1080,
      imageSrc: 'blob:test1',
    })

    expect(res1.success).toBe(true)
    expect(useDocumentStore.getState().documents).toHaveLength(1)
    expect(useDocumentStore.getState().activeDocumentId).toBe(res1.id)

    const res2 = store.addDocument({
      name: 'photo2.jpg',
      originalWidth: 800,
      originalHeight: 600,
      currentWidth: 800,
      currentHeight: 600,
      imageSrc: 'blob:test2',
    })

    expect(res2.success).toBe(true)
    const docs = useDocumentStore.getState().documents
    expect(docs).toHaveLength(2)
    // Verify appending to the right
    expect(docs[0].name).toBe('photo1.jpg')
    expect(docs[1].name).toBe('photo2.jpg')
    expect(useDocumentStore.getState().activeDocumentId).toBe(res2.id)
  })

  it('strictly enforces the 6-tab maximum limit', () => {
    const store = useDocumentStore.getState()
    for (let i = 1; i <= MAX_TAB_LIMIT; i++) {
      const res = store.addDocument({
        name: `img_${i}.png`,
        originalWidth: 100,
        originalHeight: 100,
        currentWidth: 100,
        currentHeight: 100,
        imageSrc: `blob:img_${i}`,
      })
      expect(res.success).toBe(true)
    }

    expect(useDocumentStore.getState().documents).toHaveLength(MAX_TAB_LIMIT)

    // Attempting to add a 7th tab
    const overflowRes = store.addDocument({
      name: 'overflow.png',
      originalWidth: 100,
      originalHeight: 100,
      currentWidth: 100,
      currentHeight: 100,
      imageSrc: 'blob:overflow',
    })

    expect(overflowRes.success).toBe(false)
    expect(overflowRes.error).toBe('MAX_TABS_EXCEEDED')
    expect(useDocumentStore.getState().documents).toHaveLength(MAX_TAB_LIMIT)
  })

  it('switches active document without mutating other document states', () => {
    const store = useDocumentStore.getState()
    const doc1 = store.addDocument({
      name: 'doc1.png',
      originalWidth: 100,
      originalHeight: 100,
      currentWidth: 100,
      currentHeight: 100,
      imageSrc: 'blob:doc1',
    })
    const doc2 = store.addDocument({
      name: 'doc2.png',
      originalWidth: 200,
      originalHeight: 200,
      currentWidth: 200,
      currentHeight: 200,
      imageSrc: 'blob:doc2',
    })

    // Modify doc2
    store.updateAdjustments(doc2.id!, { exposure: 1.5 })

    // Switch back to doc1
    store.setActiveDocument(doc1.id!)
    expect(useDocumentStore.getState().activeDocumentId).toBe(doc1.id)

    const currentDoc1 = useDocumentStore.getState().getActiveDocument()
    expect(currentDoc1?.adjustments.exposure).toBe(0.0)

    // Switch to doc2 and verify its state is preserved
    store.setActiveDocument(doc2.id!)
    const currentDoc2 = useDocumentStore.getState().getActiveDocument()
    expect(currentDoc2?.adjustments.exposure).toBe(1.5)
    expect(currentDoc2?.isModified).toBe(true)
  })

  it('activates adjacent tab when active tab is closed', () => {
    const store = useDocumentStore.getState()
    const d1 = store.addDocument({
      name: 'd1.png',
      originalWidth: 100,
      originalHeight: 100,
      currentWidth: 100,
      currentHeight: 100,
      imageSrc: 'blob:d1',
    })
    const d2 = store.addDocument({
      name: 'd2.png',
      originalWidth: 100,
      originalHeight: 100,
      currentWidth: 100,
      currentHeight: 100,
      imageSrc: 'blob:d2',
    })

    expect(useDocumentStore.getState().activeDocumentId).toBe(d2.id)

    // Close d2 -> d1 becomes active
    store.closeDocument(d2.id!)
    expect(useDocumentStore.getState().documents).toHaveLength(1)
    expect(useDocumentStore.getState().activeDocumentId).toBe(d1.id)

    // Close d1 -> active becomes null
    store.closeDocument(d1.id!)
    expect(useDocumentStore.getState().documents).toHaveLength(0)
    expect(useDocumentStore.getState().activeDocumentId).toBeNull()
  })

  it('hydrates documents and preserves active document from storage', () => {
    const store = useDocumentStore.getState()
    const mockDocs = [
      {
        id: 'restored_1',
        name: 'restored1.png',
        originalWidth: 500,
        originalHeight: 500,
        currentWidth: 500,
        currentHeight: 500,
        imageSrc: 'blob:restored1',
        isModified: false,
        adjustments: { ...defaultAdjustments, exposure: 0.5 },
        orientation: { ...defaultOrientation },
        history: [],
        historyIndex: 0,
        createdAt: 100,
        updatedAt: 200,
      },
      {
        id: 'restored_2',
        name: 'restored2.png',
        originalWidth: 600,
        originalHeight: 600,
        currentWidth: 600,
        currentHeight: 600,
        imageSrc: 'blob:restored2',
        isModified: true,
        adjustments: { ...defaultAdjustments, exposure: -1.0 },
        orientation: { ...defaultOrientation },
        history: [],
        historyIndex: 0,
        createdAt: 300,
        updatedAt: 400,
      },
    ]

    store.setHydratedDocuments(mockDocs, 'restored_2')
    expect(useDocumentStore.getState().documents).toHaveLength(2)
    expect(useDocumentStore.getState().activeDocumentId).toBe('restored_2')
    expect(useDocumentStore.getState().getActiveDocument()?.name).toBe('restored2.png')
  })

  it('records raster transforms (such as crop) and supports undo and redo', () => {
    const store = useDocumentStore.getState()
    const doc = store.addDocument({
      name: 'uncropped.png',
      originalWidth: 1920,
      originalHeight: 1080,
      currentWidth: 1920,
      currentHeight: 1080,
      imageSrc: 'blob:uncropped',
    })
    const docId = doc.id!

    // Apply crop raster transform
    const mockBlob = new Blob(['cropped-data'])
    store.applyRasterTransform(docId, {
      url: 'blob:cropped-url',
      blob: mockBlob,
      width: 800,
      height: 600,
    })

    const croppedDoc = store.getActiveDocument()
    expect(croppedDoc?.currentWidth).toBe(800)
    expect(croppedDoc?.currentHeight).toBe(600)
    expect(croppedDoc?.imageSrc).toBe('blob:cropped-url')
    expect(croppedDoc?.isModified).toBe(true)
    expect(croppedDoc?.historyIndex).toBe(1)

    // Undo crop
    store.undo(docId)
    const undoneDoc = store.getActiveDocument()
    expect(undoneDoc?.currentWidth).toBe(1920)
    expect(undoneDoc?.currentHeight).toBe(1080)
    expect(undoneDoc?.imageSrc).toBe('blob:uncropped')
    expect(undoneDoc?.historyIndex).toBe(0)

    // Redo crop
    store.redo(docId)
    const redoneDoc = store.getActiveDocument()
    expect(redoneDoc?.currentWidth).toBe(800)
    expect(redoneDoc?.currentHeight).toBe(600)
    expect(redoneDoc?.imageSrc).toBe('blob:cropped-url')
    expect(redoneDoc?.historyIndex).toBe(1)
  })
})
