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
  addDocument: (doc: Omit<DocumentState, 'id' | 'createdAt' | 'updatedAt' | 'adjustments' | 'orientation' | 'isModified'>) => { success: boolean; id?: string; error?: 'MAX_TABS_EXCEEDED' }
  closeDocument: (id: string) => void
  setActiveDocument: (id: string) => void
  updateAdjustments: (id: string, partial: Partial<AdjustmentValues>) => void
  resetAdjustments: (id: string) => void
  updateOrientation: (id: string, partial: Partial<OrientationValues>) => void
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
    const newDoc: DocumentState = {
      ...docData,
      id: newId,
      isModified: false,
      adjustments: { ...defaultAdjustments },
      orientation: { ...defaultOrientation },
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

  setHydratedDocuments: (docs, activeId) => {
    set({
      documents: docs,
      activeDocumentId: activeId ?? (docs[0]?.id || null),
    })
  },

  clearAllDocuments: () => {
    const { documents } = get()
    documents.forEach((doc) => {
      if (doc.imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(doc.imageSrc)
      }
    })
    set({ documents: [], activeDocumentId: null })
  },
}))
