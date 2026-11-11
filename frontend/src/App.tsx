import React, { useState, useRef } from 'react'
import { WorkspaceShell } from '@/components/layout/WorkspaceShell'
import { ToolsPanel } from '@/components/layout/ToolsPanel'
import { WorkspaceModals } from '@/components/layout/WorkspaceModals'
import { MobileDocumentSelector } from '@/components/layout/MobileDocumentSelector'
import { TabBar } from '@/features/tabs/TabBar'
import { CanvasViewport } from '@/features/canvas/CanvasViewport'
import { useCropState, CropOverlay, executeCrop } from '@/features/crop'
import { RotateHandle } from '@/features/orientation'
import { useSelectionState, SelectionOverlay, copySelection, cutSelection } from '@/features/selection'
import { useImageImport } from '@/features/canvas/useImageImport'
import { useDocumentStore } from '@/features/tabs/useDocumentStore'
import { useDocumentPersistence } from '@/features/tabs/useDocumentPersistence'
import { useUndoRedoShortcuts } from '@/hooks/useUndoRedoShortcuts'
import { usePersistedToolCategory } from '@/hooks/usePersistedToolCategory'
import { MAX_TAB_LIMIT } from '@/types/document'
import { type TransformResult } from '@/types/transform'

export const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = usePersistedToolCategory()
  const [tabLimitModalOpen, setTabLimitModalOpen] = useState(false)
  const [unsavedDoc, setUnsavedDoc] = useState<{ id: string; name: string } | null>(null)
  const [previewScale, setPreviewScale] = useState<{ x: number; y: number } | undefined>(undefined)
  const [rotationAngle, setRotationAngle] = useState(0)
  const [splitActive, setSplitActive] = useState(false)
  const [splitPosition, setSplitPosition] = useState(0.5)
  const [isHoldComparing, setIsHoldComparing] = useState(false)
  const mobileFileInputRef = useRef<HTMLInputElement>(null)

  const { quotaWarning, dismissQuotaWarning } = useDocumentPersistence()
  const {
    documents,
    activeDocumentId,
    setActiveDocument,
    getActiveDocument,
    updateAdjustments,
    resetAdjustments,
    updateFilter,
    resetFilter,
    closeDocument,
    applyRasterTransform,
    undo,
    redo,
  } = useDocumentStore()
  const activeDoc = getActiveDocument()
  const crop = useCropState()
  const selection = useSelectionState(activeCategory === 'selection', { onCopy: () => handleCopySelection(), onCut: () => handleCutSelection() })
  const { oversizedFile, setOversizedFile, handleDropFile, handleDownscaleAndImport } =
    useImageImport(() => setTabLimitModalOpen(true))

  useUndoRedoShortcuts(activeDoc, undo, redo)

  const handleApplyTransform = (result: TransformResult) => {
    if (!activeDoc) return
    applyRasterTransform(activeDoc.id, {
      url: result.url,
      blob: result.blob,
      width: result.width,
      height: result.height,
    })
  }

  const handleApplyCrop = async () => {
    if (!activeDoc || !crop.cropRect) return
    try {
      const result = await executeCrop(activeDoc.imageSrc, crop.cropRect)
      handleApplyTransform(result)
      crop.cancelCrop()
    } catch (err) {
      console.error('Failed to apply crop:', err)
    }
  }

  const handleCopySelection = async () => {
    if (!activeDoc || !selection.state.hasSelection) return
    await copySelection(activeDoc.imageSrc, selection.state.paths, selection.state.inverted, selection.state.feather)
  }

  const handleCutSelection = async () => {
    if (!activeDoc || !selection.state.hasSelection) return
    const cutRes = await cutSelection(activeDoc.imageSrc, selection.state.paths, selection.state.inverted, selection.state.feather)
    if (cutRes) {
      handleApplyTransform({ url: cutRes.newImageUrl, blob: cutRes.newImageBlob, width: cutRes.width, height: cutRes.height })
      selection.clearSelection()
    }
  }

  const canUndo = !!(activeDoc && activeDoc.historyIndex > 0)
  const canRedo = !!(activeDoc && activeDoc.history && activeDoc.historyIndex < activeDoc.history.length - 1)

  const mobileSelector = (
    <MobileDocumentSelector
      documents={documents}
      activeDocumentId={activeDocumentId}
      onSelectDocument={setActiveDocument}
      onCloseDocument={(id) => {
        const doc = documents.find((d) => d.id === id)
        if (doc?.isModified) setUnsavedDoc({ id, name: doc.name })
        else closeDocument(id)
      }}
      onImportClick={() => {
        if (documents.length >= MAX_TAB_LIMIT) setTabLimitModalOpen(true)
        else mobileFileInputRef.current?.click()
      }}
    />
  )

  return (
    <>
      <input
        ref={mobileFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleDropFile(e.target.files[0])
          e.target.value = ''
        }}
      />
      <WorkspaceShell
        headerProps={{
          onUndo: canUndo ? () => undo(activeDoc!.id) : undefined,
          onRedo: canRedo ? () => redo(activeDoc!.id) : undefined,
          onOpenAI: () => setActiveCategory('ai'),
          canUndo, canRedo, mobileSelector,
        }}
        canvasContent={
          <CanvasViewport
            document={activeDoc}
            onDropImage={handleDropFile}
            previewScale={previewScale}
            rotationAngle={rotationAngle}
            splitActive={splitActive}
            splitPosition={splitPosition}
            onChangeSplitPosition={setSplitPosition}
            isHoldComparing={isHoldComparing}
            onHoldCompareChange={setIsHoldComparing}
            onToggleSplit={() => setSplitActive((v) => !v)}
            rotateOverlay={
              activeDoc && activeCategory === 'orientation' && !crop.isCropActive ? (
                <RotateHandle rotationAngle={rotationAngle} onRotateChange={setRotationAngle} />
              ) : undefined
            }
            selectionOverlay={
              activeDoc && activeCategory === 'selection'
                ? (scale) => (
                    <SelectionOverlay
                      imageWidth={activeDoc.currentWidth}
                      imageHeight={activeDoc.currentHeight}
                      zoomScale={scale}
                      tool={selection.state.tool}
                      paths={selection.state.paths}
                      onCommitPath={selection.commitPath}
                    />
                  )
                : undefined
            }
            isPrecisionToolActive={crop.isCropActive || activeCategory === 'selection'}
            cropOverlay={
              activeDoc && crop.isCropActive && crop.cropRect
                ? (scale) => (
                    <CropOverlay
                      imageWidth={activeDoc.currentWidth}
                      imageHeight={activeDoc.currentHeight}
                      cropRect={crop.cropRect!}
                      aspectRatio={crop.aspectRatio}
                      zoomScale={scale}
                      onChange={crop.updateCrop}
                      onDragStateChange={crop.setIsDragging}
                    />
                  )
                : undefined
            }
          />
        }
        toolsContent={
          <ToolsPanel
            activeCategory={activeCategory}
            onSelectCategory={(cat) => {
              setActiveCategory(cat)
              if (cat !== 'orientation') setRotationAngle(0)
            }}
            activeDoc={activeDoc}
            onUpdateAdjustments={updateAdjustments}
            onResetAdjustments={resetAdjustments}
            onUpdateFilter={updateFilter}
            onResetFilter={resetFilter}
            splitActive={splitActive}
            onToggleSplit={() => setSplitActive((v) => !v)}
            splitPosition={splitPosition}
            onChangeSplitPosition={setSplitPosition}
            isHoldComparing={isHoldComparing}
            onHoldCompareStart={() => setIsHoldComparing(true)}
            onHoldCompareEnd={() => setIsHoldComparing(false)}
            onApplyTransform={handleApplyTransform}
            onPreviewScaleChange={setPreviewScale}
            rotationAngle={rotationAngle}
            onRotateChange={setRotationAngle}
            selectionProps={{
              state: selection.state,
              onSelectTool: selection.setTool,
              onSelectMode: selection.setMode,
              onChangeFeather: selection.setFeather,
              onToggleInvert: selection.toggleInvert,
              onClearSelection: selection.clearSelection,
              onCopySelection: handleCopySelection,
              onCutSelection: handleCutSelection,
            }}
            cropProps={{
              isCropActive: crop.isCropActive,
              cropRect: crop.cropRect,
              aspectRatio: crop.aspectRatio,
              onStartCrop: () => activeDoc && crop.startCrop(activeDoc.currentWidth, activeDoc.currentHeight),
              onSelectRatio: (r) => activeDoc && crop.setAspectRatio(r, activeDoc.currentWidth, activeDoc.currentHeight),
              onApplyCrop: handleApplyCrop,
              onCancelCrop: crop.cancelCrop,
              onResetCrop: () => activeDoc && crop.startCrop(activeDoc.currentWidth, activeDoc.currentHeight),
            }}
          />
        }
        tabBarContent={
          <TabBar
            onTabLimitExceeded={() => setTabLimitModalOpen(true)}
            onDimensionExceeded={(file, width, height) => setOversizedFile({ file, width, height })}
            onUnsavedClosePrompt={(id, name) => setUnsavedDoc({ id, name })}
          />
        }
      />

      <WorkspaceModals
        tabLimitModalOpen={tabLimitModalOpen}
        onCloseTabLimitModal={() => setTabLimitModalOpen(false)}
        oversizedFile={oversizedFile}
        onCloseOversizedModal={() => setOversizedFile(null)}
        onDownscaleAndImport={handleDownscaleAndImport}
        unsavedDoc={unsavedDoc}
        onKeepUnsavedDoc={() => setUnsavedDoc(null)}
        onDiscardUnsavedDoc={() => { if (unsavedDoc) closeDocument(unsavedDoc.id); setUnsavedDoc(null) }}
        quotaWarning={quotaWarning}
        onDismissQuotaWarning={dismissQuotaWarning}
      />
    </>
  )
}

export default App
