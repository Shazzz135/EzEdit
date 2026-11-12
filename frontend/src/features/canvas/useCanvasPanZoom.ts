import { useState, useCallback, useRef } from 'react'

export const MIN_ZOOM = 0.1 // 10%
export const MAX_ZOOM = 32.0 // 3200%

export interface Point {
  x: number
  y: number
}

export interface UseCanvasPanZoomProps {
  imageWidth: number
  imageHeight: number
  containerWidth: number
  containerHeight: number
}

export const useCanvasPanZoom = () => {
  const [scale, setScale] = useState(1.0)
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 })
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isHandToolActive, setIsHandToolActive] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const dragStartRef = useRef<Point>({ x: 0, y: 0 })
  const offsetStartRef = useRef<Point>({ x: 0, y: 0 })

  const clampScale = useCallback((val: number) => {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(val * 1000) / 1000))
  }, [])

  // Fit image inside container with 32px padding
  const fitToScreen = useCallback(
    (containerW: number, containerH: number, imageW: number, imageH: number) => {
      if (containerW <= 0 || containerH <= 0 || imageW <= 0 || imageH <= 0) return
      const availableW = containerW - 64
      const availableH = containerH - 64
      const fitScale = Math.min(availableW / imageW, availableH / imageH, 1.0)
      setScale(clampScale(fitScale))
      setOffset({ x: 0, y: 0 })
    },
    [clampScale]
  )

  // Zoom to a specific scale centered around a focal screen point (or center)
  const zoomTo = useCallback(
    (newScaleTarget: number, focalPoint?: Point, containerRect?: DOMRect) => {
      setScale((prevScale) => {
        const nextScale = clampScale(newScaleTarget)
        if (nextScale === prevScale) return prevScale

        if (focalPoint && containerRect) {
          // Compute focal center relative to container center
          const cx = containerRect.width / 2
          const cy = containerRect.height / 2
          const dx = focalPoint.x - containerRect.left - cx
          const dy = focalPoint.y - containerRect.top - cy

          setOffset((prevOffset) => {
            const factor = nextScale / prevScale - 1
            return {
              x: prevOffset.x - dx * factor,
              y: prevOffset.y - dy * factor,
            }
          })
        }
        return nextScale
      })
    },
    [clampScale]
  )

  const zoomIn = useCallback(() => {
    const zoomSteps = [0.1, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0, 8.0, 16.0, 32.0]
    setScale((prev) => {
      const next = zoomSteps.find((s) => s > prev + 0.01) || prev * 1.25
      return clampScale(next)
    })
  }, [clampScale])

  const zoomOut = useCallback(() => {
    const zoomSteps = [0.1, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0, 8.0, 16.0, 32.0]
    setScale((prev) => {
      const reversed = [...zoomSteps].reverse()
      const next = reversed.find((s) => s < prev - 0.01) || prev / 1.25
      return clampScale(next)
    })
  }, [clampScale])

  const resetZoom = useCallback(() => {
    setScale(1.0)
    setOffset({ x: 0, y: 0 })
  }, [])

  // Pan handlers
  const startPan = useCallback((clientX: number, clientY: number) => {
    setIsPanning(true)
    dragStartRef.current = { x: clientX, y: clientY }
    offsetStartRef.current = { ...offset }
  }, [offset])

  const updatePan = useCallback((clientX: number, clientY: number) => {
    if (!dragStartRef.current) return
    const dx = clientX - dragStartRef.current.x
    const dy = clientY - dragStartRef.current.y
    setOffset({
      x: offsetStartRef.current.x + dx,
      y: offsetStartRef.current.y + dy,
    })
  }, [])

  const endPan = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Coordinate projections
  const screenToCanvas = useCallback(
    (clientX: number, clientY: number, containerRect: DOMRect, imageW: number, imageH: number): Point => {
      const containerCenterX = containerRect.left + containerRect.width / 2 + offset.x
      const containerCenterY = containerRect.top + containerRect.height / 2 + offset.y

      const relX = (clientX - containerCenterX) / scale
      const relY = (clientY - containerCenterY) / scale

      return {
        x: Math.round(relX + imageW / 2),
        y: Math.round(relY + imageH / 2),
      }
    },
    [scale, offset]
  )

  const canvasToScreen = useCallback(
    (canvasX: number, canvasY: number, containerRect: DOMRect, imageW: number, imageH: number): Point => {
      const containerCenterX = containerRect.left + containerRect.width / 2 + offset.x
      const containerCenterY = containerRect.top + containerRect.height / 2 + offset.y

      return {
        x: containerCenterX + (canvasX - imageW / 2) * scale,
        y: containerCenterY + (canvasY - imageH / 2) * scale,
      }
    },
    [scale, offset]
  )

  const toggleHandTool = useCallback(() => {
    setIsHandToolActive((prev) => !prev)
  }, [])

  return {
    scale,
    offset,
    isPanning,
    isSpacePressed,
    setIsSpacePressed,
    isHandToolActive,
    setIsHandToolActive,
    toggleHandTool,
    zoomTo,
    zoomIn,
    zoomOut,
    fitToScreen,
    resetZoom,
    startPan,
    updatePan,
    endPan,
    screenToCanvas,
    canvasToScreen,
  }
}
