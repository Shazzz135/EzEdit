import React from 'react'
import { Wand2, RotateCcw, Columns, Eye, Sliders } from 'lucide-react'
import { PrecisionSlider } from '@/components/ui/PrecisionSlider'
import { FILTER_PRESETS } from './filterPresets'
import { type FilterState, type PresetFilterType } from '@/types/document'

export interface FiltersPanelProps {
  filter: FilterState
  onChangeFilter: (partial: Partial<FilterState>) => void
  onResetFilter: () => void
  splitActive: boolean
  onToggleSplit: () => void
  splitPosition: number
  onChangeSplitPosition: (pos: number) => void
  onHoldCompareStart: () => void
  onHoldCompareEnd: () => void
  isHoldComparing: boolean
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
  filter,
  onChangeFilter,
  onResetFilter,
  splitActive,
  onToggleSplit,
  splitPosition,
  onChangeSplitPosition,
  onHoldCompareStart,
  onHoldCompareEnd,
  isHoldComparing,
}) => {
  return (
    <div className="flex flex-col gap-3 pb-4 select-none">
      {/* Top Header with Reset */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#222230]">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-[#60A5FA]" />
          <span className="text-xs font-bold text-[#E0E0EC] uppercase tracking-wider">
            Preset Filters
          </span>
        </div>
        <button
          type="button"
          onClick={onResetFilter}
          title="Reset Filter to None"
          className="text-[11px] text-[#808096] hover:text-[#D0D0E0] flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3 text-[#60A5FA]" />
          <span>Reset Filter</span>
        </button>
      </div>

      {/* Preset Filters Grid */}
      <div className="grid grid-cols-3 gap-2">
        {FILTER_PRESETS.map((preset) => {
          const isSelected = filter.preset === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChangeFilter({ preset: preset.id as PresetFilterType })}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all text-left cursor-pointer border ${
                isSelected
                  ? 'border-[#60A5FA] bg-[#1E1E2C]'
                  : 'border-[#262636] bg-[#161622]/60 hover:bg-[#1A1A28] hover:border-[#38384C]'
              }`}
            >
              {/* Preview Swatch */}
              <div
                className={`w-full h-8 rounded-md bg-gradient-to-br ${preset.previewGradient} shadow-inner flex items-center justify-center`}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-white shadow-sm ring-2 ring-[#60A5FA]" />
                )}
              </div>
              <span
                className={`text-[11px] font-medium truncate w-full text-center ${
                  isSelected ? 'text-[#F4F4F6] font-semibold' : 'text-[#A0A0B2]'
                }`}
              >
                {preset.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filter Intensity Slider (active when preset != 'none') */}
      {filter.preset !== 'none' && (
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center gap-2 pb-1 border-b border-[#222230]">
            <Sliders className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span className="text-xs font-semibold text-[#D0D0DC]">Intensity</span>
          </div>
          <PrecisionSlider
            label="Strength"
            value={filter.intensity}
            onChange={(v) => onChangeFilter({ intensity: v })}
            min={0}
            max={100}
            step={1}
            defaultValue={100}
            unit="%"
          />
        </div>
      )}

      {/* Bold Separator */}
      <div className="h-[2px] bg-[#323246] w-full rounded-full my-0.5" />

      {/* Compare Tools Header */}
      <div className="flex items-center gap-2 pb-1 border-b border-[#222230]">
        <Columns className="w-4 h-4 text-[#60A5FA]" />
        <span className="text-xs font-bold text-[#E0E0EC] uppercase tracking-wider">
          Compare Mode
        </span>
      </div>

      {/* Split Compare & Hold to Compare Controls */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSplit}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              splitActive
                ? 'border-[#60A5FA] bg-[#1E1E2C] text-[#F4F4F6]'
                : 'border-[#28283A] bg-[#161622]/60 hover:bg-[#1A1A28] text-[#A0A0B4]'
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>{splitActive ? 'Disable Split' : 'Split Compare'}</span>
          </button>

          <button
            type="button"
            onPointerDown={onHoldCompareStart}
            onPointerUp={onHoldCompareEnd}
            onPointerLeave={onHoldCompareEnd}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer touch-none ${
              isHoldComparing
                ? 'border-[#60A5FA] bg-[#1E1E2C] text-[#60A5FA]'
                : 'border-[#28283A] bg-[#161622]/60 hover:bg-[#1A1A28] text-[#A0A0B4]'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>{isHoldComparing ? 'Original Active' : 'Hold to Compare'}</span>
          </button>
        </div>

        {/* Split slider position control when split is active */}
        {splitActive && (
          <div className="pt-1">
            <PrecisionSlider
              label="Split Position"
              value={Math.round(splitPosition * 100)}
              onChange={(v) => onChangeSplitPosition(v / 100)}
              min={1}
              max={99}
              step={1}
              defaultValue={50}
              unit="%"
            />
          </div>
        )}

        <p className="text-[11px] text-[#707086] leading-relaxed">
          Tip: Hold <span className="font-mono text-[#A0A0B8]">Hold to Compare</span> or press <span className="font-mono text-[#A0A0B8]">\</span> to preview the raw unedited original.
        </p>
      </div>
    </div>
  )
}
