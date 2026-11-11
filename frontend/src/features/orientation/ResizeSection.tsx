import React from 'react'
import { Lock, Unlock, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface ResizeSectionProps {
  width: number
  height: number
  lockAspectRatio: boolean
  currentWidth: number
  currentHeight: number
  onWidthChange: (w: number) => void
  onHeightChange: (h: number) => void
  onToggleLock: () => void
  onApplyResize: () => void
  onResetResize: () => void
  isProcessing?: boolean
}

export const ResizeSection: React.FC<ResizeSectionProps> = ({
  width,
  height,
  lockAspectRatio,
  currentWidth,
  currentHeight,
  onWidthChange,
  onHeightChange,
  onToggleLock,
  onApplyResize,
  onResetResize,
  isProcessing,
}) => {
  const isChanged = width !== currentWidth || height !== currentHeight

  return (
    <div className="flex flex-col gap-2.5 p-3 bg-[#171722] rounded-xl border border-[#242434]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#A0A0B2] uppercase tracking-wider">
          Canvas Resize
        </span>
        {isChanged && (
          <button
            type="button"
            onClick={onResetResize}
            className="text-[11px] text-[#707086] hover:text-[#D0D0E0] flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Width Input */}
        <div className="flex-1 flex flex-col gap-1">
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

        {/* Lock Aspect Ratio Toggle */}
        <div className="flex flex-col items-center justify-end pb-0.5">
          <button
            type="button"
            onClick={onToggleLock}
            title={lockAspectRatio ? 'Aspect Ratio Locked' : 'Aspect Ratio Unlocked'}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              lockAspectRatio
                ? 'bg-[#2563EB]/20 border-[#3B82F6]/50 text-[#60A5FA]'
                : 'bg-[#14141E] border-[#2A2A3A] text-[#707080] hover:text-[#A0A0B0]'
            }`}
          >
            {lockAspectRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Height Input */}
        <div className="flex-1 flex flex-col gap-1">
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

      <Button
        variant="primary"
        onClick={onApplyResize}
        disabled={!isChanged || isProcessing}
        className="w-full mt-1 py-1.5 text-xs font-semibold"
      >
        {isProcessing ? 'Resizing...' : 'Apply Resize'}
      </Button>
    </div>
  )
}
