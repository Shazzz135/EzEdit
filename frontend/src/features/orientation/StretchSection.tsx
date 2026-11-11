import React from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface StretchSectionProps {
  scaleX: number
  scaleY: number
  currentWidth: number
  currentHeight: number
  onScaleXChange: (val: number) => void
  onScaleYChange: (val: number) => void
  onApplyStretch: () => void
  onResetStretch: () => void
  isProcessing?: boolean
}

export const StretchSection: React.FC<StretchSectionProps> = ({
  scaleX,
  scaleY,
  currentWidth,
  currentHeight,
  onScaleXChange,
  onScaleYChange,
  onApplyStretch,
  onResetStretch,
  isProcessing,
}) => {
  const isChanged = scaleX !== 100 || scaleY !== 100
  const projectedW = Math.max(1, Math.round(currentWidth * (scaleX / 100)))
  const projectedH = Math.max(1, Math.round(currentHeight * (scaleY / 100)))

  return (
    <div className="flex flex-col gap-2.5 p-3 bg-[#171722] rounded-xl border border-[#242434]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#A0A0B2] uppercase tracking-wider">
          Bilinear Stretch
        </span>
        {isChanged && (
          <button
            type="button"
            onClick={onResetStretch}
            className="text-[11px] text-[#707086] hover:text-[#D0D0E0] flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset (100%)</span>
          </button>
        )}
      </div>

      {/* Stretch X */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-[10px] text-[#808096]">
          <span>SCALE X</span>
          <span className="font-mono text-[#E0E0EC]">{scaleX}%</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={10}
            max={300}
            step={1}
            value={scaleX}
            onChange={(e) => onScaleXChange(Number(e.target.value))}
            className="w-full accent-[#3B82F6] cursor-pointer h-1.5 bg-[#252536] rounded-lg"
          />
          <input
            type="number"
            min={10}
            max={500}
            value={scaleX}
            onChange={(e) => onScaleXChange(Math.max(1, Number(e.target.value)))}
            className="w-16 bg-[#101018] border border-[#2A2A3C] text-right font-mono text-xs px-1.5 py-1 rounded text-[#E0E0EC] outline-none"
          />
        </div>
      </div>

      {/* Stretch Y */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-[10px] text-[#808096]">
          <span>SCALE Y</span>
          <span className="font-mono text-[#E0E0EC]">{scaleY}%</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={10}
            max={300}
            step={1}
            value={scaleY}
            onChange={(e) => onScaleYChange(Number(e.target.value))}
            className="w-full accent-[#3B82F6] cursor-pointer h-1.5 bg-[#252536] rounded-lg"
          />
          <input
            type="number"
            min={10}
            max={500}
            value={scaleY}
            onChange={(e) => onScaleYChange(Math.max(1, Number(e.target.value)))}
            className="w-16 bg-[#101018] border border-[#2A2A3C] text-right font-mono text-xs px-1.5 py-1 rounded text-[#E0E0EC] outline-none"
          />
        </div>
      </div>

      {/* Projected Dimension Preview */}
      <div className="text-[11px] text-[#707080] font-mono text-center py-0.5">
        Target: <span className="text-[#A0A0B8]">{projectedW} × {projectedH} px</span>
      </div>

      <Button
        variant="primary"
        onClick={onApplyStretch}
        disabled={!isChanged || isProcessing}
        className="w-full mt-1 py-1.5 text-xs font-semibold"
      >
        {isProcessing ? 'Stretching...' : 'Apply Stretch'}
      </Button>
    </div>
  )
}
