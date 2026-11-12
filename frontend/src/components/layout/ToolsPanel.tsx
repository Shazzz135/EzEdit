import React from 'react'
import { Dropdown } from '@/components/ui/Dropdown'
import { OrientationPanel } from '@/features/orientation'
import { AdjustmentsPanel } from '@/features/adjustments'
import { FiltersPanel } from '@/features/filters'
import { SelectionPanel, type SelectionPanelProps } from '@/features/selection'
import { CutoutPanel, type CutoutPanelProps } from '@/features/cutout'
import { type CropPanelProps } from '@/features/crop/CropPanel'
import { type DocumentState, type AdjustmentValues, type FilterState } from '@/types/document'
import { type TransformResult } from '@/types/transform'
import { Crop, Sliders, Wand2, Brush, Scissors, Sparkles } from 'lucide-react'

export type ToolCategory =
  | 'orientation'
  | 'adjustments'
  | 'filters'
  | 'selection'
  | 'retouch'
  | 'ai'

const TOOL_CATEGORIES = [
  { id: 'orientation', label: 'Orientation & Alignment', icon: Crop },
  { id: 'adjustments', label: 'Simple Adjustments', icon: Sliders },
  { id: 'filters', label: 'Preset Filters', icon: Wand2 },
  { id: 'selection', label: 'Precise Selection', icon: Scissors },
  { id: 'retouch', label: 'Advanced Retouching', icon: Brush },
  { id: 'ai', label: 'AI Tools (Pollinations.ai)', icon: Sparkles },
] as const

export interface ToolsPanelProps {
  activeCategory: ToolCategory
  onSelectCategory: (category: ToolCategory) => void
  activeDoc?: DocumentState
  onUpdateAdjustments: (id: string, partial: Partial<AdjustmentValues>) => void
  onResetAdjustments?: (id: string) => void
  onUpdateFilter?: (id: string, partial: Partial<FilterState>) => void
  onResetFilter?: (id: string) => void
  cropProps?: CropPanelProps
  onApplyTransform?: (result: TransformResult) => void
  onPreviewScaleChange?: (scale: { x: number; y: number } | undefined) => void
  rotationAngle?: number
  onRotateChange?: (angle: number) => void
  splitActive?: boolean
  onToggleSplit?: () => void
  splitPosition?: number
  onChangeSplitPosition?: (pos: number) => void
  isHoldComparing?: boolean
  onHoldCompareStart?: () => void
  onHoldCompareEnd?: () => void
  selectionProps?: SelectionPanelProps
  cutoutProps?: CutoutPanelProps
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
  activeCategory,
  onSelectCategory,
  activeDoc,
  onUpdateAdjustments,
  onResetAdjustments,
  onUpdateFilter,
  onResetFilter,
  cropProps,
  onApplyTransform,
  onPreviewScaleChange,
  rotationAngle,
  onRotateChange,
  splitActive = false,
  onToggleSplit = () => {},
  splitPosition = 0.5,
  onChangeSplitPosition = () => {},
  isHoldComparing = false,
  onHoldCompareStart = () => {},
  onHoldCompareEnd = () => {},
  selectionProps,
  cutoutProps,
}) => {
  const [selectionSubTab, setSelectionSubTab] = React.useState<'vector' | 'cutout'>('vector')
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Category Dropdown Selector at Top */}
      <div className="p-2.5 border-b border-[#242430] bg-[#14141A] flex-shrink-0">
        <Dropdown
          label="Tool Category"
          options={TOOL_CATEGORIES}
          selectedId={activeCategory}
          onSelect={(id) => onSelectCategory(id as ToolCategory)}
        />
      </div>

      {/* Category Content Pane */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {activeDoc && activeCategory === 'orientation' && cropProps && onApplyTransform && (
          <OrientationPanel
            document={activeDoc}
            cropProps={cropProps}
            rotationAngle={rotationAngle ?? 0}
            onRotateChange={onRotateChange ?? (() => {})}
            onApplyTransform={onApplyTransform}
            onPreviewScaleChange={onPreviewScaleChange}
          />
        )}

        {activeDoc && activeCategory === 'adjustments' && (
          <AdjustmentsPanel
            adjustments={activeDoc.adjustments}
            onChange={(partial) => onUpdateAdjustments(activeDoc.id, partial)}
            onResetAll={() => onResetAdjustments?.(activeDoc.id)}
          />
        )}

        {activeDoc && activeCategory === 'filters' && (
          <FiltersPanel
            filter={activeDoc.filter}
            onChangeFilter={(partial) => onUpdateFilter?.(activeDoc.id, partial)}
            onResetFilter={() => onResetFilter?.(activeDoc.id)}
            splitActive={splitActive}
            onToggleSplit={onToggleSplit}
            splitPosition={splitPosition}
            onChangeSplitPosition={onChangeSplitPosition}
            isHoldComparing={isHoldComparing}
            onHoldCompareStart={onHoldCompareStart}
            onHoldCompareEnd={onHoldCompareEnd}
          />
        )}

        {activeDoc && activeCategory === 'selection' && (
          <div className="flex flex-col gap-3">
            <div className="flex rounded-lg bg-[#14141E] p-0.5 border border-[#242432]">
              <button
                type="button"
                onClick={() => setSelectionSubTab('vector')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  selectionSubTab === 'vector' ? 'bg-[#20202E] text-[#F4F4F6]' : 'text-[#808092] hover:text-[#D0D0E0]'
                }`}
              >
                Vector Selection
              </button>
              <button
                type="button"
                onClick={() => setSelectionSubTab('cutout')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  selectionSubTab === 'cutout' ? 'bg-[#20202E] text-[#F4F4F6]' : 'text-[#808092] hover:text-[#D0D0E0]'
                }`}
              >
                Background Removal
              </button>
            </div>

            {selectionSubTab === 'vector' && selectionProps && (
              <SelectionPanel {...selectionProps} />
            )}

            {selectionSubTab === 'cutout' && cutoutProps && (
              <CutoutPanel {...cutoutProps} />
            )}
          </div>
        )}

        {activeDoc && activeCategory !== 'orientation' && activeCategory !== 'adjustments' && activeCategory !== 'filters' && activeCategory !== 'selection' && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-[#707080] text-xs">
            <span>
              {TOOL_CATEGORIES.find((c) => c.id === activeCategory)?.label} tools will activate in Milestone{' '}
              {activeCategory === 'retouch' ? 7 : 8}
            </span>
          </div>
        )}

        {!activeDoc && (
          <div className="flex flex-col items-center justify-center p-6 text-[#707080] text-xs text-center">
            <span>Open or import an image to use editing tools</span>
          </div>
        )}
      </div>
    </div>
  )
}
