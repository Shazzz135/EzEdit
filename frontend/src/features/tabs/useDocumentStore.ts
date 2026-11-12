import { create } from 'zustand'
import {
  type DocumentState, type AdjustmentValues, type OrientationValues, type FilterState,
  defaultAdjustments, defaultOrientation, defaultFilterState, MAX_TAB_LIMIT,
} from '@/types/document'
import { type TransferEditCategories, pushOrReplaceHistory, lastStateOp } from './documentHistoryHelper'

export type { TransferEditCategories }

export interface DocumentStore {
  documents: DocumentState[]; activeDocumentId: string | null; getActiveDocument: () => DocumentState | undefined
  addDocument: (doc: Omit<DocumentState, 'id' | 'createdAt' | 'updatedAt' | 'adjustments' | 'orientation' | 'filter' | 'isModified' | 'history' | 'historyIndex'>) => { success: boolean; id?: string; error?: 'MAX_TABS_EXCEEDED' }
  closeDocument: (id: string) => void; setActiveDocument: (id: string) => void; renameDocument: (id: string, name: string) => void
  updateAdjustments: (id: string, partial: Partial<AdjustmentValues>) => void; resetAdjustments: (id: string) => void
  updateOrientation: (id: string, partial: Partial<OrientationValues>) => void
  updateFilter: (id: string, partial: Partial<FilterState>) => void; resetFilter: (id: string) => void
  applyRasterTransform: (id: string, newImage: { url: string; blob: Blob; width: number; height: number }) => void
  resetDocumentCompletely: (id: string) => void; markDocumentExported: (id: string) => void
  transferEdits: (sourceId: string, targetIds: string[], categories: TransferEditCategories) => void
  undo: (id: string) => void; redo: (id: string) => void
  setHydratedDocuments: (docs: DocumentState[], activeId: string | null) => void; clearAllDocuments: () => void
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  activeDocumentId: null,

  getActiveDocument: () => {
    const { documents, activeDocumentId } = get()
    return documents.find((doc) => doc.id === activeDocumentId)
  },

  addDocument: (docData) => {
    const { documents } = get()
    if (documents.length >= MAX_TAB_LIMIT) return { success: false, error: 'MAX_TABS_EXCEEDED' }

    const newId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const origSrc = docData.originalImageSrc || docData.imageSrc
    const origBlob = docData.originalImageBlob || docData.imageBlob
    const initialEntry = {
      imageSrc: origSrc, imageBlob: origBlob, width: docData.originalWidth, height: docData.originalHeight,
      adjustments: { ...defaultAdjustments }, orientation: { ...defaultOrientation }, filter: { ...defaultFilterState },
    }
    const newDoc: DocumentState = {
      ...docData, id: newId, originalImageSrc: origSrc, originalImageBlob: origBlob, resetVersion: 0, isModified: false,
      adjustments: { ...defaultAdjustments }, orientation: { ...defaultOrientation }, filter: { ...defaultFilterState },
      history: [initialEntry], historyIndex: 0, createdAt: Date.now(), updatedAt: Date.now(),
    }
    set((state) => ({ documents: [...state.documents, newDoc], activeDocumentId: newId }))
    return { success: true, id: newId }
  },

  closeDocument: (id) => {
    const { documents, activeDocumentId } = get()
    const targetDoc = documents.find((d) => d.id === id)
    if (targetDoc) {
      if (targetDoc.imageSrc.startsWith('blob:')) URL.revokeObjectURL(targetDoc.imageSrc)
      if (targetDoc.originalImageSrc && targetDoc.originalImageSrc !== targetDoc.imageSrc && targetDoc.originalImageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(targetDoc.originalImageSrc)
      }
    }
    delete lastStateOp[id]
    const nextDocuments = documents.filter((doc) => doc.id !== id)
    let nextActiveId = activeDocumentId
    if (activeDocumentId === id) {
      if (nextDocuments.length === 0) nextActiveId = null
      else {
        const closedIndex = documents.findIndex((doc) => doc.id === id)
        nextActiveId = nextDocuments[Math.min(closedIndex, nextDocuments.length - 1)].id
      }
    }
    set({ documents: nextDocuments, activeDocumentId: nextActiveId })
  },

  setActiveDocument: (id) => set({ activeDocumentId: id }),

  renameDocument: (id, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    set((state) => ({ documents: state.documents.map((d) => (d.id === id ? { ...d, name: trimmed, updatedAt: Date.now() } : d)) }))
  },

