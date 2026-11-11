import React, { useState } from 'react'
import { WorkspaceShell } from '@/components/layout/WorkspaceShell'
import { TabBar } from '@/features/tabs/TabBar'
import { CanvasViewport } from '@/features/canvas/CanvasViewport'
import { useDocumentStore } from '@/features/tabs/useDocumentStore'
import { useDocumentPersistence } from '@/features/tabs/useDocumentPersistence'
import { PrecisionSlider } from '@/components/ui/PrecisionSlider'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Dropdown } from '@/components/ui/Dropdown'
import { Crop, Sliders, Wand2, Brush, Scissors, Sparkles, AlertTriangle } from 'lucide-react'
import { MAX_TAB_LIMIT, MAX_IMPORT_DIMENSION } from '@/types/document'

type ToolCategory = 'orientation' | 'adjustments' | 'filters' | 'selection' | 'retouch' | 'ai'

const TOOL_CATEGORIES = [
  { id: 'orientation', label: 'Orientation & Alignment', icon: Crop },
  { id: 'adjustments', label: 'Simple Adjustments', icon: Sliders },
  { id: 'filters', label: 'Preset Filters', icon: Wand2 },
  { id: 'selection', label: 'Precise Selection', icon: Scissors },
  { id: 'retouch', label: 'Advanced Retouching', icon: Brush },
  { id: 'ai', label: 'AI Tools (Pollinations.ai)', icon: Sparkles },
] as const

export const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('adjustments')
  const [tabLimitModalOpen, setTabLimitModalOpen] = useState(false)
  const [oversizedFile, setOversizedFile] = useState<{ file: File; width: number; height: number } | null>(null)
  const [unsavedDoc, setUnsavedDoc] = useState<{ id: string; name: string } | null>(null)

  const { quotaWarning, dismissQuotaWarning } = useDocumentPersistence()
  const { getActiveDocument, updateAdjustments, closeDocument, addDocument } = useDocumentStore()
  const activeDoc = getActiveDocument()

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

  const toolsPanel = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Category Dropdown Selector at Top of Tools Panel */}
      <div className="p-2.5 border-b border-[#242430] bg-[#14141A] flex-shrink-0">
        <Dropdown
          label="Tool Category"
          options={TOOL_CATEGORIES}
          selectedId={activeCategory}
          onSelect={(id) => setActiveCategory(id as ToolCategory)}
        />
      </div>

      {/* Category Content Pane */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {activeDoc && activeCategory === 'adjustments' && (
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider">
              Light & Color
            </h4>
            <PrecisionSlider
              label="Exposure"
              value={activeDoc.adjustments.exposure}
              onChange={(v) => updateAdjustments(activeDoc.id, { exposure: v })}
              min={-5.0}
              max={5.0}
              step={0.1}
              defaultValue={0.0}
              unit=" EV"
            />
            <PrecisionSlider
              label="Contrast"
              value={activeDoc.adjustments.contrast}
              onChange={(v) => updateAdjustments(activeDoc.id, { contrast: v })}
              min={-100.0}
              max={100.0}
              step={0.1}
              defaultValue={0.0}
            />
          </div>
        )}

        {activeDoc && activeCategory !== 'adjustments' && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-[#707080] text-xs">
            <span>
              {TOOL_CATEGORIES.find((c) => c.id === activeCategory)?.label} tools will activate in Milestone{' '}
              {activeCategory === 'orientation' ? 4 : activeCategory === 'filters' ? 5 : activeCategory === 'selection' ? 6 : activeCategory === 'retouch' ? 7 : 8}
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

  const canvasViewport = (
    <CanvasViewport
      document={activeDoc}
      onDropImage={handleDropFile}
    />
  )

  return (
    <>
      <WorkspaceShell
        canvasContent={canvasViewport}
        toolsContent={toolsPanel}
        tabBarContent={
          <TabBar
            onTabLimitExceeded={() => setTabLimitModalOpen(true)}
            onDimensionExceeded={(file, width, height) => setOversizedFile({ file, width, height })}
            onUnsavedClosePrompt={(id, name) => setUnsavedDoc({ id, name })}
          />
        }
      />

      <Modal isOpen={tabLimitModalOpen} onClose={() => setTabLimitModalOpen(false)} title="Maximum Tabs Reached">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-[#C0C0D0] space-y-2">
            <p>You have reached the maximum limit of {MAX_TAB_LIMIT} open document tabs.</p>
            <p className="text-[#808090]">Please close an open tab before importing a new image to maintain optimal browser performance.</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" size="sm" onClick={() => setTabLimitModalOpen(false)}>Understood</Button>
        </div>
      </Modal>

      <Modal isOpen={!!oversizedFile} onClose={() => setOversizedFile(null)} title="Large Image Safeguard">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-[#C0C0D0] space-y-2">
            <p>
              This image is <strong className="text-[#F4F4F6]">{oversizedFile?.width} × {oversizedFile?.height}px</strong>, which exceeds the recommended {MAX_IMPORT_DIMENSION}px hardware dimension limit.
            </p>
            <p className="text-[#808090]">Would you like to downscale it to {MAX_IMPORT_DIMENSION}px to prevent high-resolution GPU memory lag?</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOversizedFile(null)}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleDownscaleAndImport}>Downscale & Import</Button>
        </div>
      </Modal>

      <Modal isOpen={!!unsavedDoc} onClose={() => setUnsavedDoc(null)} title="Unsaved Modifications">
        <p className="text-xs text-[#C0C0D0]">
          Document &quot;{unsavedDoc?.name}&quot; has unexported changes. Are you sure you want to close it?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setUnsavedDoc(null)}>Keep Tab</Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              if (unsavedDoc) closeDocument(unsavedDoc.id)
              setUnsavedDoc(null)
            }}
            className="text-red-400 border-red-500/30 hover:bg-red-500/10"
          >
            Discard & Close
          </Button>
        </div>
      </Modal>
      <Modal isOpen={!!quotaWarning} onClose={dismissQuotaWarning} title="Storage Quota Warning">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-[#C0C0D0] space-y-2">
            <p>
              Device storage is <strong className="text-amber-400">{Math.round(quotaWarning?.percentUsed || 0)}%</strong> used.
            </p>
            <p className="text-[#808090]">
              To prevent data loss, please close unneeded document tabs or free device storage space.
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" size="sm" onClick={dismissQuotaWarning}>Understood</Button>
        </div>
      </Modal>
    </>
  )
}

export default App
