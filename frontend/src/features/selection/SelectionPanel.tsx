import React from 'react'
import {
  Square,
  Circle,
  Lasso,
  Pentagon,
  Plus,
  Minus,
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
  type SelectionMode,
} from '@/types/selection'

export interface SelectionPanelProps {
  state: SelectionState
  onSelectTool: (tool: SelectionToolType) => void
  onSelectMode: (mode: SelectionMode) => void
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

const MODES: { id: SelectionMode; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'new', label: 'New', icon: Square },
  { id: 'add', label: 'Add (+)', icon: Plus },
  { id: 'subtract', label: 'Subtract (-)', icon: Minus },
]

export const SelectionPanel: React.FC<SelectionPanelProps> = ({
  state,
  onSelectTool,
  onSelectMode,
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
          title="Clear Selection (Esc / Ctrl+D)"
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

      {/* Boolean Mode Selector */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-[#808096] uppercase tracking-wider">
          Selection Mode
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {MODES.map((m) => {
            const Icon = m.icon
            const isSelected = state.mode === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectMode(m.id)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-[#60A5FA] bg-[#1E1E2C] text-[#F4F4F6]'
                    : 'border-[#262636] bg-[#161622]/60 hover:bg-[#1A1A28] text-[#A0A0B2]'
                }`}
              >
                <Icon className="w-3 h-3 text-[#60A5FA]" />
                <span>{m.label}</span>
              </button>
            )
          })}
        </div>
      </div>

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
            title="Copy Selection (Ctrl+C)"
            disabled={!state.hasSelection}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
              state.hasSelection
                ? 'border-[#262636] bg-[#161622]/60 hover:bg-[#1A1A28] text-[#F4F4F6] cursor-pointer'
                : 'border-[#20202A] text-[#505060] cursor-not-allowed opacity-50'
            }`}
          >
            <Copy className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>Copy</span>
            <span className="text-[10px] text-[#707084] font-mono">^C</span>
          </button>

          <button
            type="button"
            onClick={onCutSelection}
            title="Cut Selection (Ctrl+X)"
            disabled={!state.hasSelection}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
              state.hasSelection
                ? 'border-[#262636] bg-[#161622]/60 hover:bg-[#1A1A28] text-[#F4F4F6] cursor-pointer'
                : 'border-[#20202A] text-[#505060] cursor-not-allowed opacity-50'
            }`}
          >
            <Scissors className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>Cut</span>
            <span className="text-[10px] text-[#707084] font-mono">^X</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onToggleInvert}
            title="Invert Selection (Ctrl+I)"
            disabled={!state.hasSelection}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
              state.hasSelection
                ? state.inverted
                  ? 'border-[#60A5FA] bg-[#1E1E2C] text-[#60A5FA] cursor-pointer'
                  : 'border-[#262636] bg-[#161622]/60 hover:bg-[#1A1A28] text-[#F4F4F6] cursor-pointer'
                : 'border-[#20202A] text-[#505060] cursor-not-allowed opacity-50'
            }`}
          >
            <FlipHorizontal className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>{state.inverted ? 'Inverted' : 'Invert'}</span>
            <span className="text-[10px] text-[#707084] font-mono">^I</span>
          </button>

          <button
            type="button"
            onClick={onClearSelection}
            title="Clear Selection (Ctrl+D / Esc)"
            disabled={!state.hasSelection}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
              state.hasSelection
                ? 'border-[#262636] bg-[#161622]/60 hover:bg-[#1A1A28] text-[#F4F4F6] cursor-pointer'
                : 'border-[#20202A] text-[#505060] cursor-not-allowed opacity-50'
            }`}
          >
            <X className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>Deselect</span>
            <span className="text-[10px] text-[#707084] font-mono">^D</span>
          </button>
        </div>
      </div>
    </div>
  )
}
