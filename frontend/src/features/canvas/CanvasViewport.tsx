import React, { useRef, useEffect } from 'react'
import { useCanvasPanZoom } from './useCanvasPanZoom'
import { type DocumentState } from '@/types/document'
import { Maximize2, RotateCcw, Plus } from 'lucide-react'

export interface CanvasViewportProps {
  document?: DocumentState
  onDropImage?: (file: File) => void
  onZoomChange?: (scale: number) => void
  cropOverlay?: (scale: number) => React.ReactNode
  rotateOverlay?: React.ReactNode
  isPrecisionToolActive?: boolean
  previewScale?: { x: number; y: number }
  rotationAngle?: number
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  document: activeDoc,
  onDropImage,
  cropOverlay,
  rotateOverlay,
  isPrecisionToolActive: isPrecisionToolActiveProp,
  previewScale,
  rotationAngle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const panZoom = useCanvasPanZoom()
  const isPrecisionToolActive = isPrecisionToolActiveProp ?? !!cropOverlay

  const fitToScreen = panZoom.fitToScreen
  const docId = activeDoc?.id
  const docW = activeDoc?.currentWidth
  const docH = activeDoc?.currentHeight

  // Auto-fit image to screen when a new document opens
  useEffect(() => {
    if (docId && docW && docH && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      fitToScreen(rect.width, rect.height, docW, docH)
    }
  }, [docId, docW, docH, fitToScreen])

  // Native non-passive wheel listener allows e.preventDefault() for smooth focal zooming
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = container.getBoundingClientRect()
      const factor = e.deltaY < 0 ? 1.15 : 0.85
      panZoom.zoomTo(panZoom.scale * factor, { x: e.clientX, y: e.clientY }, rect)
    }

    container.addEventListener('wheel', onWheel, { passive: false })
    return () => container.removeEventListener('wheel', onWheel)
  }, [panZoom])

  // Keyboard spacebar listener for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT') {
        panZoom.setIsSpacePressed(true)
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        panZoom.setIsSpacePressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [panZoom])

  // Pan handlers (default pan on left-click / touch when no precision tool is active)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isPrecisionToolActive && !panZoom.isSpacePressed && e.button !== 1) {
      return
    }
    if (e.button === 0 || e.button === 1 || e.pointerType === 'touch') {
      panZoom.startPan(e.clientX, e.clientY)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (panZoom.isPanning) {
      panZoom.updatePan(e.clientX, e.clientY)
    }
  }

  const handlePointerUp = () => {
    if (panZoom.isPanning) {
      panZoom.endPan()
    }
  }

  // Drag and drop image files directly onto viewport
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/') && onDropImage) {
      onDropImage(file)
    }
  }

  const zoomPercent = Math.round(panZoom.scale * 100)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isHighZoom = panZoom.scale >= 8.0 // >= 800% show pixel grid

  if (!activeDoc) {
    return (
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file && onDropImage) onDropImage(file)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#2E2E3E] hover:border-[#60A5FA] bg-[#161622]/70 hover:bg-[#1A1A2A] rounded-2xl transition-all cursor-pointer mb-3 shadow-lg hover:shadow-[#60A5FA]/10"
        >
          <div className="w-14 h-14 rounded-full bg-[#20202E] group-hover:bg-[#2563EB]/20 flex items-center justify-center mb-3 text-[#9090A0] group-hover:text-[#60A5FA] transition-colors border border-[#2D2D3E] group-hover:border-[#3B82F6]/50">
            <Plus className="w-7 h-7" />
          </div>
          <span className="text-sm font-semibold text-[#E0E0EC] group-hover:text-white flex items-center gap-1.5">
            Import Image
          </span>
          <span className="text-xs text-[#707080] mt-1">
            Click to browse or drag & drop image
          </span>
        </button>
        <p className="text-xs text-[#707080] max-w-xs">
          Supports PNG, JPEG, WebP. Multi-tab editing supports up to 6 documents simultaneously.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative w-full h-full overflow-hidden flex items-center justify-center select-none touch-none ${
        panZoom.isPanning
          ? 'cursor-grabbing'
          : !isPrecisionToolActive || panZoom.isSpacePressed
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
        }}
        className="relative transition-transform duration-75 ease-out shadow-2xl flex-shrink-0"
      >
        <img
          src={activeDoc.imageSrc}
          alt={activeDoc.name}
          draggable={false}
          style={{
            imageRendering: panZoom.scale > 1.0 ? 'pixelated' : 'auto',
            transform: `${previewScale ? `scale(${previewScale.x}, ${previewScale.y}) ` : ''}${rotationAngle ? `rotate(${rotationAngle}deg)` : ''}`.trim() || undefined,
          }}
          className="w-full h-full object-contain pointer-events-none transition-transform duration-75"
        />

        {/* Pixel grid overlay above 800% zoom */}
        {isHighZoom && (
          <div
            style={{
              backgroundSize: `${1}px ${1}px`,
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)',
            }}
            className="absolute inset-0 pointer-events-none"
          />
        )}

        {/* Dynamic Tool Overlays */}
        {rotateOverlay}
        {cropOverlay && cropOverlay(panZoom.scale)}
      </div>

      {/* Floating Zoom & Fit Controls (Bottom Left - Hidden on Mobile) */}
      <div className="hidden md:flex absolute bottom-3 left-3 z-30 items-center gap-1 px-2 py-1 bg-[#14141C]/90 backdrop-blur-xs border border-[#242432] rounded text-xs font-mono text-[#D0D0DC] shadow-lg">
        <button
          type="button"
          onClick={panZoom.resetZoom}
          title="Reset to 100%"
          className="hover:text-[#60A5FA] cursor-pointer"
        >
          {zoomPercent}%
        </button>
        <div className="w-[1px] h-3 bg-[#2A2A38] mx-1" />
        <button
          type="button"
          onClick={() => {
            const rect = containerRef.current?.getBoundingClientRect()
            if (rect) panZoom.fitToScreen(rect.width, rect.height, activeDoc.currentWidth, activeDoc.currentHeight)
          }}
          title="Fit to Screen"
          className="p-0.5 hover:text-[#60A5FA] text-[#808094] cursor-pointer"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={panZoom.resetZoom}
          title="Reset View"
          className="p-0.5 hover:text-[#60A5FA] text-[#808094] cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
