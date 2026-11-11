import React from 'react'
import { Maximize2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface ScaleSectionProps {
  width: number
  height: number
  currentWidth: number
  currentHeight: number
  onWidthChange: (w: number) => void
  onHeightChange: (h: number) => void
  onApplyScale: () => void
  onResetScale: () => void
  isProcessing?: boolean
}

export const ScaleSection: React.FC<ScaleSectionProps> = ({
  width,
  height,
  currentWidth,
  currentHeight,
  onWidthChange,
  onHeightChange,
  onApplyScale,
  onResetScale,
  isProcessing,
}) => {
  const isChanged = width !== currentWidth || height !== currentHeight

  return (
    <div className="flex flex-col gap-3 p-3.5 bg-[#161622] rounded-xl border border-[#252536] shadow-sm">
      {/* Strong Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#232332]">
        <div className="flex items-center gap-2">
          <Maximize2 className="w-4 h-4 text-[#60A5FA]" />
          <span className="text-xs font-bold text-[#E0E0EC] uppercase tracking-wider">
            Scale(px)
          </span>
        </div>
        {isChanged && (
          <button
            type="button"
            onClick={onResetScale}
            className="text-[11px] text-[#707086] hover:text-[#D0D0E0] flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-[#60A5FA]" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Width Input */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-[#808096] uppercase font-mono">
            Width (px)
          </label>
          <input
            type="number"
            min={1}
            max={8192}
            value={width || ''}
            onChange={(e) => onWidthChange(parseInt(e.target.value, 10) || 1)}
            className="w-full bg-[#101018] border border-[#2A2A3C] focus:border-[#4B88E8] text-[#E0E0EC] font-mono text-xs px-2.5 py-1.5 rounded-lg outline-none"
          />
        </div>

        {/* Height Input */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-[#808096] uppercase font-mono">
            Height (px)
          </label>
          <input
            type="number"
            min={1}
            max={8192}
            value={height || ''}
            onChange={(e) => onHeightChange(parseInt(e.target.value, 10) || 1)}
            className="w-full bg-[#101018] border border-[#2A2A3C] focus:border-[#4B88E8] text-[#E0E0EC] font-mono text-xs px-2.5 py-1.5 rounded-lg outline-none"
          />
        </div>
      </div>

      <div className="border-t border-[#232332]" />

      <Button
        variant="primary"
        onClick={onApplyScale}
        disabled={!isChanged || isProcessing}
        className="w-full py-1.5 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8]"
      >
        {isProcessing ? 'Scaling...' : 'Apply Scale'}
      </Button>
    </div>
  )
}