  updateAdjustments: (id, partial) => set((state) => ({
    documents: state.documents.map((d) => {
      if (d.id !== id) return d
      const nextAdj = { ...d.adjustments, ...partial }
      const h = pushOrReplaceHistory(d, { adjustments: nextAdj, orientation: d.orientation, filter: d.filter }, `adj_${Object.keys(partial).sort().join(',')}`)
      return { ...d, adjustments: nextAdj, ...h, isModified: true, updatedAt: Date.now() }
    }),
  })),

  resetAdjustments: (id) => set((state) => ({
    documents: state.documents.map((d) => {
      if (d.id !== id) return d
      const nextAdj = { ...defaultAdjustments }
      const h = pushOrReplaceHistory(d, { adjustments: nextAdj, orientation: d.orientation, filter: d.filter })
      return { ...d, adjustments: nextAdj, ...h, isModified: true, updatedAt: Date.now() }
    }),
  })),

  updateOrientation: (id, partial) => set((state) => ({
    documents: state.documents.map((d) => {
      if (d.id !== id) return d
      const nextOri = { ...d.orientation, ...partial }
      const isContinuous = 'rotation' in partial && !('flipH' in partial) && !('flipV' in partial)
      const h = pushOrReplaceHistory(d, { adjustments: d.adjustments, orientation: nextOri, filter: d.filter }, isContinuous ? 'orient_rot' : undefined)
      return { ...d, orientation: nextOri, ...h, isModified: true, updatedAt: Date.now() }
    }),
  })),

  updateFilter: (id, partial) => set((state) => ({
    documents: state.documents.map((d) => {
      if (d.id !== id) return d
      const nextFlt = { ...d.filter, ...partial }
      const isSliderOnly = 'intensity' in partial && !('preset' in partial)
      const h = pushOrReplaceHistory(d, { adjustments: d.adjustments, orientation: d.orientation, filter: nextFlt }, isSliderOnly ? 'flt_int' : undefined)
      return { ...d, filter: nextFlt, ...h, isModified: true, updatedAt: Date.now() }
    }),
  })),

  resetFilter: (id) => set((state) => ({
    documents: state.documents.map((d) => {
      if (d.id !== id) return d
      const nextFlt = { ...defaultFilterState }
      const h = pushOrReplaceHistory(d, { adjustments: d.adjustments, orientation: d.orientation, filter: nextFlt })
      return { ...d, filter: nextFlt, ...h, isModified: true, updatedAt: Date.now() }
    }),
  })),

  applyRasterTransform: (id, newImage) => set((state) => ({
    documents: state.documents.map((doc) => {
      if (doc.id !== id) return doc
      delete lastStateOp[id]
      const historySlice = (doc.history || []).slice(0, (doc.historyIndex ?? 0) + 1)
      const nextEntry = {
        imageSrc: newImage.url, imageBlob: newImage.blob, width: newImage.width, height: newImage.height,
        adjustments: { ...doc.adjustments }, orientation: { ...doc.orientation }, filter: { ...doc.filter },
      }
      return {
        ...doc, imageSrc: newImage.url, imageBlob: newImage.blob, currentWidth: newImage.width, currentHeight: newImage.height,
        isModified: true, history: [...historySlice, nextEntry], historyIndex: historySlice.length, updatedAt: Date.now(),
      }
    }),
  })),

  resetDocumentCompletely: (id) => set((state) => ({
    documents: state.documents.map((doc) => {
      if (doc.id !== id) return doc
      delete lastStateOp[id]
      const baseEntry = doc.history?.[0]
      const origBlob = doc.originalImageBlob ?? baseEntry?.imageBlob ?? doc.imageBlob
      const origSrc = doc.originalImageSrc ?? baseEntry?.imageSrc ?? doc.imageSrc
      const origW = doc.originalWidth || baseEntry?.width || doc.currentWidth
      const origH = doc.originalHeight || baseEntry?.height || doc.currentHeight
      const resetEntry = {
        imageSrc: origSrc, imageBlob: origBlob, width: origW, height: origH,
        adjustments: { ...defaultAdjustments }, orientation: { ...defaultOrientation }, filter: { ...defaultFilterState },
      }
      return {
        ...doc, originalImageSrc: origSrc, originalImageBlob: origBlob, imageSrc: origSrc, imageBlob: origBlob,
        currentWidth: origW, currentHeight: origH, adjustments: { ...defaultAdjustments }, orientation: { ...defaultOrientation },
        filter: { ...defaultFilterState }, isModified: false, resetVersion: (doc.resetVersion ?? 0) + 1,
        history: [resetEntry], historyIndex: 0, updatedAt: Date.now(),
      }
    }),
  })),

