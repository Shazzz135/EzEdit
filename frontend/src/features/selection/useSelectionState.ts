import { useState, useCallback, useEffect, useRef } from 'react'
import {
  type SelectionState,
  type SelectionToolType,
  type SelectionMode,
  type Point,
  type FloatingObject,
  defaultSelectionState,
} from '@/types/selection'
import { combinePaths } from './selectionGeometry'
import { hasPasteableContent } from './selectionOperations'

export interface SelectionActions {
  onCopy?: () => void
  onCut?: () => void
  onPaste?: () => void
  onCommitFloating?: () => void
  onDiscardFloating?: () => void
}

export function useSelectionState(isSelectionActive = true, actions?: SelectionActions) {
  const [state, setState] = useState<SelectionState>(defaultSelectionState)
  const [canPaste, setCanPaste] = useState<boolean>(() => hasPasteableContent())
  const actionsRef = useRef<SelectionActions | undefined>(actions)

  const refreshCanPaste = useCallback(() => {
    setCanPaste(hasPasteableContent())
  }, [])

  useEffect(() => {
    const handleFocus = () => refreshCanPaste()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refreshCanPaste])

  useEffect(() => {
    actionsRef.current = actions
  }, [actions])

  const setTool = useCallback((tool: SelectionToolType) => {
    setState((prev) => ({ ...prev, tool }))
  }, [])

  const setMode = useCallback((mode: SelectionMode) => {
    setState((prev) => ({ ...prev, mode }))
  }, [])

  const setFeather = useCallback((feather: number) => {
    setState((prev) => ({ ...prev, feather: Math.max(0, Math.min(50, feather)) }))
  }, [])

  const toggleInvert = useCallback(() => {
    setState((prev) => ({ ...prev, inverted: !prev.inverted }))
  }, [])

  const clearSelection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      paths: [],
      inverted: false,
      hasSelection: false,
    }))
  }, [])

  const setFloatingObject = useCallback((obj: FloatingObject | null) => {
    setState((prev) => ({
      ...prev,
      floatingObject: obj,
      tool: obj ? 'select-move' : prev.tool,
    }))
  }, [])

  const updateFloatingPosition = useCallback((pos: { x: number; y: number }) => {
    setState((prev) => {
      if (!prev.floatingObject) return prev
      return {
        ...prev,
        floatingObject: {
          ...prev.floatingObject,
          x: Math.round(pos.x),
          y: Math.round(pos.y),
        },
      }
    })
  }, [])

  const clearFloatingObject = useCallback(() => {
    setState((prev) => {
      if (prev.floatingObject?.imageSrc?.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(prev.floatingObject.imageSrc)
        } catch {
          // ignore
        }
      }
      return { ...prev, floatingObject: null }
    })
  }, [])

  const commitPath = useCallback((newPath: Point[]) => {
    if (newPath.length < 3) return
    setState((prev) => {
      const updated = combinePaths(prev.paths, newPath, prev.mode)
      return {
        ...prev,
        paths: updated,
        hasSelection: updated.length > 0,
      }
    })
  }, [])

  // Standard keyboard commands: Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+I, Esc/Enter
  useEffect(() => {
    if (!isSelectionActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = document.activeElement
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return

      const isModifier = e.ctrlKey || e.metaKey

      if (e.key === 'Enter' && state.floatingObject) {
        if (actionsRef.current?.onCommitFloating) {
          e.preventDefault()
          actionsRef.current.onCommitFloating()
          return
        }
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        if (state.floatingObject) {
          if (actionsRef.current?.onDiscardFloating) {
            actionsRef.current.onDiscardFloating()
          } else {
            clearFloatingObject()
          }
        } else {
          clearSelection()
        }
        return
      }

      if (
        (isModifier && e.shiftKey && (e.key === 'd' || e.key === 'D')) ||
        (e.altKey && (e.key === 'd' || e.key === 'D')) ||
        (isModifier && e.shiftKey && (e.key === 'a' || e.key === 'A'))
      ) {
        e.preventDefault()
        clearSelection()
        return
      }

      if (isModifier && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault()
        toggleInvert()
        return
      }

      if (isModifier && (e.key === 'c' || e.key === 'C') && state.hasSelection) {
        if (!window.getSelection()?.toString() && actionsRef.current?.onCopy) {
          e.preventDefault()
          actionsRef.current.onCopy()
        }
        return
      }

      if (((isModifier && (e.key === 'x' || e.key === 'X')) || e.key === 'Backspace' || e.key === 'Delete') && state.hasSelection) {
        if (actionsRef.current?.onCut) {
          e.preventDefault()
          actionsRef.current.onCut()
        }
        return
      }

      if (isModifier && (e.key === 'v' || e.key === 'V')) {
        if (actionsRef.current?.onPaste) {
          e.preventDefault()
          actionsRef.current.onPaste()
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSelectionActive, state.hasSelection, state.floatingObject, clearSelection, clearFloatingObject, toggleInvert])

  return {
    state,
    canPaste,
    refreshCanPaste,
    setTool,
    setMode,
    setFeather,
    toggleInvert,
    clearSelection,
    setFloatingObject,
    updateFloatingPosition,
    clearFloatingObject,
    commitPath,
  }
}
