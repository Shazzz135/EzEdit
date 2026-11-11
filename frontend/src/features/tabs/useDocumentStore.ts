import { create } from 'zustand'
import {
  type DocumentState,
  type AdjustmentValues,
  type OrientationValues,
  type FilterState,
  defaultAdjustments,
  defaultOrientation,
  defaultFilterState,
  MAX_TAB_LIMIT,
} from '@/types/document'

export interface DocumentStore {
  documents: DocumentState[]
  activeDocumentId: string | null
  getActiveDocument: () => DocumentState | undefined
  addDocument: (doc: Omit<DocumentState, 'id' | 'createdAt' | 'updatedAt' | 'adjustments' | 'orientation' | 'filter' | 'isModified' | 'history' | 'historyIndex'>) => { success: boolean; id?: string; error?: 'MAX_TABS_EXCEEDED' }
  closeDocument: (id: string) => void
  setActiveDocument: (id: string) => void
  renameDocument: (id: string, name: string) => void
  updateAdjustments: (id: string, partial: Partial<AdjustmentValues>) => void
  resetAdjustments: (id: string) => void
  updateOrientation: (id: string, partial: Partial<OrientationValues>) => void
  updateFilter: (id: string, partial: Partial<FilterState>) => void
  resetFilter: (id: string) => void
  applyRasterTransform: (id: string, newImage: { url: string; blob: Blob; width: number; height: number }) => void
  undo: (id: string) => void
  redo: (id: string) => void
  setHydratedDocuments: (docs: DocumentState[], activeId: string | null) => void
  clearAllDocuments: () => void
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
    const initialEntry = {
      imageSrc: docData.imageSrc,
      imageBlob: docData.imageBlob,
      width: docData.currentWidth,
      height: docData.currentHeight,
      adjustments: { ...defaultAdjustments },
      orientation: { ...defaultOrientation },
      filter: { ...defaultFilterState },
    }
    const newDoc: DocumentState = {
      ...docData,
      id: newId,
      isModified: false,
      adjustments: { ...defaultAdjustments },
      orientation: { ...defaultOrientation },
      filter: { ...defaultFilterState },
      history: [initialEntry],
      historyIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    set((state) => ({ documents: [...state.documents, newDoc], activeDocumentId: newId }))
    return { success: true, id: newId }
  },

  closeDocument: (id) => {
    const { documents, activeDocumentId } = get()
    const targetDoc = documents.find((d) => d.id === id)
    if (targetDoc && targetDoc.imageSrc.startsWith('blob:')) URL.revokeObjectURL(targetDoc.imageSrc)

    const nextDocuments = documents.filter((doc) => doc.id !== id)
    let nextActiveId = activeDocumentId

    if (activeDocumentId === id) {
      if (nextDocuments.length === 0) {
        nextActiveId = null
      } else {
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
    set((state) => ({
      documents: state.documents.map((d) => d.id === id ? { ...d, name: trimmed, updatedAt: Date.now() } : d),
    }))
  },

  updateAdjustments: (id, partial) => {
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, adjustments: { ...d.adjustments, ...partial }, isModified: true, updatedAt: Date.now() } : d
      ),
    }))
  },

  resetAdjustments: (id) => {
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, adjustments: { ...defaultAdjustments }, updatedAt: Date.now() } : d
      ),
    }))
  },

  updateOrientation: (id, partial) => {
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, orientation: { ...d.orientation, ...partial }, isModified: true, updatedAt: Date.now() } : d
      ),
    }))
  },

  updateFilter: (id, partial) => {
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, filter: { ...d.filter, ...partial }, isModified: true, updatedAt: Date.now() } : d
      ),
    }))
  },

  resetFilter: (id) => {
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, filter: { ...defaultFilterState }, updatedAt: Date.now() } : d
      ),
    }))
  },

  applyRasterTransform: (id, newImage) => {
    set((state) => ({
      documents: state.documents.map((doc) => {
        if (doc.id !== id) return doc
        const historySlice = (doc.history || []).slice(0, (doc.historyIndex ?? 0) + 1)
        const nextEntry = {
          imageSrc: newImage.url,
          imageBlob: newImage.blob,
          width: newImage.width,
          height: newImage.height,
          adjustments: { ...doc.adjustments },
          orientation: { ...doc.orientation },
          filter: { ...doc.filter },
        }
        return {
          ...doc,
          imageSrc: newImage.url,
          imageBlob: newImage.blob,
          currentWidth: newImage.width,
          currentHeight: newImage.height,
          isModified: true,
          history: [...historySlice, nextEntry],
          historyIndex: historySlice.length,
          updatedAt: Date.now(),
        }
      }),
    }))
  },

  undo: (id) => {
    set((state) => ({
      documents: state.documents.map((doc) => {
        if (doc.id !== id || !doc.history || doc.historyIndex <= 0) return doc
        const nextIndex = doc.historyIndex - 1
        const entry = doc.history[nextIndex]
        return {
          ...doc,
          imageSrc: entry.imageSrc,
          imageBlob: entry.imageBlob,
          currentWidth: entry.width,
          currentHeight: entry.height,
          historyIndex: nextIndex,
          updatedAt: Date.now(),
        }
      }),
    }))
  },

  redo: (id) => {
    set((state) => ({
      documents: state.documents.map((doc) => {
        if (doc.id !== id || !doc.history || doc.historyIndex >= doc.history.length - 1) return doc
        const nextIndex = doc.historyIndex + 1
        const entry = doc.history[nextIndex]
        return {
          ...doc,
          imageSrc: entry.imageSrc,
          imageBlob: entry.imageBlob,
          currentWidth: entry.width,
          currentHeight: entry.height,
          historyIndex: nextIndex,
          updatedAt: Date.now(),
        }
      }),
    }))
  },

  setHydratedDocuments: (docs, activeId) => {
    const formatted = docs.map((doc) => ({
      ...doc,
      filter: doc.filter || { ...defaultFilterState },
      history: doc.history?.length ? doc.history : [{
        imageSrc: doc.imageSrc,
        imageBlob: doc.imageBlob,
        width: doc.currentWidth,
        height: doc.currentHeight,
        adjustments: { ...doc.adjustments },
        orientation: { ...doc.orientation },
        filter: { ...defaultFilterState },
      }],
      historyIndex: doc.historyIndex ?? 0,
    }))
    set({ documents: formatted, activeDocumentId: activeId ?? (formatted[0]?.id || null) })
  },

  clearAllDocuments: () => {
    const { documents } = get()
    documents.forEach((doc) => {
      if (doc.imageSrc.startsWith('blob:')) URL.revokeObjectURL(doc.imageSrc)
    })
    set({ documents: [], activeDocumentId: null })
  },
}))
