import React, { useRef, useState } from 'react'
import { RotateCw } from 'lucide-react'

export interface RotateHandleProps {
  rotationAngle: number
  onRotateChange: (angle: number) => void
  onDragStateChange?: (isDragging: boolean) => void
}

export const RotateHandle: React.FC<RotateHandleProps> = ({
  rotationAngle,
  onRotateChange,
  onDragStateChange,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    e.preventDefault()
    setIsDragging(true)
    onDragStateChange?.(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging || !containerRef.current) return
    e.stopPropagation()
    e.preventDefault()

    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const dx = e.clientX - centerX
    const dy = e.clientY - centerY
    const rad = Math.atan2(dy, dx)
    let deg = Math.round((rad * 180) / Math.PI + 90)
    if (deg < 0) deg += 360
    deg = deg % 360

    onRotateChange(deg)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isDragging) {
      setIsDragging(false)
      onDragStateChange?.(false)
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // pointer capture release fallback
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none select-none"
    >
      {/* Rotating Dial Stem & Handle */}
      <div
        style={{
          transform: `rotate(${rotationAngle}deg)`,
          transformOrigin: 'center center',
        }}
        className="absolute inset-0 flex flex-col items-center"
      >
        {/* Grab Handle positioned above top edge starting at 0° */}
        <div className="absolute top-0 -translate-y-full flex flex-col items-center pointer-events-auto pb-1">
          {/* Degree Tooltip Badge */}
          <div className="px-1.5 py-0.5 mb-1 bg-[#12121E]/95 border border-[#2B2B3E] rounded-md text-[10px] font-mono font-bold text-[#60A5FA] shadow-lg">
            {Math.round(rotationAngle)}°
          </div>

          {/* Grab Button */}
          <button
            type="button"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            title="Drag to rotate photo (0° - 360°)"
            className={`w-7 h-7 rounded-full bg-[#12121E] border-2 border-[#3B82F6] hover:bg-[#1E293B] shadow-lg shadow-[#3B82F6]/30 flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform ${
              isDragging ? 'scale-110 ring-2 ring-[#60A5FA]/50 cursor-grabbing' : ''
            }`}
          >
            <RotateCw className="w-3.5 h-3.5 text-[#60A5FA]" />
          </button>

          {/* Connecting Stem Line to Image Top Edge */}
          <div className="w-0.5 h-6 bg-[#3B82F6]/70 mt-1" />
        </div>
      </div>
    </div>
  )
}
