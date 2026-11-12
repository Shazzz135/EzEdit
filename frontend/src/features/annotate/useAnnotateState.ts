import { useState, useCallback } from 'react'
import {
  DEFAULT_ANNOTATE_SETTINGS,
  type AnnotateItem,
  type AnnotateSettings,
  type AnnotateSubTool,
} from './types'
import { bakeAnnotationsToImage } from './annotateRender'
import { type DocumentState } from '@/types/document'
import { type TransformResult } from '@/types/transform'

export function useAnnotateState() {
  const [settings, setSettings] = useState<AnnotateSettings>(DEFAULT_ANNOTATE_SETTINGS)
  const [items, setItems] = useState<AnnotateItem[]>([])
  const [undoneItems, setUndoneItems] = useState<AnnotateItem[]>([])
  const [isBaking, setIsBaking] = useState(false)

  const updateSettings = useCallback((partial: Partial<AnnotateSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }))
  }, [])

  const setSubTool = useCallback((subTool: AnnotateSubTool) => {
    setSettings((prev) => ({ ...prev, subTool }))
  }, [])

  const addItem = useCallback((item: AnnotateItem) => {
    setItems((prev) => [...prev, item])
    setUndoneItems([])
  }, [])

  const undoLastItem = useCallback(() => {
    setItems((prev) => {
      if (prev.length === 0) return prev
      const popped = prev[prev.length - 1]
      setUndoneItems((u) => [...u, popped])
      return prev.slice(0, -1)
    })
  }, [])

  const redoLastItem = useCallback(() => {
    setUndoneItems((prevUndone) => {
      if (prevUndone.length === 0) return prevUndone
      const restored = prevUndone[prevUndone.length - 1]
      setItems((prevItems) => [...prevItems, restored])
      return prevUndone.slice(0, -1)
    })
  }, [])

  const clearItems = useCallback(() => {
    setItems([])
    setUndoneItems([])
  }, [])

  const resetAnnotate = useCallback(() => {
    setItems([])
    setUndoneItems([])
  }, [])

  const applyAnnotations = useCallback(
    async (
      activeDoc: DocumentState | undefined,
      onApplyTransform: (result: TransformResult) => void
    ) => {
      if (!activeDoc || items.length === 0) return
      setIsBaking(true)
      try {
        const res = await bakeAnnotationsToImage(
          activeDoc.imageSrc,
          activeDoc.currentWidth,
          activeDoc.currentHeight,
          items
        )
        onApplyTransform(res)
        setItems([])
        setUndoneItems([])
      } catch (err) {
        console.error('Failed to bake annotations:', err)
      } finally {
        setIsBaking(false)
      }
    },
    [items]
  )

  return {
    settings,
    items,
    undoneItems,
    isBaking,
    updateSettings,
    setSubTool,
    addItem,
    undoLastItem,
    redoLastItem,
    clearItems,
    resetAnnotate,
    applyAnnotations,
  }
}
