import { create } from 'zustand'
import {
  type DocumentState,
  type AdjustmentValues,
  type OrientationValues,
  defaultAdjustments,
  defaultOrientation,
  MAX_TAB_LIMIT,
} from '@/types/document'

export interface DocumentStore {
  documents: DocumentState[]
  activeDocumentId: string | null
  getActiveDocument: () => DocumentState | undefined
  addDocument: (doc: Omit<DocumentState, 'id' | 'createdAt' | 'updatedAt' | 'adjustments' | 'orientation' | 'isModified' | 'history' | 'historyIndex'>) => { success: boolean; id?: string; error?: 'MAX_TABS_EXCEEDED' }
  closeDocument: (id: string) => void
  setActiveDocument: (id: string) => void
  updateAdjustments: (id: string, partial: Partial<AdjustmentValues>) => void
  resetAdjustments: (id: string) => void
  updateOrientation: (id: string, partial: Partial<OrientationValues>) => void
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

    if (documents.length >= MAX_TAB_LIMIT) {
      return { success: false, error: 'MAX_TABS_EXCEEDED' }
    }

    const newId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const initialEntry = {
      imageSrc: docData.imageSrc,
      imageBlob: docData.imageBlob,
      width: docData.currentWidth,
      height: docData.currentHeight,
      adjustments: { ...defaultAdjustments },
      orientation: { ...defaultOrientation },
    }
    const newDoc: DocumentState = {
      ...docData,
      id: newId,
      isModified: false,
      adjustments: { ...defaultAdjustments },
      orientation: { ...defaultOrientation },
      history: [initialEntry],
      historyIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    // Append new tab to the right side of the list and activate it
    set((state) => ({
      documents: [...state.documents, newDoc],
      activeDocumentId: newId,
    }))

    return { success: true, id: newId }
  },

  closeDocument: (id) => {
    const { documents, activeDocumentId } = get()
    const targetDoc = documents.find((d) => d.id === id)

    // Revoke blob URL if created locally
    if (targetDoc && targetDoc.imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(targetDoc.imageSrc)
    }

    const nextDocuments = documents.filter((doc) => doc.id !== id)
    let nextActiveId = activeDocumentId

    // If the currently active document is being closed, activate adjacent tab
    if (activeDocumentId === id) {
      if (nextDocuments.length === 0) {
        nextActiveId = null
      } else {
        const closedIndex = documents.findIndex((doc) => doc.id === id)
        const newIndex = Math.min(closedIndex, nextDocuments.length - 1)
        nextActiveId = nextDocuments[newIndex].id
      }
    }

    set({
      documents: nextDocuments,
      activeDocumentId: nextActiveId,
    })
  },

  setActiveDocument: (id) => {
    set({ activeDocumentId: id })
  },

  updateAdjustments: (id, partial) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              adjustments: { ...doc.adjustments, ...partial },
              isModified: true,
              updatedAt: Date.now(),
            }
          : doc
      ),
    }))
  },

  resetAdjustments: (id) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              adjustments: { ...defaultAdjustments },
              updatedAt: Date.now(),
            }
          : doc
      ),
    }))
  },

  updateOrientation: (id, partial) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              orientation: { ...doc.orientation, ...partial },
              isModified: true,
              updatedAt: Date.now(),
            }
          : doc
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
      history: doc.history?.length ? doc.history : [{
        imageSrc: doc.imageSrc,
        imageBlob: doc.imageBlob,
        width: doc.currentWidth,
        height: doc.currentHeight,
        adjustments: { ...doc.adjustments },
        orientation: { ...doc.orientation },
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
