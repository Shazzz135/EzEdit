import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Check, X, Move } from 'lucide-react'
import { type FloatingObject } from '@/types/selection'

export interface FloatingObjectOverlayProps {
  floating: FloatingObject
  zoomScale: number
  imageWidth: number
  imageHeight: number
  onUpdatePosition: (pos: { x: number; y: number }) => void
  onCommit: () => void
  onDiscard: () => void
}

export const FloatingObjectOverlay: React.FC<FloatingObjectOverlayProps> = ({
  floating,
  zoomScale,
  imageWidth,
  imageHeight,
  onUpdatePosition,
  onCommit,
  onDiscard,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ clientX: number; clientY: number; origX: number; origY: number } | null>(null)

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setIsDragging(true)
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      origX: floating.x,
      origY: floating.y,
    }
  }

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return
    const dx = (e.clientX - dragStartRef.current.clientX) / zoomScale
    const dy = (e.clientY - dragStartRef.current.clientY) / zoomScale
    const newX = Math.round(dragStartRef.current.origX + dx)
    const newY = Math.round(dragStartRef.current.origY + dy)
    onUpdatePosition({ x: newX, y: newY })
  }, [zoomScale, onUpdatePosition])

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartRef.current) {
      try {
        ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {
        // pointer capture release fallback
      }
    }
    dragStartRef.current = null
    setIsDragging(false)
  }

  useEffect(() => {
    const handleGlobalUp = () => {
      dragStartRef.current = null
      setIsDragging(false)
    }
    window.addEventListener('pointerup', handleGlobalUp)
    return () => window.removeEventListener('pointerup', handleGlobalUp)
  }, [])

  return (
    <div
      className="absolute pointer-events-none select-none z-30"
      style={{
        left: 0,
        top: 0,
        width: imageWidth * zoomScale,
        height: imageHeight * zoomScale,
      }}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`absolute pointer-events-auto cursor-move group transition-shadow ${
          isDragging ? 'cursor-grabbing' : 'hover:ring-1 hover:ring-[#60A5FA]'
        }`}
        style={{
          left: floating.x * zoomScale,
          top: floating.y * zoomScale,
          width: floating.width * zoomScale,
          height: floating.height * zoomScale,
        }}
      >
        <img
          src={floating.imageSrc}
          alt="Floating Cut/Pasted Object"
          className="w-full h-full object-fill pointer-events-none drop-shadow-md"
          draggable={false}
        />

        {/* Dashed Selection Bounding Box */}
        <div className="absolute inset-0 border-2 border-dashed border-[#60A5FA] pointer-events-none shadow-[0_0_8px_rgba(96,165,250,0.5)]">
          {/* Corner anchor handles */}
          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-[#60A5FA] border border-white rounded-xs" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#60A5FA] border border-white rounded-xs" />
          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-[#60A5FA] border border-white rounded-xs" />
          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#60A5FA] border border-white rounded-xs" />
        </div>

        {/* Floating Quick Action Bar */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#14141E]/95 backdrop-blur-md px-2 py-1 rounded-full border border-[#2D2D40] shadow-xl pointer-events-auto"
        >
          <div className="flex items-center gap-1 px-1 text-[10px] text-[#A0A0B8] font-mono">
            <Move className="w-3 h-3 text-[#60A5FA]" />
            <span>
              {floating.x}, {floating.y}
            </span>
          </div>
          <button
            type="button"
            onClick={onCommit}
            title="Stamp to Canvas (Enter)"
            className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-medium transition-colors cursor-pointer"
          >
            <Check className="w-3 h-3" />
            <span>Stamp</span>
          </button>
          <button
            type="button"
            onClick={onDiscard}
            title="Discard Object (Esc)"
            className="p-1 rounded-full hover:bg-[#252538] text-[#808096] hover:text-[#F87171] transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
