import { useState, useCallback } from 'react'
import { type AspectRatio, type CropRect } from '@/types/crop'
import { calculateInitialCrop } from './cropMath'

export interface UseCropStateReturn {
  isCropActive: boolean
  cropRect: CropRect | null
  aspectRatio: AspectRatio
  isDragging: boolean
  startCrop: (docWidth: number, docHeight: number) => void
  setAspectRatio: (ratio: AspectRatio, docWidth: number, docHeight: number) => void
  updateCrop: (rect: CropRect) => void
  cancelCrop: () => void
  setIsDragging: (isDragging: boolean) => void
}

export function useCropState(): UseCropStateReturn {
  const [isCropActive, setIsCropActive] = useState(false)
  const [cropRect, setCropRect] = useState<CropRect | null>(null)
  const [aspectRatio, setAspectRatioState] = useState<AspectRatio>('free')
  const [isDragging, setIsDragging] = useState(false)

  const startCrop = useCallback((docWidth: number, docHeight: number) => {
    setIsCropActive(true)
    const initial = calculateInitialCrop(docWidth, docHeight, 'free')
    setCropRect(initial)
    setAspectRatioState('free')
  }, [])

  const setAspectRatio = useCallback(
    (ratio: AspectRatio, docWidth: number, docHeight: number) => {
      setAspectRatioState(ratio)
      const next = calculateInitialCrop(docWidth, docHeight, ratio)
      setCropRect(next)
    },
    []
  )

  const updateCrop = useCallback((rect: CropRect) => {
    setCropRect(rect)
  }, [])

  const cancelCrop = useCallback(() => {
    setIsCropActive(false)
    setCropRect(null)
    setIsDragging(false)
    setAspectRatioState('free')
  }, [])

  return {
    isCropActive,
    cropRect,
    aspectRatio,
    isDragging,
    startCrop,
    setAspectRatio,
    updateCrop,
    cancelCrop,
    setIsDragging,
  }
}
