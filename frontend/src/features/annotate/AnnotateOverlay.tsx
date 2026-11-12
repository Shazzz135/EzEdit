import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  type AnnotateItem,
  type AnnotatePoint,
  type AnnotateSettings,
} from './types'
import { renderAllAnnotations } from './annotateRender'

export interface AnnotateOverlayProps {
  imageWidth: number
  imageHeight: number
  zoomScale: number
  settings: AnnotateSettings
  items: AnnotateItem[]
  onAddItem: (item: AnnotateItem) => void
}

export const AnnotateOverlay: React.FC<AnnotateOverlayProps> = ({
  imageWidth,
  imageHeight,
  settings,
  items,
  onAddItem,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [activeDraft, setActiveDraft] = useState<AnnotateItem | null>(null)
  const isDrawingRef = useRef(false)

  const getCanvasPoint = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): AnnotatePoint => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      const scaleX = imageWidth / Math.max(1, rect.width)
      const scaleY = imageHeight / Math.max(1, rect.height)
      const x = Math.max(0, Math.min(imageWidth, (e.clientX - rect.left) * scaleX))
      const y = Math.max(0, Math.min(imageHeight, (e.clientY - rect.top) * scaleY))
      return { x, y }
    },
    [imageWidth, imageHeight]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, imageWidth, imageHeight)
    renderAllAnnotations(ctx, items, activeDraft)
  }, [imageWidth, imageHeight, items, activeDraft])

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return
    e.stopPropagation()
    const pt = getCanvasPoint(e)

    if (settings.subTool === 'text') {
      const textVal = settings.textDraft.trim()
      if (!textVal) return
      onAddItem({
        id: `txt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        kind: 'text',
        position: pt,
        text: textVal,
        fontFamily: settings.fontFamily,
        fontSize: settings.fontSize,
        bold: settings.bold,
        italic: settings.italic,
        align: settings.textAlign,
        color: settings.strokeColor,
        opacity: settings.opacity,
        badgeEnabled: settings.badgeEnabled,
        badgeColor: settings.badgeColor,
      })
      return
    }

    e.currentTarget.setPointerCapture(e.pointerId)
    isDrawingRef.current = true

    if (settings.subTool === 'shapes') {
      setActiveDraft({
        id: `shp_${Date.now()}`,
        kind: 'shape',
        geometry: settings.shapeGeometry,
        styleMode: settings.shapeStyleMode,
        start: pt,
        end: pt,
        strokeColor: settings.strokeColor,
        fillColor: settings.fillColor,
        strokeWidth: settings.strokeWidth,
        cornerRadius: settings.cornerRadius,
        opacity: settings.opacity,
      })
    } else if (settings.subTool === 'paint') {
      setActiveDraft({
        id: `pnt_${Date.now()}`,
        kind: 'paint',
        brushMode: settings.paintMode,
        points: [pt],
        color: settings.strokeColor,
        size: settings.brushSize,
        opacity: settings.opacity,
      })
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !activeDraft) return
    e.stopPropagation()
    const pt = getCanvasPoint(e)

    if (activeDraft.kind === 'shape') {
      setActiveDraft({ ...activeDraft, end: pt })
    } else if (activeDraft.kind === 'paint') {
      setActiveDraft({
        ...activeDraft,
        points: [...activeDraft.points, pt],
      })
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    e.stopPropagation()
    isDrawingRef.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    if (activeDraft) {
      onAddItem(activeDraft)
      setActiveDraft(null)
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={imageWidth}
      height={imageHeight}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`absolute inset-0 w-full h-full z-20 ${
        settings.subTool === 'text' ? 'cursor-text' : 'cursor-crosshair'
      }`}
    />
  )
}
