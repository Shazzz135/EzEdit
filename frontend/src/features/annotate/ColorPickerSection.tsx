import React from 'react'
import { PRESET_SWATCHES } from './types'
import { PrecisionSlider } from '@/components/ui/PrecisionSlider'

export interface ColorPickerSectionProps {
  label?: string
  color: string
  onChangeColor: (hex: string) => void
  secondaryLabel?: string
  secondaryColor?: string
  onChangeSecondaryColor?: (hex: string) => void
  opacity: number
  onChangeOpacity: (val: number) => void
}

interface SwatchBlockProps {
  label: string
  currentColor: string
  onChange: (hex: string) => void
}

const SwatchBlock: React.FC<SwatchBlockProps> = ({ label, currentColor, onChange }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-medium text-[#A0A0B4]">{label}</span>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="color"
          value={currentColor}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="w-4 h-4 rounded border border-[#343446] bg-transparent cursor-pointer"
        />
        <span className="font-mono text-[10px] text-[#C0C0D0]">{currentColor.toUpperCase()}</span>
      </label>
    </div>

    <div className="grid grid-cols-6 gap-1.5">
      {PRESET_SWATCHES.map((sw) => {
        const active = currentColor.toUpperCase() === sw.hex.toUpperCase()
        return (
          <button
            key={sw.hex}
            type="button"
            title={sw.label}
            onClick={() => onChange(sw.hex)}
            style={{ backgroundColor: sw.hex }}
            className={`h-5 rounded border transition-transform cursor-pointer ${
              active ? 'border-[#60A5FA] ring-2 ring-[#60A5FA]/50 scale-105' : 'border-[#2E2E3E] hover:scale-105'
            }`}
          />
        )
      })}
    </div>
  </div>
)

export const ColorPickerSection: React.FC<ColorPickerSectionProps> = ({
  label = 'Stroke / Brush Color',
  color,
  onChangeColor,
  secondaryLabel,
  secondaryColor,
  onChangeSecondaryColor,
  opacity,
  onChangeOpacity,
}) => {
  return (
    <div className="space-y-3 p-2.5 rounded-lg bg-[#14141C] border border-[#242432]">
      {/* 1. Primary / Stroke Color Menu */}
      <SwatchBlock label={label} currentColor={color} onChange={onChangeColor} />

      {/* 2. Secondary / Fill Color Menu (Same menu as stroke color) */}
      {secondaryLabel && secondaryColor && onChangeSecondaryColor && (
        <div className="pt-2 border-t border-[#222230]">
          <SwatchBlock label={secondaryLabel} currentColor={secondaryColor} onChange={onChangeSecondaryColor} />
        </div>
      )}

      {/* 3. Opacity Slider */}
      <div className="pt-1 border-t border-[#222230]">
        <PrecisionSlider
          label="Opacity"
          value={opacity}
          min={10}
          max={100}
          step={1}
          defaultValue={100}
          unit="%"
          onChange={(v) => onChangeOpacity(Math.round(v))}
        />
      </div>
    </div>
  )
}
