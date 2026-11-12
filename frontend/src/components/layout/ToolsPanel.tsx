import React from 'react'
import { Dropdown } from '@/components/ui/Dropdown'
import { OrientationPanel } from '@/features/orientation'
import { AdjustmentsPanel } from '@/features/adjustments'
import { FiltersPanel } from '@/features/filters'
import { SelectionPanel, type SelectionPanelProps } from '@/features/selection'
import { CutoutPanel, type CutoutPanelProps } from '@/features/cutout'
import { RetouchPanel, type RetouchPanelProps } from '@/features/retouch'
import { AIPanel, AIPreviewModal, usePollinationsState } from '@/features/ai'
import { useDocumentStore } from '@/features/tabs/useDocumentStore'
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
  selectionSubTab?: 'vector' | 'cutout'
  onSelectSelectionSubTab?: (subTab: 'vector' | 'cutout') => void
  retouchProps?: RetouchPanelProps
  onTabLimitExceeded?: () => void
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
  activeCategory, onSelectCategory, activeDoc,
  onUpdateAdjustments, onResetAdjustments, onUpdateFilter, onResetFilter,
  cropProps, onApplyTransform, onPreviewScaleChange, rotationAngle, onRotateChange,
  splitActive = false, onToggleSplit = () => {}, splitPosition = 0.5, onChangeSplitPosition = () => {},
  isHoldComparing = false, onHoldCompareStart = () => {}, onHoldCompareEnd = () => {},
  selectionProps, cutoutProps, selectionSubTab = 'vector', onSelectSelectionSubTab,
  retouchProps, onTabLimitExceeded,
}) => {
  const ai = usePollinationsState()
  const addDocument = useDocumentStore((s) => s.addDocument)

  const handleOpenInNewTab = () => {
    if (!ai.previewResult) return
    const res = addDocument({
      name: `AI-${ai.previewResult.seed}.png`,
      originalWidth: ai.previewResult.width,
      originalHeight: ai.previewResult.height,
      currentWidth: ai.previewResult.width,
      currentHeight: ai.previewResult.height,
      imageSrc: ai.previewResult.url,
      imageBlob: ai.previewResult.blob,
    })
    if (!res.success && res.error === 'MAX_TABS_EXCEEDED') {
      onTabLimitExceeded?.()
      return
    }
    ai.consumePreview()
  }

  const handleReplaceActiveImage = () => {
    if (!ai.previewResult || !activeDoc || !onApplyTransform) return
    const current = ai.consumePreview()
    if (!current) return
    onApplyTransform({
      url: current.url,
      blob: current.blob,
      width: current.width,
      height: current.height,
    })
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="p-2.5 border-b border-[#242430] bg-[#14141A] flex-shrink-0">
        <Dropdown
          label="Tool Category"
          options={TOOL_CATEGORIES}
          selectedId={activeCategory}
          onSelect={(id) => onSelectCategory(id as ToolCategory)}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {activeDoc && activeCategory === 'orientation' && cropProps && onApplyTransform && (
          <OrientationPanel
            key={`${activeDoc.id}_${activeDoc.resetVersion ?? 0}`}
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
            key={`${activeDoc.id}_${activeDoc.resetVersion ?? 0}`}
            adjustments={activeDoc.adjustments}
            onChange={(partial) => onUpdateAdjustments(activeDoc.id, partial)}
            onResetAll={() => onResetAdjustments?.(activeDoc.id)}
          />
        )}

        {activeDoc && activeCategory === 'filters' && (
          <FiltersPanel
            key={`${activeDoc.id}_${activeDoc.resetVersion ?? 0}`}
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
          <div key={`${activeDoc.id}_${activeDoc.resetVersion ?? 0}`} className="flex flex-col gap-3">
            <div className="flex rounded-lg bg-[#14141E] p-0.5 border border-[#242432]">
              <button
                type="button"
                onClick={() => onSelectSelectionSubTab?.('vector')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  selectionSubTab === 'vector' ? 'bg-[#20202E] text-[#F4F4F6]' : 'text-[#808092] hover:text-[#D0D0E0]'
                }`}
              >
                Vector Selection
              </button>
              <button
                type="button"
                onClick={() => onSelectSelectionSubTab?.('cutout')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  selectionSubTab === 'cutout' ? 'bg-[#20202E] text-[#F4F4F6]' : 'text-[#808092] hover:text-[#D0D0E0]'
                }`}
              >
                Background Removal
              </button>
            </div>
            {selectionSubTab === 'vector' && selectionProps && <SelectionPanel {...selectionProps} />}
            {selectionSubTab === 'cutout' && cutoutProps && <CutoutPanel {...cutoutProps} />}
          </div>
        )}

        {activeDoc && activeCategory === 'retouch' && retouchProps && (
          <RetouchPanel key={activeDoc.id} {...retouchProps} />
        )}

        {activeCategory === 'ai' && (
          <AIPanel
            mode={ai.mode}
            hasActiveDocument={!!activeDoc}
            activeWidth={activeDoc?.currentWidth}
            activeHeight={activeDoc?.currentHeight}
            prompt={ai.prompt}
            aspectRatio={ai.aspectRatio}
            style={ai.style}
            seed={ai.seed}
            enhance={ai.enhance}
            isGenerating={ai.isGenerating}
            error={ai.error}
            onChangeMode={ai.setMode}
            onChangePrompt={ai.setPrompt}
            onChangeAspectRatio={ai.setAspectRatio}
            onChangeStyle={ai.setStyle}
            onChangeSeed={ai.setSeed}
            onRandomizeSeed={ai.randomizeSeed}
            onToggleEnhance={() => ai.setEnhance((v) => !v)}
            onGenerate={() =>
              ai.handleGenerate(
                undefined,
                activeDoc ? { imageSrc: activeDoc.imageSrc, width: activeDoc.currentWidth, height: activeDoc.currentHeight } : undefined
              )
            }
          />
        )}

        {!activeDoc && activeCategory !== 'ai' && (
          <div className="flex flex-col items-center justify-center p-6 text-[#707080] text-xs text-center">
            <span>Open or import an image to use editing tools, or switch to AI Tools to generate one</span>
          </div>
        )}
      </div>

      <AIPreviewModal
        result={ai.previewResult}
        hasActiveDocument={!!activeDoc}
        isRegenerating={ai.isGenerating}
        onOpenInNewTab={handleOpenInNewTab}
        onReplaceActiveImage={handleReplaceActiveImage}
        onRegenerate={() =>
          ai.handleRegenerateWithNewSeed(
            activeDoc ? { imageSrc: activeDoc.imageSrc, width: activeDoc.currentWidth, height: activeDoc.currentHeight } : undefined
          )
        }
        onClose={ai.closePreview}
      />
    </div>
  )
}
