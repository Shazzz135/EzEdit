import React, { useRef, useEffect } from 'react'
import { useCanvasPanZoom } from './useCanvasPanZoom'
import { WebGLCanvas } from '@/features/adjustments'
import { EmptyCanvasDropzone } from './EmptyCanvasDropzone'
import { SplitCompareOverlay } from './SplitCompareOverlay'
import { type DocumentState } from '@/types/document'
import { Maximize2, RotateCcw, Columns, Eye, Hand } from 'lucide-react'

export interface CanvasViewportProps {
  document?: DocumentState
  onDropImage?: (file: File) => void
  onZoomChange?: (scale: number) => void
  cropOverlay?: (scale: number) => React.ReactNode
  rotateOverlay?: React.ReactNode
  selectionOverlay?: (scale: number) => React.ReactNode
  retouchOverlay?: (scale: number) => React.ReactNode
  isPrecisionToolActive?: boolean
  previewScale?: { x: number; y: number }
  rotationAngle?: number
  splitActive?: boolean
  splitPosition?: number
  onChangeSplitPosition?: (pos: number) => void
  isHoldComparing?: boolean
  onHoldCompareChange?: (holding: boolean) => void
  onToggleSplit?: () => void
  onRightClickDeselect?: () => void
  panZoom?: ReturnType<typeof useCanvasPanZoom>
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  document: activeDoc, onDropImage, cropOverlay, rotateOverlay, selectionOverlay, retouchOverlay,
  isPrecisionToolActive: isPrecisionToolActiveProp, previewScale, rotationAngle,
  splitActive = false, splitPosition = 0.5, onChangeSplitPosition,
  isHoldComparing = false, onHoldCompareChange, onToggleSplit, onRightClickDeselect,
  panZoom: panZoomProp,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const internalPanZoom = useCanvasPanZoom()
  const panZoom = panZoomProp ?? internalPanZoom
  const isPrecisionToolActive = isPrecisionToolActiveProp ?? (!!cropOverlay || !!selectionOverlay || !!retouchOverlay)

  const fitToScreen = panZoom.fitToScreen
  const docId = activeDoc?.id
  const docW = activeDoc?.currentWidth
  const docH = activeDoc?.currentHeight
  const resetVer = activeDoc?.resetVersion ?? 0

