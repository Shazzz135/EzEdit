import React, { useRef, useState, useEffect, useCallback } from 'react'
import { type RetouchTool, type RetouchSettings, type Point } from './types'
import { applyCloneStampPatch, applyHealingPatch, applySpotHealing } from './retouchMath'

export interface RetouchOverlayProps {
  imageSrc: string
  imageWidth: number
  imageHeight: number
  zoomScale: number
  tool: RetouchTool
  settings: RetouchSettings
  sourcePoint: Point | null
  isAltPressed: boolean
  onSetSourcePoint: (pt: Point) => void
  onCommitTransform: (result: { url: string; blob: Blob; width: number; height: number }) => void
}

export const RetouchOverlay: React.FC<RetouchOverlayProps> = ({
  imageSrc, imageWidth, imageHeight, zoomScale, tool, settings,
  sourcePoint, isAltPressed, onSetSourcePoint, onCommitTransform,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cursorPos, setCursorPos] = useState<Point | null>(null)
  const [isPointerOver, setIsPointerOver] = useState(false)
  const isPaintingRef = useRef(false)
  const initialSourceRef = useRef<Point | null>(null)
  const initialTargetRef = useRef<Point | null>(null)
  const workingCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const baseImgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      baseImgRef.current = img
      const wc = document.createElement('canvas')
      wc.width = imageWidth
      wc.height = imageHeight
      const wctx = wc.getContext('2d')
      if (wctx) wctx.drawImage(img, 0, 0)
      workingCanvasRef.current = wc
    }
    img.src = imageSrc
  }, [imageSrc, imageWidth, imageHeight])

  const getImageCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const effectiveScale = rect.width / imageWidth
    const x = Math.max(0, Math.min(imageWidth, (e.clientX - rect.left) / effectiveScale))
    const y = Math.max(0, Math.min(imageHeight, (e.clientY - rect.top) / effectiveScale))
    return { x: Math.round(x), y: Math.round(y) }
  }, [imageWidth, imageHeight])

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getImageCoords(e)

    // Right-click: set sample anchor point for Clone Stamp & Healing Brush
    if (e.button === 2) {
      e.preventDefault()
      e.stopPropagation()
      if (tool !== 'spot-heal') {
        onSetSourcePoint(pt)
      }
      return
    }

    if (e.button !== 0) return

    if (isAltPressed || e.altKey) {
      if (tool !== 'spot-heal') onSetSourcePoint(pt)
      return
    }

    if ((tool === 'clone-stamp' || tool === 'healing-brush') && !sourcePoint) return

    isPaintingRef.current = true
    initialTargetRef.current = pt
    initialSourceRef.current = sourcePoint ? { ...sourcePoint } : null
    e.currentTarget.setPointerCapture(e.pointerId)

    applyStrokeAt(pt)
  }

  const applyStrokeAt = (targetPt: Point) => {
    const wc = workingCanvasRef.current
    const wctx = wc?.getContext('2d')
    const baseImg = baseImgRef.current
    if (!wc || !wctx || !baseImg) return

    if (tool === 'spot-heal') {
      applySpotHealing(wctx, targetPt, settings.radius, settings.hardness)
    } else if (initialSourceRef.current && initialTargetRef.current) {
      const offsetX = targetPt.x - initialTargetRef.current.x
      const offsetY = targetPt.y - initialTargetRef.current.y
      const currentSrc = {
        x: initialSourceRef.current.x + offsetX,
        y: initialSourceRef.current.y + offsetY,
      }
      if (tool === 'clone-stamp') {
        applyCloneStampPatch(wctx, baseImg, currentSrc, targetPt, settings.radius, settings.hardness, settings.opacity)
      } else if (tool === 'healing-brush') {
        applyHealingPatch(wctx, baseImg, currentSrc, targetPt, settings.radius, settings.hardness, settings.opacity)
      }
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getImageCoords(e)
    setCursorPos(pt)
    if (isPaintingRef.current) applyStrokeAt(pt)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPaintingRef.current) return
    isPaintingRef.current = false
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { /* ignore */ }

    const wc = workingCanvasRef.current
    if (!wc) return
    wc.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      onCommitTransform({ url, blob, width: imageWidth, height: imageHeight })
    }, 'image/png')
  }

  // Draw overlay ring and source crosshairs
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, imageWidth, imageHeight)

    // Source Point Anchor Marker
    if (sourcePoint && tool !== 'spot-heal') {
      ctx.save()
      ctx.strokeStyle = '#60A5FA'
      ctx.lineWidth = 1.5 / Math.max(0.1, zoomScale)
      ctx.beginPath()
      ctx.arc(sourcePoint.x, sourcePoint.y, 6 / Math.max(0.1, zoomScale), 0, Math.PI * 2)
      ctx.moveTo(sourcePoint.x - 10 / Math.max(0.1, zoomScale), sourcePoint.y)
      ctx.lineTo(sourcePoint.x + 10 / Math.max(0.1, zoomScale), sourcePoint.y)
      ctx.moveTo(sourcePoint.x, sourcePoint.y - 10 / Math.max(0.1, zoomScale))
      ctx.lineTo(sourcePoint.x, sourcePoint.y + 10 / Math.max(0.1, zoomScale))
      ctx.stroke()
      ctx.restore()
    }

    // Brush Circle Cursor
    if (cursorPos && isPointerOver) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(cursorPos.x, cursorPos.y, settings.radius, 0, Math.PI * 2)
      ctx.strokeStyle = isAltPressed ? '#F59E0B' : '#60A5FA'
      ctx.lineWidth = 1.5 / Math.max(0.1, zoomScale)
      ctx.setLineDash([4 / Math.max(0.1, zoomScale), 3 / Math.max(0.1, zoomScale)])
      ctx.stroke()

      if (isAltPressed) {
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(cursorPos.x - 8 / Math.max(0.1, zoomScale), cursorPos.y)
        ctx.lineTo(cursorPos.x + 8 / Math.max(0.1, zoomScale), cursorPos.y)
        ctx.moveTo(cursorPos.x, cursorPos.y - 8 / Math.max(0.1, zoomScale))
        ctx.lineTo(cursorPos.x, cursorPos.y + 8 / Math.max(0.1, zoomScale))
        ctx.stroke()
      }
      ctx.restore()
    }
  }, [imageWidth, imageHeight, zoomScale, cursorPos, isPointerOver, sourcePoint, isAltPressed, settings, tool])

  return (
    <canvas
      ref={canvasRef}
      width={imageWidth}
      height={imageHeight}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerEnter={() => setIsPointerOver(true)}
      onPointerLeave={() => { setIsPointerOver(false); setCursorPos(null); }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (tool !== 'spot-heal' && canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect()
          const effectiveScale = rect.width / imageWidth
          const x = Math.max(0, Math.min(imageWidth, (e.clientX - rect.left) / effectiveScale))
          const y = Math.max(0, Math.min(imageHeight, (e.clientY - rect.top) / effectiveScale))
          onSetSourcePoint({ x: Math.round(x), y: Math.round(y) })
        }
      }}
      style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}
      className={`absolute inset-0 z-20 touch-none select-none ${isAltPressed ? 'cursor-crosshair' : 'cursor-none'}`}
    />
  )
}
