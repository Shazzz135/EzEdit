import React, { useRef, useCallback } from 'react'
import { type CropRect, type CropHandle, type AspectRatio } from '@/types/crop'
import { getAspectRatioValue, calculateResizeCrop } from './cropMath'

export interface CropOverlayProps {
  imageWidth: number
  imageHeight: number
  cropRect: CropRect
  aspectRatio: AspectRatio
  zoomScale: number
  onChange: (rect: CropRect) => void
  onDragStateChange?: (isDragging: boolean) => void
  onCancel?: () => void
}

export const CropOverlay: React.FC<CropOverlayProps> = ({
  imageWidth,
  imageHeight,
  cropRect,
  aspectRatio,
  zoomScale,
  onChange,
  onDragStateChange,
  onCancel,
}) => {
  const dragRef = useRef<{
    handle: CropHandle
    startX: number
    startY: number
    startRect: CropRect
  } | null>(null)

  const ratioValue = getAspectRatioValue(aspectRatio, imageWidth, imageHeight)

  const handlePointerDown = useCallback(
    (handle: CropHandle, e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()

      dragRef.current = {
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startRect: { ...cropRect },
      }

      onDragStateChange?.(true)

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (!dragRef.current) return
        const deltaX = (moveEvent.clientX - dragRef.current.startX) / zoomScale
        const deltaY = (moveEvent.clientY - dragRef.current.startY) / zoomScale

        const next = calculateResizeCrop(
          dragRef.current.startRect,
          dragRef.current.handle,
          deltaX,
          deltaY,
          imageWidth,
          imageHeight,
          ratioValue
        )
        onChange(next)
      }

      const handlePointerUp = () => {
        dragRef.current = null
        onDragStateChange?.(false)
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
    },
    [cropRect, imageWidth, imageHeight, ratioValue, zoomScale, onChange, onDragStateChange]
  )

  const pathD = `M0 0 H${imageWidth} V${imageHeight} H0 Z M${cropRect.x} ${cropRect.y} V${cropRect.y + cropRect.height} H${cropRect.x + cropRect.width} V${cropRect.y} Z`

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault()
        onCancel?.()
      }}
      className="absolute inset-0 pointer-events-auto select-none overflow-visible"
    >
      {/* 1. Darkened backdrop mask outside crop box */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        <path fill="rgba(0, 0, 0, 0.65)" fillRule="evenodd" d={pathD} />
      </svg>

      {/* 2. Interactive Crop Rectangle */}
      <div
        style={{
          transform: `translate(${cropRect.x}px, ${cropRect.y}px)`,
          width: `${cropRect.width}px`,
          height: `${cropRect.height}px`,
        }}
        className="absolute top-0 left-0 border border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.5)] cursor-move"
        onPointerDown={(e) => handlePointerDown('move', e)}
      >
        {/* Rule-of-Thirds Grid */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 bottom-0 left-1/3 w-[1px] bg-white/40" />
          <div className="absolute top-0 bottom-0 left-2/3 w-[1px] bg-white/40" />
          <div className="absolute left-0 right-0 top-1/3 h-[1px] bg-white/40" />
          <div className="absolute left-0 right-0 top-2/3 h-[1px] bg-white/40" />
        </div>

        {/* Live pixel dimensions badge (hidden on mobile) */}
        <div className="hidden md:block absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#12121A]/90 backdrop-blur-xs border border-[#282838] rounded text-[11px] font-mono text-[#E4E4F0] shadow-md pointer-events-none whitespace-nowrap">
          {Math.round(cropRect.width)} × {Math.round(cropRect.height)} px
        </div>

        {/* 4 Corner handles */}
        <div
          onPointerDown={(e) => handlePointerDown('nw', e)}
          className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border border-[#14141E] rounded-xs shadow cursor-nwse-resize"
        />
        <div
          onPointerDown={(e) => handlePointerDown('ne', e)}
          className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border border-[#14141E] rounded-xs shadow cursor-nesw-resize"
        />
        <div
          onPointerDown={(e) => handlePointerDown('se', e)}
          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border border-[#14141E] rounded-xs shadow cursor-nwse-resize"
        />
        <div
          onPointerDown={(e) => handlePointerDown('sw', e)}
          className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border border-[#14141E] rounded-xs shadow cursor-nesw-resize"
        />

        {/* 4 Edge handles */}
        <div
          onPointerDown={(e) => handlePointerDown('n', e)}
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-2 bg-white border border-[#14141E] rounded-xs shadow cursor-ns-resize"
        />
        <div
          onPointerDown={(e) => handlePointerDown('s', e)}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-2 bg-white border border-[#14141E] rounded-xs shadow cursor-ns-resize"
        />
        <div
          onPointerDown={(e) => handlePointerDown('w', e)}
          className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-5 bg-white border border-[#14141E] rounded-xs shadow cursor-ew-resize"
        />
        <div
          onPointerDown={(e) => handlePointerDown('e', e)}
          className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-5 bg-white border border-[#14141E] rounded-xs shadow cursor-ew-resize"
        />
      </div>
    </div>
  )
}