  transferEdits: (sourceId, targetIds, categories) => {
    const sourceDoc = get().documents.find((d) => d.id === sourceId)
    if (!sourceDoc || targetIds.length === 0) return
    const targetSet = new Set(targetIds)
    set((state) => ({
      documents: state.documents.map((doc) => {
        if (!targetSet.has(doc.id)) return doc
        delete lastStateOp[doc.id]
        const nextAdjustments = categories.adjustments ? { ...sourceDoc.adjustments } : { ...doc.adjustments }
        const nextFilter = categories.filter ? { ...sourceDoc.filter } : { ...doc.filter }
        const h = pushOrReplaceHistory(doc, { adjustments: nextAdjustments, orientation: doc.orientation, filter: nextFilter })
        return { ...doc, adjustments: nextAdjustments, filter: nextFilter, ...h, isModified: true, resetVersion: (doc.resetVersion ?? 0) + 1, updatedAt: Date.now() }
      }),
    }))
  },

  markDocumentExported: (id) => set((state) => ({
    documents: state.documents.map((d) => d.id === id ? { ...d, isModified: false, updatedAt: Date.now() } : d),
  })),

  undo: (id) => set((state) => ({
    documents: state.documents.map((doc) => {
      if (doc.id !== id || !doc.history || doc.historyIndex <= 0) return doc
      delete lastStateOp[id]
      const nextIndex = doc.historyIndex - 1
      const entry = doc.history[nextIndex]
      return {
        ...doc, imageSrc: entry.imageSrc, imageBlob: entry.imageBlob, currentWidth: entry.width, currentHeight: entry.height,
        adjustments: { ...entry.adjustments }, orientation: { ...entry.orientation }, filter: { ...entry.filter },
        resetVersion: (doc.resetVersion ?? 0) + 1, historyIndex: nextIndex, updatedAt: Date.now(),
      }
    }),
  })),

  redo: (id) => set((state) => ({
    documents: state.documents.map((doc) => {
      if (doc.id !== id || !doc.history || doc.historyIndex >= doc.history.length - 1) return doc
      delete lastStateOp[id]
      const nextIndex = doc.historyIndex + 1
      const entry = doc.history[nextIndex]
      return {
        ...doc, imageSrc: entry.imageSrc, imageBlob: entry.imageBlob, currentWidth: entry.width, currentHeight: entry.height,
        adjustments: { ...entry.adjustments }, orientation: { ...entry.orientation }, filter: { ...entry.filter },
        resetVersion: (doc.resetVersion ?? 0) + 1, historyIndex: nextIndex, updatedAt: Date.now(),
      }
    }),
  })),

  setHydratedDocuments: (docs, activeId) => {
    const formatted = docs.map((doc) => {
      const origSrc = doc.originalImageSrc || doc.history?.[0]?.imageSrc || doc.imageSrc
      const origBlob = doc.originalImageBlob || doc.history?.[0]?.imageBlob || doc.imageBlob
      return {
        ...doc, originalImageSrc: origSrc, originalImageBlob: origBlob,
        adjustments: { ...defaultAdjustments, ...doc.adjustments }, orientation: { ...defaultOrientation, ...doc.orientation },
        filter: doc.filter ? { ...doc.filter } : { ...defaultFilterState }, resetVersion: doc.resetVersion ?? 0,
        history: doc.history?.length ? doc.history : [{
          imageSrc: origSrc, imageBlob: origBlob, width: doc.originalWidth || doc.currentWidth, height: doc.originalHeight || doc.currentHeight,
          adjustments: { ...defaultAdjustments }, orientation: { ...defaultOrientation }, filter: { ...defaultFilterState },
        }],
        historyIndex: doc.historyIndex ?? 0,
      }
    })
    set({ documents: formatted, activeDocumentId: activeId ?? (formatted[0]?.id || null) })
  },

  clearAllDocuments: () => {
    const { documents } = get()
    documents.forEach((doc) => {
      delete lastStateOp[doc.id]
      if (doc.imageSrc.startsWith('blob:')) URL.revokeObjectURL(doc.imageSrc)
      if (doc.originalImageSrc && doc.originalImageSrc !== doc.imageSrc && doc.originalImageSrc.startsWith('blob:')) URL.revokeObjectURL(doc.originalImageSrc)
    })
    set({ documents: [], activeDocumentId: null })
  },
}))
