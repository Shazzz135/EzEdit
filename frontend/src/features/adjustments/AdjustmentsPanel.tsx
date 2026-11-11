import React from 'react'
import { Sun, Palette, Sparkles, RotateCcw } from 'lucide-react'
import { PrecisionSlider } from '@/components/ui/PrecisionSlider'
import { type AdjustmentValues } from '@/types/document'

export interface AdjustmentsPanelProps {
  adjustments: AdjustmentValues
  onChange: (partial: Partial<AdjustmentValues>) => void
  onResetAll: () => void
}

export const AdjustmentsPanel: React.FC<AdjustmentsPanelProps> = ({
  adjustments,
  onChange,
  onResetAll,
}) => {
  return (
    <div className="flex flex-col gap-3 pb-4">
      {/* Top Header with Reset All */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#222230]">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-[#60A5FA]" />
          <span className="text-xs font-bold text-[#E0E0EC] uppercase tracking-wider">
            Light
          </span>
        </div>
        <button
          type="button"
          onClick={onResetAll}
          title="Reset All 13 Adjustments"
          className="text-[11px] text-[#808096] hover:text-[#D0D0E0] flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3 text-[#60A5FA]" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Light Group */}
      <div className="flex flex-col gap-2">
        <PrecisionSlider
          label="Exposure"
          value={adjustments.exposure}
          onChange={(v) => onChange({ exposure: v })}
          min={-5.0}
          max={5.0}
          step={0.1}
          defaultValue={0.0}
          unit=" EV"
        />
        <PrecisionSlider
          label="Brilliance"
          value={adjustments.brilliance}
          onChange={(v) => onChange({ brilliance: v })}
          min={-100.0}
          max={100.0}
          step={0.1}
          defaultValue={0.0}
        />
        <PrecisionSlider
          label="Highlights"
          value={adjustments.highlights}
          onChange={(v) => onChange({ highlights: v })}
          min={-100.0}
          max={100.0}
          step={0.1}
          defaultValue={0.0}
        />
        <PrecisionSlider
          label="Shadows"
          value={adjustments.shadows}
          onChange={(v) => onChange({ shadows: v })}
          min={-100.0}
          max={100.0}
          step={0.1}
          defaultValue={0.0}
        />
        <PrecisionSlider
          label="Contrast"
          value={adjustments.contrast}
          onChange={(v) => onChange({ contrast: v })}
          min={-100.0}
          max={100.0}
          step={0.1}
          defaultValue={0.0}
        />
        <PrecisionSlider
          label="Brightness"
          value={adjustments.brightness}
          onChange={(v) => onChange({ brightness: v })}
          min={-100.0}
          max={100.0}
          step={0.1}
          defaultValue={0.0}
        />
      </div>

      {/* Bold Separator */}
      <div className="h-[2px] bg-[#323246] w-full rounded-full my-0.5" />

      {/* Color Group */}
      <div className="flex items-center gap-2 pb-1.5 border-b border-[#222230]">
        <Palette className="w-4 h-4 text-[#60A5FA]" />
        <span className="text-xs font-bold text-[#E0E0EC] uppercase tracking-wider">
          Color
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <PrecisionSlider
          label="Saturation"
          value={adjustments.saturation}
          onChange={(v) => onChange({ saturation: v })}
          min={-100.0}
          max={100.0}
          step={0.1}
          defaultValue={0.0}
        />
        <PrecisionSlider
          label="Vibrance"
          value={adjustments.vibrance}
          onChange={(v) => onChange({ vibrance: v })}
          min={-100.0}
          max={100.0}
          step={0.1}
          defaultValue={0.0}
        />
        <PrecisionSlider
          label="Warmth"
          value={adjustments.warmth}
          onChange={(v) => onChange({ warmth: v })}
          min={-100.0}
          max={100.0}
          step={0.1}
          defaultValue={0.0}
        />
        <PrecisionSlider
          label="Tint"
          value={adjustments.tint}
          onChange={(v) => onChange({ tint: v })}
          min={-100.0}
          max={100.0}
          step={0.1}
          defaultValue={0.0}
        />
      </div>

      {/* Bold Separator */}
      <div className="h-[2px] bg-[#323246] w-full rounded-full my-0.5" />

      {/* Detail Group */}
      <div className="flex items-center gap-2 pb-1.5 border-b border-[#222230]">
        <Sparkles className="w-4 h-4 text-[#60A5FA]" />
        <span className="text-xs font-bold text-[#E0E0EC] uppercase tracking-wider">
          Detail
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <PrecisionSlider
          label="Sharpness"
          value={adjustments.sharpness}
          onChange={(v) => onChange({ sharpness: v })}
          min={0.0}
          max={100.0}
          step={0.1}
          defaultValue={0.0}
        />
        <PrecisionSlider
          label="Definition"
          value={adjustments.definition}
          onChange={(v) => onChange({ definition: v })}
          min={0.0}
          max={100.0}
          step={0.1}
          defaultValue={0.0}
        />
        <PrecisionSlider
          label="Noise Reduction"
          value={adjustments.noise}
          onChange={(v) => onChange({ noise: v })}
          min={0.0}
          max={100.0}
          step={0.1}
          defaultValue={0.0}
        />
      </div>
    </div>
  )
}
