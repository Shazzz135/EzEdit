import { useState, useCallback, useEffect, useRef } from 'react'
import {
  type SelectionState,
  type SelectionToolType,
  type SelectionMode,
  type Point,
  defaultSelectionState,
} from '@/types/selection'
import { combinePaths } from './selectionGeometry'

export interface SelectionActions {
  onCopy?: () => void
  onCut?: () => void
}

export function useSelectionState(isSelectionActive = true, actions?: SelectionActions) {
  const [state, setState] = useState<SelectionState>(defaultSelectionState)
  const actionsRef = useRef<SelectionActions | undefined>(actions)

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

  // Standard keyboard commands: Ctrl+C (copy), Ctrl+X (cut), Ctrl+I (invert), Ctrl+D / Esc (deselect)
  useEffect(() => {
    if (!isSelectionActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = document.activeElement
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return

      const isModifier = e.ctrlKey || e.metaKey

      // Ctrl+D or Esc: Deselect
      if (e.key === 'Escape' || (isModifier && (e.key === 'd' || e.key === 'D'))) {
        e.preventDefault()
        clearSelection()
        return
      }

      // Ctrl+I or Ctrl+Shift+I: Invert
      if (isModifier && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault()
        toggleInvert()
        return
      }

      // Ctrl+C: Copy selection
      if (isModifier && (e.key === 'c' || e.key === 'C') && state.hasSelection) {
        if (!window.getSelection()?.toString() && actionsRef.current?.onCopy) {
          e.preventDefault()
          actionsRef.current.onCopy()
        }
        return
      }

      // Ctrl+X: Cut selection
      if (isModifier && (e.key === 'x' || e.key === 'X') && state.hasSelection) {
        if (actionsRef.current?.onCut) {
          e.preventDefault()
          actionsRef.current.onCut()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSelectionActive, state.hasSelection, clearSelection, toggleInvert])

  return {
    state,
    setTool,
    setMode,
    setFeather,
    toggleInvert,
    clearSelection,
    commitPath,
  }
}
