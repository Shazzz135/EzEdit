import React, { useEffect } from 'react'
import { Crop, Check, X, RotateCcw } from 'lucide-react'
import { type AspectRatio, type CropRect } from '@/types/crop'
import { Button } from '@/components/ui/Button'

export interface CropSectionProps {
  isCropActive: boolean
  cropRect: CropRect | null
  aspectRatio: AspectRatio
  onSelectRatio: (ratio: AspectRatio) => void
  onApplyCrop: () => void
  onCancelCrop: () => void
  onResetCrop?: () => void
}

const RATIO_OPTIONS: { id: AspectRatio; label: string }[] = [
  { id: 'free', label: 'Free' },
  { id: '1:1', label: '1:1' },
  { id: '16:9', label: '16:9' },
  { id: '4:3', label: '4:3' },
  { id: '9:16', label: '9:16' },
  { id: '3:2', label: '3:2' },
]

export const CropSection: React.FC<CropSectionProps> = ({
  isCropActive,
  cropRect,
  aspectRatio,
  onSelectRatio,
  onApplyCrop,
  onCancelCrop,
  onResetCrop,
}) => {
  useEffect(() => {
    if (!isCropActive) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onApplyCrop()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onCancelCrop()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCropActive, onApplyCrop, onCancelCrop])

  return (
    <div className="flex flex-col gap-2.5 p-3 bg-[#171722] rounded-xl border border-[#242434]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Crop className="w-3.5 h-3.5 text-[#60A5FA]" />
          <span className="text-xs font-semibold text-[#A0A0B2] uppercase tracking-wider">
            Crop
          </span>
        </div>
        {isCropActive && onResetCrop && (
          <button
            type="button"
            onClick={onResetCrop}
            title="Reset to Full Image"
            className="text-[11px] text-[#707086] hover:text-[#D0D0E0] flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-[#60A5FA]" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Aspect Ratio Options Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {RATIO_OPTIONS.map((opt) => {
          const isSelected = isCropActive && aspectRatio === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectRatio(opt.id)}
              className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-all cursor-pointer text-center ${
                isSelected
                  ? 'bg-[#2563EB]/25 border-[#3B82F6] text-[#60A5FA] font-semibold'
                  : 'bg-[#12121A] border-[#242434] text-[#A0A0B2] hover:bg-[#1C1C28] hover:text-[#E0E0EC]'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Active Crop Controls & Readout */}
      {isCropActive && (
        <div className="flex flex-col gap-2 pt-1 border-t border-[#222232]">
          {cropRect && (
            <div className="text-[11px] text-[#707080] font-mono text-center">
              Selected: <span className="text-[#A0A0B8]">{Math.round(cropRect.width)} × {Math.round(cropRect.height)} px</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelCrop}
              className="flex-1 text-xs py-1.5 flex items-center justify-center gap-1"
            >
              <X className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span>Cancel</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onApplyCrop}
              className="flex-1 text-xs py-1.5 flex items-center justify-center gap-1 bg-[#2563EB] hover:bg-[#1D4ED8]"
            >
              <Check className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span>Apply</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
