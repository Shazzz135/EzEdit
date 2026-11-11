import React, { useState, useEffect, useRef } from 'react'
import { WorkspaceShell } from '@/components/layout/WorkspaceShell'
import { ToolsPanel, type ToolCategory } from '@/components/layout/ToolsPanel'
import { WorkspaceModals } from '@/components/layout/WorkspaceModals'
import { MobileDocumentSelector } from '@/components/layout/MobileDocumentSelector'
import { TabBar } from '@/features/tabs/TabBar'
import { CanvasViewport } from '@/features/canvas/CanvasViewport'
import { useCropState, CropOverlay, executeCrop } from '@/features/crop'
import { useDocumentStore } from '@/features/tabs/useDocumentStore'
import { useDocumentPersistence } from '@/features/tabs/useDocumentPersistence'
import { MAX_IMPORT_DIMENSION, MAX_TAB_LIMIT } from '@/types/document'

export const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('adjustments')
  const [tabLimitModalOpen, setTabLimitModalOpen] = useState(false)
  const [oversizedFile, setOversizedFile] = useState<{ file: File; width: number; height: number } | null>(null)
  const [unsavedDoc, setUnsavedDoc] = useState<{ id: string; name: string } | null>(null)
  const mobileFileInputRef = useRef<HTMLInputElement>(null)

  const { quotaWarning, dismissQuotaWarning } = useDocumentPersistence()
  const {
    documents,
    activeDocumentId,
    setActiveDocument,
    getActiveDocument,
    updateAdjustments,
    closeDocument,
    addDocument,
    applyRasterTransform,
    undo,
    redo,
  } = useDocumentStore()
  const activeDoc = getActiveDocument()
  const crop = useCropState()

  // Undo/Redo keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
  useEffect(() => {
    const handleUndoRedo = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key === 'z' || e.key === 'Z') {
          if (e.shiftKey) {
            e.preventDefault()
            if (activeDoc && activeDoc.history && activeDoc.historyIndex < activeDoc.history.length - 1) {
              redo(activeDoc.id)
            }
          } else {
            e.preventDefault()
            if (activeDoc && activeDoc.historyIndex > 0) {
              undo(activeDoc.id)
            }
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault()
          if (activeDoc && activeDoc.history && activeDoc.historyIndex < activeDoc.history.length - 1) {
            redo(activeDoc.id)
          }
        }
      }
    }
    window.addEventListener('keydown', handleUndoRedo)
    return () => window.removeEventListener('keydown', handleUndoRedo)
  }, [activeDoc, undo, redo])

  const handleApplyCrop = async () => {
    if (!activeDoc || !crop.cropRect) return
    try {
      const result = await executeCrop(activeDoc.imageSrc, crop.cropRect)
      applyRasterTransform(activeDoc.id, {
        url: result.url,
        blob: result.blob,
        width: result.width,
        height: result.height,
      })
      crop.cancelCrop()
    } catch (err) {
      console.error('Failed to apply crop:', err)
    }
  }

  const handleDownscaleAndImport = () => {
    if (!oversizedFile) return
    const { file, width, height } = oversizedFile
    const scale = MAX_IMPORT_DIMENSION / Math.max(width, height)
    const targetW = Math.round(width * scale)
    const targetH = Math.round(height * scale)

    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, targetW, targetH)
        canvas.toBlob((blob) => {
          if (blob) {
            const downscaledUrl = URL.createObjectURL(blob)
            addDocument({
              name: file.name,
              originalWidth: targetW,
              originalHeight: targetH,
              currentWidth: targetW,
              currentHeight: targetH,
              imageSrc: downscaledUrl,
              imageBlob: blob,
            })
          }
          URL.revokeObjectURL(url)
        }, file.type || 'image/png')
      }
    }
    img.src = url
    setOversizedFile(null)
  }

  const handleDropFile = (file: File) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = img
      if (width > MAX_IMPORT_DIMENSION || height > MAX_IMPORT_DIMENSION) {
        setOversizedFile({ file, width, height })
        URL.revokeObjectURL(objectUrl)
        return
      }
      addDocument({
        name: file.name,
        originalWidth: width,
        originalHeight: height,
        currentWidth: width,
        currentHeight: height,
        imageSrc: objectUrl,
        imageBlob: file,
      })
    }
    img.src = objectUrl
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
          canUndo,
          canRedo,
          mobileSelector,
        }}
        canvasContent={
          <CanvasViewport
            document={activeDoc}
            onDropImage={handleDropFile}
            isPrecisionToolActive={crop.isCropActive}
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
            onSelectCategory={setActiveCategory}
            activeDoc={activeDoc}
            onUpdateAdjustments={updateAdjustments}
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
        onDiscardUnsavedDoc={() => { if (unsavedDoc) closeDocument(unsavedDoc.id); setUnsavedDoc(null); }}
        quotaWarning={quotaWarning}
        onDismissQuotaWarning={dismissQuotaWarning}
      />
    </>
  )
}

export default App
