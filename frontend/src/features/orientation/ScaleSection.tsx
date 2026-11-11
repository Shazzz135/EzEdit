import React from 'react'
import { Maximize2, RotateCcw } from 'lucide-react'

export interface ScaleSectionProps {
  width: number
  height: number
  currentWidth: number
  currentHeight: number
  onWidthChange: (w: number) => void
  onHeightChange: (h: number) => void
  onResetScale: () => void
  onCommitScale?: () => void
  isProcessing?: boolean
}

export const ScaleSection: React.FC<ScaleSectionProps> = ({
  width,
  height,
  onWidthChange,
  onHeightChange,
  onResetScale,
  onCommitScale,
  isProcessing,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Strong Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#222230]">
        <div className="flex items-center gap-2">
          <Maximize2 className="w-4 h-4 text-[#60A5FA]" />
          <span className="text-xs font-bold text-[#E0E0EC] uppercase tracking-wider">
            Scale(px)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isProcessing && (
            <span className="text-[10px] text-[#60A5FA] font-mono animate-pulse">
              Scaling...
            </span>
          )}
          <button
            type="button"
            onClick={onResetScale}
            title="Reset Scale"
            className="text-[11px] text-[#808096] hover:text-[#D0D0E0] flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-[#60A5FA]" />
            <span>Reset</span>
          </button>
        </div>
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
            onKeyDown={(e) => e.key === 'Enter' && onCommitScale?.()}
            onBlur={() => onCommitScale?.()}
            className="w-full bg-[#12121C] border border-[#2A2A3C] focus:border-[#4B88E8] text-[#E0E0EC] font-mono text-xs px-2.5 py-1.5 rounded-lg outline-none"
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
            onKeyDown={(e) => e.key === 'Enter' && onCommitScale?.()}
            onBlur={() => onCommitScale?.()}
            className="w-full bg-[#12121C] border border-[#2A2A3C] focus:border-[#4B88E8] text-[#E0E0EC] font-mono text-xs px-2.5 py-1.5 rounded-lg outline-none"
          />
        </div>
      </div>
    </div>
  )
}