  useEffect(() => {
    if (docId && docW && docH && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      fitToScreen(rect.width, rect.height, docW, docH)
    }
  }, [docId, docW, docH, resetVer, fitToScreen])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = container.getBoundingClientRect()
      panZoom.zoomTo(panZoom.scale * (e.deltaY < 0 ? 1.15 : 0.85), { x: e.clientX, y: e.clientY }, rect)
    }
    container.addEventListener('wheel', onWheel, { passive: false })
    return () => container.removeEventListener('wheel', onWheel)
  }, [panZoom])

  const spacePressTimeRef = useRef<number>(0)
  const hasPannedWhileSpaceRef = useRef<boolean>(false)

  // Keyboard spacebar (pan / grabber shortcut) and '\' or 'c' (hold to compare)
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        spacePressTimeRef.current = Date.now()
        hasPannedWhileSpaceRef.current = false
        panZoom.setIsSpacePressed(true)
      }
      if ((e.key === '\\' || e.key.toLowerCase() === 'c') && !e.repeat) onHoldCompareChange?.(true)
    }
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        panZoom.setIsSpacePressed(false)
        const duration = Date.now() - spacePressTimeRef.current
        if (duration < 300 && !hasPannedWhileSpaceRef.current) {
          panZoom.toggleHandTool()
        }
      }
      if (e.key === '\\' || e.key.toLowerCase() === 'c') onHoldCompareChange?.(false)
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [panZoom, onHoldCompareChange])

  const isGrabMode = panZoom.isSpacePressed || panZoom.isHandToolActive

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isPrecisionToolActive && !isGrabMode && e.button !== 1) return
    if (e.button === 0 || e.button === 1 || e.pointerType === 'touch') panZoom.startPan(e.clientX, e.clientY)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (panZoom.isPanning) {
      if (panZoom.isSpacePressed) hasPannedWhileSpaceRef.current = true
      panZoom.updatePan(e.clientX, e.clientY)
    }
  }
  const handlePointerUp = () => { if (panZoom.isPanning) panZoom.endPan() }
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/') && onDropImage) onDropImage(file)
  }

  const zoomPercent = Math.round(panZoom.scale * 100)
  const isHighZoom = panZoom.scale >= 8.0

  if (!activeDoc) {
    return <EmptyCanvasDropzone onDropImage={onDropImage} onDragOver={handleDragOver} onDrop={handleDrop} />
  }

  const orient = activeDoc.orientation
  const effRot = orient?.rotation ?? rotationAngle ?? 0
  const effScaleX = (previewScale?.x ?? 1) * (orient?.scaleX ?? 1) * (orient?.flipH ? -1 : 1)
  const effScaleY = (previewScale?.y ?? 1) * (orient?.scaleY ?? 1) * (orient?.flipV ? -1 : 1)
  const hasScaleOrFlip = effScaleX !== 1 || effScaleY !== 1
  const canvasTransform = `${hasScaleOrFlip ? `scale(${effScaleX}, ${effScaleY}) ` : ''}${effRot ? `rotate(${effRot}deg)` : ''}`.trim() || undefined

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => {
        e.preventDefault()
        onRightClickDeselect?.()
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative w-full h-full overflow-hidden flex items-center justify-center select-none touch-none ${
        panZoom.isPanning
          ? 'cursor-grabbing'
          : isGrabMode || !isPrecisionToolActive
            ? 'cursor-grab'
            : 'cursor-default'
      }`}
    >
      {/* Transformed Image Container */}
      <div
        style={{
          transform: `translate(${panZoom.offset.x}px, ${panZoom.offset.y}px) scale(${panZoom.scale})`,
          transformOrigin: 'center center',
          width: `${activeDoc.currentWidth}px`,
          height: `${activeDoc.currentHeight}px`,
          backgroundImage: 'linear-gradient(45deg, #1A1A26 25%, transparent 25%), linear-gradient(-45deg, #1A1A26 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1A1A26 75%), linear-gradient(-45deg, transparent 75%, #1A1A26 75%)',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          backgroundColor: '#12121A',
        }}
        className="relative transition-transform duration-75 ease-out shadow-2xl flex-shrink-0"
      >
        <WebGLCanvas
          key={`${activeDoc.id}_${activeDoc.resetVersion ?? 0}`}
          imageSrc={activeDoc.imageSrc}
          width={activeDoc.currentWidth}
          height={activeDoc.currentHeight}
          adjustments={activeDoc.adjustments}
          filter={activeDoc.filter}
          splitPosition={splitActive ? splitPosition : null}
          isHoldComparing={isHoldComparing}
          style={{
            imageRendering: panZoom.scale > 1.0 ? 'pixelated' : 'auto',
            transform: canvasTransform,
          }}
          className="w-full h-full object-contain pointer-events-none transition-transform duration-75"
        />

        {/* Pixel grid overlay above 800% zoom */}
        {isHighZoom && (
          <div
            style={{
              backgroundSize: '1px 1px',
              backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)',
            }}
            className="absolute inset-0 pointer-events-none"
          />
        )}

        {/* Split Compare Interactive Overlay */}
        {splitActive && onChangeSplitPosition && (
          <SplitCompareOverlay
            splitPosition={splitPosition}
            onChangeSplitPosition={onChangeSplitPosition}
            imageWidth={activeDoc.currentWidth}
            imageHeight={activeDoc.currentHeight}
          />
        )}

        {rotateOverlay}
        <div className={isGrabMode ? 'pointer-events-none' : ''}>
          {cropOverlay && cropOverlay(panZoom.scale)}
          {selectionOverlay && selectionOverlay(panZoom.scale)}
          {retouchOverlay && retouchOverlay(panZoom.scale)}
        </div>
      </div>

      {/* Floating Viewport Controls (Bottom Left) */}
      <div className="hidden md:flex absolute bottom-3 left-3 z-30 items-center gap-1.5 px-2.5 py-1 bg-[#14141C]/90 backdrop-blur-xs border border-[#242432] rounded text-xs font-mono text-[#D0D0DC] shadow-lg">
        <button type="button" onClick={panZoom.resetZoom} title="Reset to 100%" className="hover:text-[#60A5FA] cursor-pointer">{zoomPercent}%</button>
        <div className="w-[1px] h-3 bg-[#2A2A38] mx-0.5" />
        <button type="button" onClick={() => { const rect = containerRef.current?.getBoundingClientRect(); if (rect) panZoom.fitToScreen(rect.width, rect.height, activeDoc.currentWidth, activeDoc.currentHeight) }} title="Fit to Screen" className="p-1 hover:text-[#60A5FA] text-[#808094] cursor-pointer"><Maximize2 className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={panZoom.resetZoom} title="Reset View" className="p-1 hover:text-[#60A5FA] text-[#808094] cursor-pointer"><RotateCcw className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={panZoom.toggleHandTool} title="Hand Tool / Pan (Space)" className={`p-1 transition-colors cursor-pointer rounded ${panZoom.isHandToolActive || panZoom.isSpacePressed ? 'text-[#60A5FA] bg-[#222234]' : 'text-[#808094] hover:text-[#60A5FA]'}`}><Hand className="w-3.5 h-3.5" /></button>
        <div className="w-[1px] h-3 bg-[#2A2A38] mx-0.5" />
        {onToggleSplit && (
          <button type="button" onClick={onToggleSplit} title={splitActive ? 'Disable Split Compare' : 'Enable Split Compare'} className={`p-1 transition-colors cursor-pointer ${splitActive ? 'text-[#60A5FA]' : 'text-[#808094] hover:text-[#60A5FA]'}`}><Columns className="w-3.5 h-3.5" /></button>
        )}
        {onHoldCompareChange && (
          <button type="button" onPointerDown={() => onHoldCompareChange(true)} onPointerUp={() => onHoldCompareChange(false)} onPointerLeave={() => onHoldCompareChange(false)} title="Hold to Compare Original (Hotkey: \ or C)" className={`p-1 transition-colors cursor-pointer touch-none ${isHoldComparing ? 'text-[#60A5FA]' : 'text-[#808094] hover:text-[#60A5FA]'}`}><Eye className="w-3.5 h-3.5" /></button>
        )}
      </div>
    </div>
  )
}
