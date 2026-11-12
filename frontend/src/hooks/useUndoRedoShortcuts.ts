import { useEffect } from 'react'
import { type DocumentState } from '@/types/document'

export function useUndoRedoShortcuts(
  activeDoc: DocumentState | null | undefined,
  undo: (id: string) => void,
  redo: (id: string) => void,
  customHandlers?: {
    canUndo?: boolean
    canRedo?: boolean
    onUndo?: () => void
    onRedo?: () => void
  }
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault()
          if (e.shiftKey) {
            if (customHandlers?.canRedo && customHandlers.onRedo) {
              customHandlers.onRedo()
            } else if (activeDoc?.history && activeDoc.historyIndex < activeDoc.history.length - 1) {
              redo(activeDoc.id)
            }
          } else if (customHandlers?.canUndo && customHandlers.onUndo) {
            customHandlers.onUndo()
          } else if (activeDoc && activeDoc.historyIndex > 0) {
            undo(activeDoc.id)
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault()
          if (customHandlers?.canRedo && customHandlers.onRedo) {
            customHandlers.onRedo()
          } else if (activeDoc?.history && activeDoc.historyIndex < activeDoc.history.length - 1) {
            redo(activeDoc.id)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeDoc, undo, redo, customHandlers])
}
