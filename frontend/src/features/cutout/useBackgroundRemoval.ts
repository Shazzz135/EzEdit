import { useState, useCallback } from 'react'
import { type DocumentState } from '@/types/document'
import { type Point } from '@/types/selection'
import { type TransformResult } from '@/types/transform'
import { type RemoveBackgroundOptions } from './backgroundRemoval'
import { executeCutout } from './executeCutout'

export function useBackgroundRemoval(
  activeDoc: DocumentState | undefined,
  onApplyTransform: (result: TransformResult) => void,
  onClearSelection?: () => void
) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAutoCutout = useCallback(
    async (options: RemoveBackgroundOptions) => {
      if (!activeDoc || isProcessing) return
      try {
        setIsProcessing(true)
        const res = await executeCutout(activeDoc.imageSrc, options)
        onApplyTransform(res)
      } catch (err) {
        console.error('Background removal failed:', err)
      } finally {
        setIsProcessing(false)
      }
    },
    [activeDoc, isProcessing, onApplyTransform]
  )

  const handleSelectionCutout = useCallback(
    async (invert: boolean, paths: Point[][]) => {
      if (!activeDoc || isProcessing || paths.length === 0) return
      try {
        setIsProcessing(true)
        const res = await executeCutout(activeDoc.imageSrc, { invert }, paths)
        onApplyTransform(res)
        onClearSelection?.()
      } catch (err) {
        console.error('Selection cutout failed:', err)
      } finally {
        setIsProcessing(false)
      }
    },
    [activeDoc, isProcessing, onApplyTransform, onClearSelection]
  )

  return {
    isProcessing,
    handleAutoCutout,
    handleSelectionCutout,
  }
}
