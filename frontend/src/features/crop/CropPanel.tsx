import React, { useEffect } from 'react'
import { type AspectRatio, type CropRect } from '@/types/crop'
import { Button } from '@/components/ui/Button'
import { Crop, Check, X, RotateCcw } from 'lucide-react'

export interface CropPanelProps {
  isCropActive: boolean
  cropRect: CropRect | null
  aspectRatio: AspectRatio
  onStartCrop: () => void
  onSelectRatio: (ratio: AspectRatio) => void
  onApplyCrop: () => void
  onCancelCrop: () => void
  onResetCrop?: () => void
}

const RATIO_OPTIONS: { id: AspectRatio; label: string }[] = [
  { id: 'free', label: 'Free' },
  { id: 'original', label: 'Original' },
  { id: '1:1', label: '1:1 Square' },
  { id: '16:9', label: '16:9 Wide' },
  { id: '4:3', label: '4:3 Classic' },
  { id: '9:16', label: '9:16 Story' },
  { id: '3:2', label: '3:2 Photo' },
]

export const CropPanel: React.FC<CropPanelProps> = ({
  isCropActive,
  cropRect,
  aspectRatio,
  onStartCrop,
  onSelectRatio,
  onApplyCrop,
  onCancelCrop,
  onResetCrop,
}) => {
  // Keyboard shortcuts: Enter to Apply, Escape to Cancel
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

  if (!isCropActive) {
    return (
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider">
          Crop & Aspect Ratio
        </h4>
        <p className="text-xs text-[#808090]">
          Interactively crop image with rule-of-thirds grid and aspect ratio constraints.
        </p>
        <Button
          variant="primary"
          onClick={onStartCrop}
          className="w-full flex items-center justify-center gap-2"
        >
          <Crop className="w-4 h-4" />
          <span>Crop Image</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider">
          Aspect Ratio
        </h4>
        {onResetCrop && (
          <button
            type="button"
            onClick={onResetCrop}
            title="Reset Crop to Full Image"
            className="text-xs text-[#808096] hover:text-[#E0E0EC] flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Aspect Ratio Buttons Grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {RATIO_OPTIONS.map((opt) => {
          const isSelected = aspectRatio === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectRatio(opt.id)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded border transition-colors cursor-pointer text-left ${
                isSelected
                  ? 'bg-[#2563EB]/20 border-[#3B82F6] text-[#60A5FA]'
                  : 'bg-[#181822] border-[#242434] text-[#A0A0B2] hover:bg-[#20202E] hover:text-[#E0E0EC]'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Dimension Readout */}
      {cropRect && (
        <div className="p-2.5 bg-[#14141E] border border-[#222230] rounded flex flex-col gap-1">
          <span className="text-[11px] text-[#707080]">Cropped Resolution</span>
          <span className="text-xs font-mono font-semibold text-[#E0E0EC]">
            {Math.round(cropRect.width)} × {Math.round(cropRect.height)} px
          </span>
        </div>
      )}

      {/* Action Buttons: Apply & Cancel */}
      <div className="flex items-center gap-2 pt-2 border-t border-[#20202E]">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancelCrop}
          className="flex-1 flex items-center justify-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onApplyCrop}
          className="flex-1 flex items-center justify-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8]"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Apply</span>
        </Button>
      </div>
    </div>
  )
}
