import React from 'react'
import { Dropdown } from '@/components/ui/Dropdown'
import { PrecisionSlider } from '@/components/ui/PrecisionSlider'
import { OrientationPanel } from '@/features/orientation'
import { type CropPanelProps } from '@/features/crop/CropPanel'
import { type DocumentState, type AdjustmentValues } from '@/types/document'
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
  cropProps?: CropPanelProps
  onApplyTransform?: (result: TransformResult) => void
  onPreviewScaleChange?: (scale: { x: number; y: number } | undefined) => void
  rotationAngle?: number
  onRotateChange?: (angle: number) => void
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
  activeCategory,
  onSelectCategory,
  activeDoc,
  onUpdateAdjustments,
  cropProps,
  onApplyTransform,
  onPreviewScaleChange,
  rotationAngle,
  onRotateChange,
}) => {
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
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider">
              Light & Color
            </h4>
            <PrecisionSlider
              label="Exposure"
              value={activeDoc.adjustments.exposure}
              onChange={(v) => onUpdateAdjustments(activeDoc.id, { exposure: v })}
              min={-5.0}
              max={5.0}
              step={0.1}
              defaultValue={0.0}
              unit=" EV"
            />
            <PrecisionSlider
              label="Contrast"
              value={activeDoc.adjustments.contrast}
              onChange={(v) => onUpdateAdjustments(activeDoc.id, { contrast: v })}
              min={-100.0}
              max={100.0}
              step={0.1}
              defaultValue={0.0}
            />
          </div>
        )}

        {activeDoc && activeCategory !== 'orientation' && activeCategory !== 'adjustments' && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-[#707080] text-xs">
            <span>
              {TOOL_CATEGORIES.find((c) => c.id === activeCategory)?.label} tools will activate in Milestone{' '}
              {activeCategory === 'filters' ? 5 : activeCategory === 'selection' ? 6 : activeCategory === 'retouch' ? 7 : 8}
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
