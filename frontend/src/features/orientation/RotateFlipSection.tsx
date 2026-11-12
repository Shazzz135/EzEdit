import React from 'react'
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
} from 'lucide-react'

export interface RotateFlipSectionProps {
  rotationAngle: number
  flipH?: boolean
  flipV?: boolean
  onRotateChange: (angle: number) => void
  onResetRotation: () => void
  onFlip: (direction: 'horizontal' | 'vertical') => void
  isProcessing?: boolean
}

export const RotateFlipSection: React.FC<RotateFlipSectionProps> = ({
  rotationAngle,
  flipH = false,
  flipV = false,
  onRotateChange,
  onResetRotation,
  onFlip,
  isProcessing,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Strong Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#222230]">
        <div className="flex items-center gap-2">
          <RotateCw className="w-4 h-4 text-[#60A5FA]" />
          <span className="text-xs font-bold text-[#E0E0EC] uppercase tracking-wider">
            Rotate &amp; Flip
          </span>
        </div>
        <button
          type="button"
          onClick={onResetRotation}
          title="Reset Rotation & Flip"
          className="text-[11px] text-[#808096] hover:text-[#D0D0E0] flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3 text-[#60A5FA]" />
          <span>Reset</span>
        </button>
      </div>

      {/* Rotation Slider & Degree Input (0° - 360°) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-[10px] text-[#808096]">
          <span>ROTATION ANGLE</span>
          <span className="font-mono text-[#60A5FA] font-semibold">
            {Math.round(rotationAngle)}°
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={rotationAngle}
            onChange={(e) => onRotateChange(Number(e.target.value))}
            className="w-full accent-[#3B82F6] cursor-pointer h-1.5 bg-[#20202E] rounded-lg"
          />
          <input
            type="number"
            min={0}
            max={360}
            value={Math.round(rotationAngle)}
            onChange={(e) =>
              onRotateChange(
                Math.min(360, Math.max(0, Number(e.target.value) || 0))
              )
            }
            className="w-16 bg-[#12121C] border border-[#2A2A3C] text-right font-mono text-xs px-1.5 py-1 rounded text-[#E0E0EC] outline-none"
          />
        </div>
      </div>

      {/* Separator Line */}
      <div className="border-t border-[#222230]" />

      {/* Flip Sub-Section */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-[#808096] uppercase font-mono">
          Mirror Invert
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onFlip('horizontal')}
            disabled={isProcessing}
            title="Flip Horizontal (Mirror)"
            className={`flex items-center justify-center p-2 rounded-lg border text-[11px] gap-1.5 transition-all cursor-pointer ${
              flipH
                ? 'bg-[#1E1E2E] border-[#60A5FA] text-[#F4F4F6] font-semibold'
                : 'bg-[#14141E] hover:bg-[#1C1C28] border-[#242434] hover:border-[#3A3A4E] text-[#D0D0DC]'
            }`}
          >
            <FlipHorizontal className="w-4 h-4 text-[#60A5FA]" />
            <span>Flip H {flipH ? '(On)' : ''}</span>
          </button>
          <button
            type="button"
            onClick={() => onFlip('vertical')}
            disabled={isProcessing}
            title="Flip Vertical"
            className={`flex items-center justify-center p-2 rounded-lg border text-[11px] gap-1.5 transition-all cursor-pointer ${
              flipV
                ? 'bg-[#1E1E2E] border-[#60A5FA] text-[#F4F4F6] font-semibold'
                : 'bg-[#14141E] hover:bg-[#1C1C28] border-[#242434] hover:border-[#3A3A4E] text-[#D0D0DC]'
            }`}
          >
            <FlipVertical className="w-4 h-4 text-[#60A5FA]" />
            <span>Flip V {flipV ? '(On)' : ''}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
