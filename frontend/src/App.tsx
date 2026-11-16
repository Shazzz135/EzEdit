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
import {
  useSelectionState, SelectionOverlay, FloatingObjectOverlay,
  copySelection, cutSelection, getPasteableBlob, getInternalClipboardPosition,
  createFloatingObject, stampFloatingObject,
} from '@/features/selection'
import { useBackgroundRemoval } from '@/features/cutout'
import { useRetouchState, RetouchOverlay } from '@/features/retouch'
import { useAnnotateState, AnnotateOverlay } from '@/features/annotate'
import { useImageImport } from '@/features/canvas/useImageImport'
import { useDocumentStore } from '@/features/tabs/useDocumentStore'
import { useDocumentPersistence } from '@/features/tabs/useDocumentPersistence'
import { useUndoRedoShortcuts } from '@/hooks/useUndoRedoShortcuts'
import { usePersistedToolCategory } from '@/hooks/usePersistedToolCategory'
import { MAX_TAB_LIMIT, type HistoryActionType } from '@/types/document'
import { type TransformResult } from '@/types/transform'
import { HistoryPanel } from '@/features/history'

export const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = usePersistedToolCategory()
  const [tabLimitModalOpen, setTabLimitModalOpen] = useState(false); const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false); const [exportAllModalOpen, setExportAllModalOpen] = useState(false)
  const [unsavedDoc, setUnsavedDoc] = useState<{ id: string; name: string } | null>(null)
  const [previewScale, setPreviewScale] = useState<{ x: number; y: number } | undefined>(undefined)
  const [splitActive, setSplitActive] = useState(false); const [splitPosition, setSplitPosition] = useState(0.5); const [isHoldComparing, setIsHoldComparing] = useState(false)
  const [selectionSubTab, setSelectionSubTab] = useState<'vector' | 'cutout'>('vector'); const [showHistory, setShowHistory] = useState(true)
  const mobileFileInputRef = useRef<HTMLInputElement>(null)

  const { quotaWarning, dismissQuotaWarning } = useDocumentPersistence()
  const {
    documents, activeDocumentId, setActiveDocument, getActiveDocument,
    updateAdjustments, resetAdjustments, updateOrientation, updateFilter, resetFilter,
    closeDocument, applyRasterTransform, resetDocumentCompletely, transferEdits, markDocumentExported, undo, redo, jumpToHistoryIndex,
  } = useDocumentStore()
  const activeDoc = getActiveDocument(); const panZoom = useCanvasPanZoom(); const crop = useCropState()
  const selection = useSelectionState(activeCategory === 'selection' && selectionSubTab === 'vector', {
    onCopy: () => handleCopySelection(), onCut: () => handleCutSelection(), onPaste: () => handlePasteSelection(),
    onCommitFloating: () => handleCommitFloatingObject(),
  })
  const { clearSelection, clearFloatingObject } = selection
  const retouch = useRetouchState({ isActive: activeCategory === 'retouch' }); const annotate = useAnnotateState()
  const { oversizedFile, setOversizedFile, handleDropFile, handleDownscaleAndImport } = useImageImport(() => setTabLimitModalOpen(true))

  const handleApplyTransform = useCallback((result: TransformResult, meta?: { actionType?: HistoryActionType; description?: string }) => {
    if (!activeDoc) return
    applyRasterTransform(activeDoc.id, { url: result.url, blob: result.blob, width: result.width, height: result.height }, meta)
  }, [activeDoc, applyRasterTransform])

  const cutout = useBackgroundRemoval(activeDoc, handleApplyTransform, clearSelection)
  const resetToolStates = useCallback(() => {
    crop.cancelCrop(); clearSelection(); clearFloatingObject(); retouch.resetRetouch(); annotate.resetAnnotate();
    setPreviewScale(undefined); setSplitActive(false); setIsHoldComparing(false);
  }, [crop, clearSelection, clearFloatingObject, retouch, annotate])

  const [prevTracked, setPrevTracked] = useState({ docId: activeDocumentId, cat: activeCategory })
  if (prevTracked.docId !== activeDocumentId || prevTracked.cat !== activeCategory) { setPrevTracked({ docId: activeDocumentId, cat: activeCategory }); resetToolStates(); }

  const handleSelectSelectionSubTab = useCallback((subTab: 'vector' | 'cutout') => { setSelectionSubTab(subTab); clearSelection() }, [clearSelection])
  useUndoRedoShortcuts(activeDoc, undo, redo, activeCategory === 'annotate' && (annotate.items.length > 0 || annotate.undoneItems.length > 0)
    ? { canUndo: annotate.items.length > 0, canRedo: annotate.undoneItems.length > 0, onUndo: annotate.undoLastItem, onRedo: annotate.redoLastItem } : undefined)

  const handleApplyCrop = async () => {
    if (!activeDoc || !crop.cropRect) return
    try { const res = await executeCrop(activeDoc.imageSrc, crop.cropRect); handleApplyTransform(res, { actionType: 'crop', description: 'Crop Image' }); crop.cancelCrop() } catch (e) { console.error('Crop error:', e) }
  }
  const handleCopySelection = async () => {
    if (activeDoc && selection.state.hasSelection) { await copySelection(activeDoc.imageSrc, selection.state.paths, selection.state.inverted, selection.state.feather); selection.refreshCanPaste() }
  }
  const handleCutSelection = async () => {
    if (!activeDoc || !selection.state.hasSelection) return
    const cutRes = await cutSelection(activeDoc.imageSrc, selection.state.paths, selection.state.inverted, selection.state.feather)
    if (cutRes) {
      handleApplyTransform({ url: cutRes.newImageUrl, blob: cutRes.newImageBlob, width: cutRes.width, height: cutRes.height }, { actionType: 'cutout', description: 'Cut Selection' })
      const floating = await createFloatingObject(cutRes.extractedBlob, cutRes.bbox ? { x: cutRes.bbox.minX, y: cutRes.bbox.minY } : null)
      selection.clearSelection(); selection.setFloatingObject(floating); selection.refreshCanPaste()
    }
  }
  const handlePasteSelection = async () => {
    if (!activeDoc) return
    const blob = await getPasteableBlob(); if (!blob) return
    const pos = getInternalClipboardPosition()
    const floating = await createFloatingObject(blob, pos ? { x: pos.x + 20, y: pos.y + 20 } : null, { width: activeDoc.currentWidth, height: activeDoc.currentHeight })
    selection.setFloatingObject(floating)
  }
  const handleCommitFloatingObject = async () => {
    if (!activeDoc || !selection.state.floatingObject) return
    const res = await stampFloatingObject(activeDoc.imageSrc, selection.state.floatingObject)
    if (res) { handleApplyTransform(res, { actionType: 'paste', description: 'Stamp Movable Object' }); selection.clearFloatingObject() }
  }

  const isAnnotateActive = activeCategory === 'annotate' && (annotate.items.length > 0 || annotate.undoneItems.length > 0)
  const canUndo = isAnnotateActive ? annotate.items.length > 0 : !!(activeDoc && activeDoc.historyIndex > 0)
  const canRedo = isAnnotateActive ? annotate.undoneItems.length > 0 : !!(activeDoc && activeDoc.history && activeDoc.historyIndex < activeDoc.history.length - 1)
  const hasMultipleTabs = documents.length >= 2
  const mobileSelector = (
    <MobileDocumentSelector
      documents={documents} activeDocumentId={activeDocumentId} onSelectDocument={setActiveDocument}
      onCloseDocument={(id) => { const doc = documents.find((d) => d.id === id); if (doc?.isModified) setUnsavedDoc({ id, name: doc.name }); else closeDocument(id); }}
      onImportClick={() => { if (documents.length >= MAX_TAB_LIMIT) setTabLimitModalOpen(true); else mobileFileInputRef.current?.click(); }}
    />
  )

  return (
    <>
      <input ref={mobileFileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleDropFile(e.target.files[0]); e.target.value = '' }} />
      <WorkspaceShell
        showHistory={showHistory}
        historyContent={<HistoryPanel document={activeDoc} onJumpToIndex={(idx) => activeDoc && jumpToHistoryIndex(activeDoc.id, idx)} onResetCompletely={activeDoc ? () => { resetToolStates(); resetDocumentCompletely(activeDoc.id); } : undefined} />}
        headerProps={{
          onUndo: canUndo ? (isAnnotateActive ? annotate.undoLastItem : () => undo(activeDoc!.id)) : undefined,
          onRedo: canRedo ? (isAnnotateActive ? annotate.redoLastItem : () => redo(activeDoc!.id)) : undefined,
          onMassReset: activeDoc ? () => { resetToolStates(); resetDocumentCompletely(activeDoc.id); } : undefined,
          onOpenTransferEdits: activeDoc && hasMultipleTabs ? () => setTransferModalOpen(true) : undefined,
          onZoomIn: panZoom.zoomIn, onZoomOut: panZoom.zoomOut, isGrabActive: panZoom.isHandToolActive || panZoom.isSpacePressed, onToggleGrab: panZoom.toggleHandTool,
          onExport: activeDoc ? () => setExportModalOpen(true) : undefined, onExportAll: hasMultipleTabs ? () => setExportAllModalOpen(true) : undefined,
          onOpenAI: () => { setActiveCategory('ai'); resetToolStates(); }, canUndo, canRedo, canMassReset: !!activeDoc, canTransferEdits: !!activeDoc && hasMultipleTabs, canExportAll: hasMultipleTabs, mobileSelector,
          isHistoryOpen: showHistory, onToggleHistory: () => setShowHistory((v) => !v),
        }}
        canvasContent={
          <CanvasViewport
            document={activeDoc} panZoom={panZoom} onDropImage={handleDropFile} previewScale={previewScale}
            splitActive={activeCategory === 'filters' && splitActive} splitPosition={splitPosition} onChangeSplitPosition={setSplitPosition}
            isHoldComparing={activeCategory === 'filters' && isHoldComparing} onHoldCompareChange={setIsHoldComparing}
            onToggleSplit={() => setSplitActive((v) => !v)} onRightClickDeselect={resetToolStates}
            rotateOverlay={activeDoc && activeCategory === 'orientation' && !crop.isCropActive ? <RotateHandle rotationAngle={activeDoc.orientation?.rotation ?? 0} onRotateChange={(a) => updateOrientation(activeDoc.id, { rotation: a })} /> : undefined}
            selectionOverlay={activeDoc && activeCategory === 'selection' && selectionSubTab === 'vector' ? (scale) => (
              <>
                <SelectionOverlay imageWidth={activeDoc.currentWidth} imageHeight={activeDoc.currentHeight} zoomScale={scale} tool={selection.state.tool} paths={selection.state.paths} onCommitPath={selection.commitPath} onDeselect={selection.clearSelection} />
                {selection.state.floatingObject && (
                  <FloatingObjectOverlay floating={selection.state.floatingObject} zoomScale={scale} imageWidth={activeDoc.currentWidth} imageHeight={activeDoc.currentHeight} onUpdatePosition={selection.updateFloatingPosition} onCommit={handleCommitFloatingObject} onDiscard={selection.clearFloatingObject} />
                )}
              </>
            ) : undefined}
            isPrecisionToolActive={(activeCategory === 'orientation' && crop.isCropActive) || (activeCategory === 'selection' && selectionSubTab === 'vector') || (activeCategory === 'retouch') || (activeCategory === 'annotate')}
            cropOverlay={activeDoc && activeCategory === 'orientation' && crop.isCropActive && crop.cropRect ? (scale) => (
              <CropOverlay imageWidth={activeDoc.currentWidth} imageHeight={activeDoc.currentHeight} cropRect={crop.cropRect!} aspectRatio={crop.aspectRatio} zoomScale={scale} onChange={crop.updateCrop} onDragStateChange={crop.setIsDragging} onCancel={crop.cancelCrop} />
            ) : undefined}
            retouchOverlay={activeDoc && activeCategory === 'retouch' ? (scale) => (
              <RetouchOverlay imageSrc={activeDoc.imageSrc} imageWidth={activeDoc.currentWidth} imageHeight={activeDoc.currentHeight} zoomScale={scale} tool={retouch.tool} settings={retouch.settings} sourcePoint={retouch.sourcePoint} isAltPressed={retouch.isAltPressed} paintedMaskPaths={retouch.paintedMaskPaths} paintedMaskStrokes={retouch.paintedMaskStrokes} onAddMaskPath={retouch.addMaskPath} onClearMaskPaths={retouch.clearMaskPaths} onSetSourcePoint={retouch.setSourcePoint} onCommitTransform={handleApplyTransform} />
            ) : undefined}
            annotateOverlay={activeDoc && activeCategory === 'annotate' ? (scale) => (
              <AnnotateOverlay imageWidth={activeDoc.currentWidth} imageHeight={activeDoc.currentHeight} zoomScale={scale} settings={annotate.settings} items={annotate.items} onAddItem={annotate.addItem} />
            ) : undefined}
          />
        }
        toolsContent={
          <ToolsPanel
            activeCategory={activeCategory} onSelectCategory={(cat) => { setActiveCategory(cat); resetToolStates(); }}
            selectionSubTab={selectionSubTab} onSelectSelectionSubTab={handleSelectSelectionSubTab}
            activeDoc={activeDoc} onUpdateAdjustments={updateAdjustments} onResetAdjustments={resetAdjustments} onUpdateFilter={updateFilter} onResetFilter={resetFilter}
            splitActive={splitActive} onToggleSplit={() => setSplitActive((v) => !v)} splitPosition={splitPosition} onChangeSplitPosition={setSplitPosition}
            isHoldComparing={isHoldComparing} onHoldCompareStart={() => setIsHoldComparing(true)} onHoldCompareEnd={() => setIsHoldComparing(false)}
            onApplyTransform={handleApplyTransform} onPreviewScaleChange={setPreviewScale}
            retouchProps={{
              tool: retouch.tool, settings: retouch.settings, sourcePoint: retouch.sourcePoint,
              hasMask: retouch.paintedMaskPaths.length > 0 || selection.state.hasSelection,
              isProcessingInpaint: retouch.isProcessingInpaint, inpaintProgress: retouch.inpaintProgress,
              onSelectTool: retouch.setTool, onChangeRadius: retouch.setRadius, onChangeHardness: retouch.setHardness,
              onChangeOpacity: retouch.setOpacity, onChangeInpaintMethod: retouch.setInpaintMethod, onChangeInpaintPrompt: retouch.setInpaintPrompt,
              onClearSourcePoint: retouch.clearSourcePoint, onClearMask: retouch.clearMaskPaths,
              onExecuteInpaint: () => retouch.handleExecuteInpaint(activeDoc, handleApplyTransform, selection.state.paths),
            }}
            annotateProps={{
              settings: annotate.settings, itemCount: annotate.items.length, redoCount: annotate.undoneItems.length, isBaking: annotate.isBaking,
              onUpdateSettings: annotate.updateSettings, onUndoLast: annotate.undoLastItem, onRedoLast: annotate.redoLastItem,
              onClearAll: annotate.clearItems, onApplyToImage: () => annotate.applyAnnotations(activeDoc, handleApplyTransform),
            }}
            selectionProps={{
              state: selection.state, onSelectTool: selection.setTool, onChangeFeather: selection.setFeather,
              onToggleInvert: selection.toggleInvert, onClearSelection: selection.clearSelection,
              onCopySelection: handleCopySelection, onCutSelection: handleCutSelection,
              onPasteSelection: handlePasteSelection, canPaste: selection.canPaste,
              onCommitFloating: handleCommitFloatingObject, onDiscardFloating: selection.clearFloatingObject,
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
              onApplyCrop: handleApplyCrop, onCancelCrop: crop.cancelCrop, onResetCrop: () => activeDoc && crop.startCrop(activeDoc.currentWidth, activeDoc.currentHeight),
            }}
            onTabLimitExceeded={() => setTabLimitModalOpen(true)}
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
        onKeepUnsavedDoc={() => setUnsavedDoc(null)} onDiscardUnsavedDoc={() => { if (unsavedDoc) closeDocument(unsavedDoc.id); setUnsavedDoc(null) }}
        quotaWarning={quotaWarning} onDismissQuotaWarning={dismissQuotaWarning}
        transferModalOpen={transferModalOpen} onCloseTransferModal={() => setTransferModalOpen(false)}
        exportModalOpen={exportModalOpen} onCloseExportModal={() => setExportModalOpen(false)}
        exportAllModalOpen={exportAllModalOpen} onCloseExportAllModal={() => setExportAllModalOpen(false)}
        onExportSuccess={markDocumentExported} onExportAllSuccess={(ids) => ids.forEach((id) => markDocumentExported(id))}
        activeDoc={activeDoc} documents={documents}
        onTransferEdits={(srcId, targetIds, cats) => {
          transferEdits(srcId, targetIds, cats)
          if (targetIds.length > 0 && (!activeDocumentId || !targetIds.includes(activeDocumentId))) setActiveDocument(targetIds[0])
        }}
      />
    </>
  )
}

export default App
