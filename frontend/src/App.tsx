import React, { useState } from 'react'
import { WorkspaceShell } from '@/components/layout/WorkspaceShell'
import { TabBar } from '@/features/tabs/TabBar'
import { useDocumentStore } from '@/features/tabs/useDocumentStore'
import { PrecisionSlider } from '@/components/ui/PrecisionSlider'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Crop, Sliders, Wand2, Brush, Scissors, Sparkles, AlertTriangle } from 'lucide-react'
import { MAX_TAB_LIMIT, MAX_IMPORT_DIMENSION } from '@/types/document'

export const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<
    'orientation' | 'adjustments' | 'filters' | 'selection' | 'retouch' | 'ai'
  >('adjustments')

  const [tabLimitModalOpen, setTabLimitModalOpen] = useState(false)
  const [oversizedFile, setOversizedFile] = useState<{ file: File; width: number; height: number } | null>(null)
  const [unsavedDoc, setUnsavedDoc] = useState<{ id: string; name: string } | null>(null)

  const { getActiveDocument, updateAdjustments, closeDocument, addDocument } = useDocumentStore()
  const activeDoc = getActiveDocument()

  const toolCategories = [
    { id: 'orientation', label: 'Orientation', icon: Crop },
    { id: 'adjustments', label: 'Adjustments', icon: Sliders },
    { id: 'filters', label: 'Filters', icon: Wand2 },
    { id: 'selection', label: 'Selection', icon: Scissors },
    { id: 'retouch', label: 'Retouch', icon: Brush },
    { id: 'ai', label: 'AI Tools', icon: Sparkles },
  ] as const

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
      <div className="flex items-center gap-1 p-2 border-b border-[#242430] overflow-x-auto no-scrollbar flex-shrink-0 bg-[#14141A]">
        {toolCategories.map((cat) => {
          const Icon = cat.icon
          return (
            <Button
              key={cat.id}
              size="sm"
              isActive={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="text-xs whitespace-nowrap"
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </Button>
          )
        })}
      </div>

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

        {!activeDoc && (
          <div className="flex flex-col items-center justify-center p-6 text-[#707080] text-xs text-center">
            <span>Open or import an image to use editing tools</span>
          </div>
        )}
      </div>
    </div>
  )

  const canvasViewport = activeDoc ? (
    <div className="relative w-full h-full flex items-center justify-center p-4 overflow-hidden">
      <img
        src={activeDoc.imageSrc}
        alt={activeDoc.name}
        className="max-w-full max-h-full object-contain shadow-2xl rounded-[2px]"
      />
    </div>
  ) : undefined

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
    </>
  )
}

export default App
