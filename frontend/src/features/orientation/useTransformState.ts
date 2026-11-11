import { useState, useCallback } from 'react'
import { calculateAspectResize } from './transformMath'

export interface UseTransformStateProps {
  currentWidth: number
  currentHeight: number
}

export function useTransformState({
  currentWidth,
  currentHeight,
}: UseTransformStateProps) {
  const [prevDims, setPrevDims] = useState({
    width: currentWidth,
    height: currentHeight,
  })
  const [resizeWidth, setResizeWidth] = useState<number>(currentWidth)
  const [resizeHeight, setResizeHeight] = useState<number>(currentHeight)
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true)

  const [stretchX, setStretchX] = useState<number>(100)
  const [stretchY, setStretchY] = useState<number>(100)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  // Sync resize dimensions during render when document dimensions change
  if (
    prevDims.width !== currentWidth ||
    prevDims.height !== currentHeight
  ) {
    setPrevDims({ width: currentWidth, height: currentHeight })
    setResizeWidth(currentWidth)
    setResizeHeight(currentHeight)
  }

  const handleWidthChange = useCallback(
    (newWidth: number) => {
      setResizeWidth(newWidth)
      if (lockAspectRatio) {
        const { height } = calculateAspectResize(
          currentWidth,
          currentHeight,
          'width',
          newWidth
        )
        setResizeHeight(height)
      }
    },
    [lockAspectRatio, currentWidth, currentHeight]
  )

  const handleHeightChange = useCallback(
    (newHeight: number) => {
      setResizeHeight(newHeight)
      if (lockAspectRatio) {
        const { width } = calculateAspectResize(
          currentWidth,
          currentHeight,
          'height',
          newHeight
        )
        setResizeWidth(width)
      }
    },
    [lockAspectRatio, currentWidth, currentHeight]
  )

  const toggleLockAspectRatio = useCallback(() => {
    setLockAspectRatio((prev) => !prev)
  }, [])

  const resetResize = useCallback(() => {
    setResizeWidth(currentWidth)
    setResizeHeight(currentHeight)
  }, [currentWidth, currentHeight])

  const resetStretch = useCallback(() => {
    setStretchX(100)
    setStretchY(100)
  }, [])

  const isScaled =
    resizeWidth !== currentWidth || resizeHeight !== currentHeight
  const isStretched = stretchX !== 100 || stretchY !== 100

  // Real-time preview scale for both Scale(px) and Stretch
  const previewScale =
    isScaled || isStretched
      ? {
          x:
            (resizeWidth / Math.max(1, currentWidth)) *
            (stretchX / 100),
          y:
            (resizeHeight / Math.max(1, currentHeight)) *
            (stretchY / 100),
        }
      : undefined

  return {
    resizeWidth,
    resizeHeight,
    lockAspectRatio,
    handleWidthChange,
    handleHeightChange,
    toggleLockAspectRatio,
    resetResize,
    stretchX,
    stretchY,
    setStretchX,
    setStretchY,
    resetStretch,
    isScaled,
    isStretched,
    previewScale,
    isProcessing,
    setIsProcessing,
  }
}
