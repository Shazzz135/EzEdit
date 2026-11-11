import React, { useRef, useCallback } from 'react'
import { ChevronsLeftRight } from 'lucide-react'

export interface SplitCompareOverlayProps {
  splitPosition: number // 0.0 to 1.0 (e.g. 0.5)
  onChangeSplitPosition: (newPos: number) => void
  imageWidth: number
  imageHeight: number
}

export const SplitCompareOverlay: React.FC<SplitCompareOverlayProps> = ({
  splitPosition,
  onChangeSplitPosition,
  imageWidth,
  imageHeight,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    isDraggingRef.current = true
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return
    e.stopPropagation()
    const rect = containerRef.current.getBoundingClientRect()
    if (rect.width <= 0) return
    const relativeX = (e.clientX - rect.left) / rect.width
    const clamped = Math.max(0.01, Math.min(0.99, relativeX))
    onChangeSplitPosition(clamped)
  }, [onChangeSplitPosition])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false
      const target = e.currentTarget as HTMLElement
      try {
        target.releasePointerCapture(e.pointerId)
      } catch {
        // ignore if already released
      }
    }
  }, [])

  const splitPercent = Math.max(0, Math.min(100, splitPosition * 100))

  return (
    <div
      ref={containerRef}
      style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}
      className="absolute inset-0 pointer-events-none select-none z-20"
    >
      {/* Draggable Divider Line & Handle */}
      <div
        style={{ left: `${splitPercent}%` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="absolute top-0 bottom-0 w-8 -translate-x-1/2 flex items-center justify-center cursor-ew-resize pointer-events-auto touch-none group"
      >
        {/* Crisp Line */}
        <div className="w-[2px] h-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.8)]" />

        {/* Bottom Grab Handle Focus Point */}
        <div className="absolute bottom-6 w-8 h-8 rounded-full bg-[#1A1A26]/95 border border-white/80 shadow-2xl flex items-center justify-center text-[#60A5FA] group-hover:scale-110 group-active:scale-95 transition-transform backdrop-blur-xs">
          <ChevronsLeftRight className="w-4 h-4" />
        </div>
      </div>

      {/* Badges: Original (Left) vs Edited (Right) */}
      <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-semibold text-white/90 border border-white/20 pointer-events-none uppercase tracking-wider">
        Original
      </div>
      <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-semibold text-[#60A5FA] border border-[#60A5FA]/40 pointer-events-none uppercase tracking-wider">
        Edited
      </div>
    </div>
  )
}
