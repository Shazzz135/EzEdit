import React, { useRef, useEffect, useState, useCallback } from 'react'
import {
  type SelectionToolType,
  type Point,
} from '@/types/selection'
import {
  createRectPath,
  createEllipsePath,
  buildPath2D,
} from './selectionGeometry'

export interface SelectionOverlayProps {
  imageWidth: number
  imageHeight: number
  zoomScale: number
  tool: SelectionToolType
  paths: Point[][]
  onCommitPath: (path: Point[]) => void
  onDeselect?: () => void
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  imageWidth,
  imageHeight,
  zoomScale,
  tool,
  paths,
  onCommitPath,
  onDeselect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [activePoints, setActivePoints] = useState<Point[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const startPointRef = useRef<Point | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const dashOffsetRef = useRef<number>(0)

  // Map pointer client coordinates to image canvas coordinates
  const getImageCoords = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): Point => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      const effectiveScale = rect.width / imageWidth
      const x = Math.max(0, Math.min(imageWidth, (e.clientX - rect.left) / effectiveScale))
      const y = Math.max(0, Math.min(imageHeight, (e.clientY - rect.top) / effectiveScale))
      return { x, y }
    },
    [imageWidth, imageHeight]
  )

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 2) {
      e.preventDefault()
      setActivePoints([])
      setIsDrawing(false)
      onDeselect?.()
      return
    }
    if (e.button !== 0) return
    const pt = getImageCoords(e)

    if (tool === 'poly-lasso') {
      if (!isDrawing) {
        setIsDrawing(true)
        setActivePoints([pt])
      } else {
        const first = activePoints[0]
        const dist = Math.hypot(pt.x - first.x, pt.y - first.y)
        if (activePoints.length >= 3 && dist < 12 / Math.max(0.1, zoomScale)) {
          onCommitPath(activePoints)
          setActivePoints([])
          setIsDrawing(false)
        } else {
          setActivePoints((prev) => [...prev, pt])
        }
      }
      return
    }

    setIsDrawing(true)
    startPointRef.current = pt
    setActivePoints([pt])
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const pt = getImageCoords(e)

    if (tool === 'rect-marquee' && startPointRef.current) {
      setActivePoints(createRectPath(startPointRef.current, pt))
    } else if (tool === 'ellipse-marquee' && startPointRef.current) {
      setActivePoints(createEllipsePath(startPointRef.current, pt))
    } else if (tool === 'lasso') {
      setActivePoints((prev) => [...prev, pt])
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool === 'poly-lasso') return
    setIsDrawing(false)
    startPointRef.current = null

    if (activePoints.length >= 3) {
      onCommitPath(activePoints)
    }
    setActivePoints([])
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // Ignore if released
    }
  }

  const handleDoubleClick = () => {
    if (tool === 'poly-lasso' && activePoints.length >= 3) {
      onCommitPath(activePoints)
      setActivePoints([])
      setIsDrawing(false)
    }
  }

  // Animated Marching Ants Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let running = true

    const render = () => {
      if (!running) return
      ctx.clearRect(0, 0, imageWidth, imageHeight)

      dashOffsetRef.current = (dashOffsetRef.current + 0.35) % 16
      const offset = dashOffsetRef.current

      // 1. Draw existing committed selection paths with marching ants
      if (paths.length > 0) {
        const path2d = buildPath2D(paths)
        ctx.save()
        ctx.fillStyle = 'rgba(96, 165, 250, 0.08)'
        ctx.fill(path2d)

        // Alternating Black & White Marching Ants
        ctx.lineWidth = 1.25 / Math.max(0.1, zoomScale)
        ctx.strokeStyle = '#000000'
        ctx.setLineDash([4, 4])
        ctx.lineDashOffset = -offset
        ctx.stroke(path2d)

        ctx.strokeStyle = '#FFFFFF'
        ctx.lineDashOffset = -offset + 4
        ctx.stroke(path2d)
        ctx.restore()
      }

      // 2. Draw live in-progress drawing path
      if (activePoints.length >= 2) {
        ctx.save()
        ctx.lineWidth = 1.5 / Math.max(0.1, zoomScale)
        ctx.strokeStyle = '#60A5FA'
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(activePoints[0].x, activePoints[0].y)
        for (let i = 1; i < activePoints.length; i++) {
          ctx.lineTo(activePoints[i].x, activePoints[i].y)
        }
        if (tool !== 'poly-lasso' && activePoints.length >= 3) {
          ctx.closePath()
        }
        ctx.stroke()
        ctx.restore()
      }

      animFrameRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      running = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [imageWidth, imageHeight, zoomScale, paths, activePoints, tool])

  return (
    <canvas
      ref={canvasRef}
      width={imageWidth}
      height={imageHeight}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => {
        e.preventDefault()
        setActivePoints([])
        setIsDrawing(false)
        onDeselect?.()
      }}
      style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}
      className="absolute inset-0 z-20 cursor-crosshair touch-none select-none"
    />
  )
}
