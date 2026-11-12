import React from 'react'
import { SlidersHorizontal, RotateCcw } from 'lucide-react'

export interface StretchSectionProps {
  scaleX: number
  scaleY: number
  currentWidth: number
  currentHeight: number
  onScaleXChange: (val: number) => void
  onScaleYChange: (val: number) => void
  onResetStretch: () => void
}

export const StretchSection: React.FC<StretchSectionProps> = ({
  scaleX,
  scaleY,
  currentWidth,
  currentHeight,
  onScaleXChange,
  onScaleYChange,
  onResetStretch,
}) => {
  const projectedW = Math.max(1, Math.round(currentWidth * (scaleX / 100)))
  const projectedH = Math.max(1, Math.round(currentHeight * (scaleY / 100)))

  return (
    <div className="flex flex-col gap-3 pb-2">
      {/* Strong Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#222230]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#60A5FA]" />
          <span className="text-xs font-bold text-[#E0E0EC] uppercase tracking-wider">
            Stretch
          </span>
        </div>
        <button
          type="button"
          onClick={onResetStretch}
          title="Reset Stretch to 100%"
          className="text-[11px] text-[#808096] hover:text-[#D0D0E0] flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3 text-[#60A5FA]" />
          <span>Reset</span>
        </button>
      </div>

      {/* Stretch X */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-[10px] text-[#808096]">
          <span>SCALE X</span>
          <span className="font-mono text-[#60A5FA] font-semibold">{Math.round(scaleX)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={10}
            max={300}
            step={1}
            value={Math.round(scaleX)}
            onChange={(e) => onScaleXChange(Number(e.target.value))}
            className="w-full accent-[#3B82F6] cursor-pointer h-1.5 bg-[#20202E] rounded-lg"
          />
          <input
            type="number"
            min={10}
            max={500}
            value={Math.round(scaleX)}
            onChange={(e) => onScaleXChange(Math.max(10, Math.min(500, Number(e.target.value) || 100)))}
            className="w-16 bg-[#12121C] border border-[#2A2A3C] text-right font-mono text-xs px-1.5 py-1 rounded text-[#E0E0EC] outline-none"
          />
        </div>
      </div>

      {/* Stretch Y */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-[10px] text-[#808096]">
          <span>SCALE Y</span>
          <span className="font-mono text-[#60A5FA] font-semibold">{Math.round(scaleY)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={10}
            max={300}
            step={1}
            value={Math.round(scaleY)}
            onChange={(e) => onScaleYChange(Number(e.target.value))}
            className="w-full accent-[#3B82F6] cursor-pointer h-1.5 bg-[#20202E] rounded-lg"
          />
          <input
            type="number"
            min={10}
            max={500}
            value={Math.round(scaleY)}
            onChange={(e) => onScaleYChange(Math.max(10, Math.min(500, Number(e.target.value) || 100)))}
            className="w-16 bg-[#12121C] border border-[#2A2A3C] text-right font-mono text-xs px-1.5 py-1 rounded text-[#E0E0EC] outline-none"
          />
        </div>
      </div>

      <div className="border-t border-[#222230]" />

      {/* Target Preview Readout */}
      <div className="text-[11px] text-[#707080] font-mono text-center">
        Effective Size: <span className="text-[#A0A0B8] font-semibold">{projectedW} &times; {projectedH} px</span>
      </div>
    </div>
  )
}
