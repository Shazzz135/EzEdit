import { useEffect } from 'react'
import { type DocumentState } from '@/types/document'

export function useUndoRedoShortcuts(
  activeDoc: DocumentState | null | undefined,
  undo: (id: string) => void,
  redo: (id: string) => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault()
          if (e.shiftKey) {
            if (activeDoc?.history && activeDoc.historyIndex < activeDoc.history.length - 1) {
              redo(activeDoc.id)
            }
          } else if (activeDoc && activeDoc.historyIndex > 0) {
            undo(activeDoc.id)
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault()
          if (activeDoc?.history && activeDoc.historyIndex < activeDoc.history.length - 1) {
            redo(activeDoc.id)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeDoc, undo, redo])
}
