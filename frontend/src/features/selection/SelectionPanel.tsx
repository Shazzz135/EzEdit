import React from 'react'
import {
  Square,
  Circle,
  Lasso,
  Pentagon,
  RotateCcw,
  Scissors,
  Copy,
  FlipHorizontal,
  X,
} from 'lucide-react'
import { PrecisionSlider } from '@/components/ui/PrecisionSlider'
import {
  type SelectionState,
  type SelectionToolType,
} from '@/types/selection'

export interface SelectionPanelProps {
  state: SelectionState
  onSelectTool: (tool: SelectionToolType) => void
  onChangeFeather: (feather: number) => void
  onToggleInvert: () => void
  onClearSelection: () => void
  onCopySelection: () => void
  onCutSelection: () => void
}

const TOOLS: { id: SelectionToolType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'rect-marquee', label: 'Rectangle', icon: Square },
  { id: 'ellipse-marquee', label: 'Ellipse', icon: Circle },
  { id: 'lasso', label: 'Lasso', icon: Lasso },
  { id: 'poly-lasso', label: 'Poly Lasso', icon: Pentagon },
]

export const SelectionPanel: React.FC<SelectionPanelProps> = ({
  state,
  onSelectTool,
  onChangeFeather,
  onToggleInvert,
  onClearSelection,
  onCopySelection,
  onCutSelection,
}) => {
  return (
    <div className="flex flex-col gap-3 pb-4 select-none">
      {/* Top Header with Reset / Deselect */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#222230]">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-[#60A5FA]" />
          <span className="text-xs font-bold text-[#E0E0EC] uppercase tracking-wider">
            Vector Selection
          </span>
        </div>
        <button
          type="button"
          onClick={onClearSelection}
          title="Clear Selection (Esc / Ctrl+Shift+D / Right-Click)"
          className="text-[11px] text-[#808096] hover:text-[#D0D0E0] flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3 text-[#60A5FA]" />
          <span>Deselect</span>
        </button>
      </div>

      {/* Tool Selector Grid */}
      <div className="grid grid-cols-2 gap-2">
        {TOOLS.map((t) => {
          const Icon = t.icon
          const isSelected = state.tool === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTool(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isSelected
                  ? 'border-[#60A5FA] bg-[#1E1E2C] text-[#F4F4F6]'
                  : 'border-[#262636] bg-[#161622]/60 hover:bg-[#1A1A28] text-[#A0A0B2]'
              }`}
            >
              <Icon className="w-4 h-4 text-[#60A5FA]" />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Bold Separator */}
      <div className="h-[2px] bg-[#323246] w-full rounded-full my-0.5" />

      {/* Feather Radius Slider */}
      <div className="flex flex-col gap-2 pt-1">
        <PrecisionSlider
          label="Feather"
          value={state.feather}
          onChange={onChangeFeather}
          min={0}
          max={50}
          step={1}
          defaultValue={0}
          unit=" px"
        />
      </div>

      {/* Bold Separator */}
      <div className="h-[2px] bg-[#323246] w-full rounded-full my-0.5" />

      {/* Selection Operations */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCopySelection}
            disabled={!state.hasSelection}
            title="Copy selection to clipboard (Ctrl+C)"
            className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border border-[#28283A] bg-[#161622]/60 hover:bg-[#1A1A28] text-xs font-medium text-[#F4F4F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>Copy</span>
          </button>
          <button
            type="button"
            onClick={onCutSelection}
            disabled={!state.hasSelection}
            title="Cut selection from document (Ctrl+X)"
            className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border border-[#28283A] bg-[#161622]/60 hover:bg-[#1A1A28] text-xs font-medium text-[#F4F4F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Scissors className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>Cut</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleInvert}
          disabled={!state.hasSelection}
          className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            state.inverted
              ? 'border-[#60A5FA] bg-[#1E1E2C] text-[#60A5FA]'
              : 'border-[#262636] bg-[#161622]/60 hover:bg-[#1A1A28] text-[#C0C0D0]'
          }`}
        >
          <div className="flex items-center gap-2">
            <FlipHorizontal className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>Invert Selection</span>
          </div>
          <span className="text-[10px] font-mono">
            {state.inverted ? 'Inverted' : 'Normal'}
          </span>
        </button>

        <button
          type="button"
          onClick={onClearSelection}
          disabled={!state.hasSelection}
          className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-[#28283A] bg-[#161622]/40 hover:bg-[#1A1A28] text-xs text-[#808096] hover:text-[#D0D0E0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5 text-[#60A5FA]" />
          <span>Deselect (Esc / Ctrl+Shift+D)</span>
        </button>
      </div>
    </div>
  )
}
