import React, { useState, useRef, useCallback } from 'react'
import { WorkspaceShell } from '@/components/layout/WorkspaceShell'
import { ToolsPanel } from '@/components/layout/ToolsPanel'
import { WorkspaceModals } from '@/components/layout/WorkspaceModals'
import { MobileDocumentSelector } from '@/components/layout/MobileDocumentSelector'
import { TabBar } from '@/features/tabs/TabBar'
import { CanvasViewport } from '@/features/canvas/CanvasViewport'
import { useCanvasPanZoom } from '@/features/canvas/useCanvasPanZoom'
import { useCropState, CropOverlay, executeCrop } from '@/features/crop'
import { RotateHandle } from '@/features/orientation'
import { useSelectionState, SelectionOverlay, copySelection, cutSelection } from '@/features/selection'
import { useBackgroundRemoval } from '@/features/cutout'
import { useRetouchState, RetouchOverlay } from '@/features/retouch'
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
  const [selectionSubTab, setSelectionSubTab] = useState<'vector' | 'cutout'>('vector')
  const mobileFileInputRef = useRef<HTMLInputElement>(null)

  const { quotaWarning, dismissQuotaWarning } = useDocumentPersistence()
  const {
    documents, activeDocumentId, setActiveDocument, getActiveDocument,
    updateAdjustments, resetAdjustments, updateFilter, resetFilter,
    closeDocument, applyRasterTransform, undo, redo,
  } = useDocumentStore()
  const activeDoc = getActiveDocument()
  const panZoom = useCanvasPanZoom()
  const crop = useCropState()
  const selection = useSelectionState(activeCategory === 'selection' && selectionSubTab === 'vector', { onCopy: () => handleCopySelection(), onCut: () => handleCutSelection() })
  const retouch = useRetouchState({ isActive: activeCategory === 'retouch' })
  const { oversizedFile, setOversizedFile, handleDropFile, handleDownscaleAndImport } =
    useImageImport(() => setTabLimitModalOpen(true))

  const handleApplyTransform = useCallback((result: TransformResult) => {
    if (!activeDoc) return
    applyRasterTransform(activeDoc.id, { url: result.url, blob: result.blob, width: result.width, height: result.height })
  }, [activeDoc, applyRasterTransform])

  const cutout = useBackgroundRemoval(activeDoc, handleApplyTransform, selection.clearSelection)

  const resetToolStates = useCallback(() => {
    crop.cancelCrop(); selection.clearSelection(); retouch.resetRetouch();
    setRotationAngle(0); setPreviewScale(undefined); setSplitActive(false); setIsHoldComparing(false);
  }, [crop, selection, retouch])

  const [prevTracked, setPrevTracked] = useState({ docId: activeDocumentId, cat: activeCategory })
  if (prevTracked.docId !== activeDocumentId || prevTracked.cat !== activeCategory) {
    setPrevTracked({ docId: activeDocumentId, cat: activeCategory })
    crop.cancelCrop(); selection.clearSelection(); retouch.resetRetouch();
    setRotationAngle(0); setPreviewScale(undefined); setSplitActive(false); setIsHoldComparing(false);
  }

  const handleSelectSelectionSubTab = useCallback((subTab: 'vector' | 'cutout') => {
    setSelectionSubTab(subTab)
    selection.clearSelection()
  }, [selection])

  useUndoRedoShortcuts(activeDoc, undo, redo)

  const handleApplyCrop = async () => {
    if (!activeDoc || !crop.cropRect) return
    try {
      const res = await executeCrop(activeDoc.imageSrc, crop.cropRect)
      handleApplyTransform(res)
      crop.cancelCrop()
    } catch (e) { console.error('Failed to apply crop:', e) }
  }

  const handleCopySelection = async () => {
    if (activeDoc && selection.state.hasSelection) {
      await copySelection(activeDoc.imageSrc, selection.state.paths, selection.state.inverted, selection.state.feather)
    }
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
      documents={documents} activeDocumentId={activeDocumentId} onSelectDocument={setActiveDocument}
      onCloseDocument={(id) => { const doc = documents.find((d) => d.id === id); if (doc?.isModified) setUnsavedDoc({ id, name: doc.name }); else closeDocument(id); }}
      onImportClick={() => { if (documents.length >= MAX_TAB_LIMIT) setTabLimitModalOpen(true); else mobileFileInputRef.current?.click(); }}
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
          onZoomIn: panZoom.zoomIn,
          onZoomOut: panZoom.zoomOut,
          isGrabActive: panZoom.isHandToolActive || panZoom.isSpacePressed,
          onToggleGrab: panZoom.toggleHandTool,
          onOpenAI: () => { setActiveCategory('ai'); resetToolStates(); },
          canUndo, canRedo, mobileSelector,
        }}
        canvasContent={
          <CanvasViewport
            document={activeDoc}
            panZoom={panZoom}
            onDropImage={handleDropFile}
            previewScale={previewScale}
            rotationAngle={rotationAngle}
            splitActive={activeCategory === 'filters' && splitActive}
            splitPosition={splitPosition}
            onChangeSplitPosition={setSplitPosition}
            isHoldComparing={activeCategory === 'filters' && isHoldComparing}
            onHoldCompareChange={setIsHoldComparing}
            onToggleSplit={() => setSplitActive((v) => !v)}
            onRightClickDeselect={resetToolStates}
            rotateOverlay={activeDoc && activeCategory === 'orientation' && !crop.isCropActive ? (
              <RotateHandle rotationAngle={rotationAngle} onRotateChange={setRotationAngle} />
            ) : undefined}
            selectionOverlay={activeDoc && activeCategory === 'selection' && selectionSubTab === 'vector' ? (scale) => (
              <SelectionOverlay
                imageWidth={activeDoc.currentWidth} imageHeight={activeDoc.currentHeight} zoomScale={scale}
                tool={selection.state.tool} paths={selection.state.paths} onCommitPath={selection.commitPath} onDeselect={selection.clearSelection}
              />
            ) : undefined}
            isPrecisionToolActive={(activeCategory === 'orientation' && crop.isCropActive) || (activeCategory === 'selection' && selectionSubTab === 'vector') || (activeCategory === 'retouch')}
            cropOverlay={activeDoc && activeCategory === 'orientation' && crop.isCropActive && crop.cropRect ? (scale) => (
              <CropOverlay
                imageWidth={activeDoc.currentWidth} imageHeight={activeDoc.currentHeight}
                cropRect={crop.cropRect!} aspectRatio={crop.aspectRatio} zoomScale={scale}
                onChange={crop.updateCrop} onDragStateChange={crop.setIsDragging} onCancel={crop.cancelCrop}
              />
            ) : undefined}
            retouchOverlay={activeDoc && activeCategory === 'retouch' ? (scale) => (
              <RetouchOverlay
                imageSrc={activeDoc.imageSrc} imageWidth={activeDoc.currentWidth} imageHeight={activeDoc.currentHeight} zoomScale={scale}
                tool={retouch.tool} settings={retouch.settings} sourcePoint={retouch.sourcePoint} isAltPressed={retouch.isAltPressed}
                onSetSourcePoint={retouch.setSourcePoint} onCommitTransform={handleApplyTransform}
              />
            ) : undefined}
          />
        }
        toolsContent={
          <ToolsPanel
            activeCategory={activeCategory}
            onSelectCategory={(cat) => {
              setActiveCategory(cat)
              resetToolStates()
            }}
            selectionSubTab={selectionSubTab}
            onSelectSelectionSubTab={handleSelectSelectionSubTab}
            activeDoc={activeDoc}
            onUpdateAdjustments={updateAdjustments}
            onResetAdjustments={resetAdjustments}
            onUpdateFilter={updateFilter}
            onResetFilter={resetFilter}
            splitActive={splitActive} onToggleSplit={() => setSplitActive((v) => !v)}
            splitPosition={splitPosition} onChangeSplitPosition={setSplitPosition}
            isHoldComparing={isHoldComparing}
            onHoldCompareStart={() => setIsHoldComparing(true)} onHoldCompareEnd={() => setIsHoldComparing(false)}
            onApplyTransform={handleApplyTransform} onPreviewScaleChange={setPreviewScale}
            rotationAngle={rotationAngle} onRotateChange={setRotationAngle}
            retouchProps={{
              tool: retouch.tool, settings: retouch.settings, sourcePoint: retouch.sourcePoint,
              onSelectTool: retouch.setTool, onChangeRadius: retouch.setRadius,
              onChangeHardness: retouch.setHardness, onChangeOpacity: retouch.setOpacity,
              onClearSourcePoint: retouch.clearSourcePoint,
            }}
            selectionProps={{
              state: selection.state, onSelectTool: selection.setTool,
              onChangeFeather: selection.setFeather, onToggleInvert: selection.toggleInvert,
              onClearSelection: selection.clearSelection, onCopySelection: handleCopySelection, onCutSelection: handleCutSelection,
            }}
            cutoutProps={{
              hasSelection: selection.state.hasSelection, isProcessing: cutout.isProcessing,
              onExecuteAutoCutout: cutout.handleAutoCutout,
              onExecuteSelectionCutout: (inv) => cutout.handleSelectionCutout(inv, selection.state.paths),
            }}
            cropProps={{
              isCropActive: crop.isCropActive, cropRect: crop.cropRect, aspectRatio: crop.aspectRatio,
              onStartCrop: () => activeDoc && crop.startCrop(activeDoc.currentWidth, activeDoc.currentHeight),
              onSelectRatio: (r) => activeDoc && crop.setAspectRatio(r, activeDoc.currentWidth, activeDoc.currentHeight),
              onApplyCrop: handleApplyCrop, onCancelCrop: crop.cancelCrop,
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
        tabLimitModalOpen={tabLimitModalOpen} onCloseTabLimitModal={() => setTabLimitModalOpen(false)}
        oversizedFile={oversizedFile} onCloseOversizedModal={() => setOversizedFile(null)}
        onDownscaleAndImport={handleDownscaleAndImport} unsavedDoc={unsavedDoc}
        onKeepUnsavedDoc={() => setUnsavedDoc(null)}
        onDiscardUnsavedDoc={() => { if (unsavedDoc) closeDocument(unsavedDoc.id); setUnsavedDoc(null) }}
        quotaWarning={quotaWarning} onDismissQuotaWarning={dismissQuotaWarning}
      />
    </>
  )
}

export default App
