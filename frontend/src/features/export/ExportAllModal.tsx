import React, { useState } from 'react'
import { FolderDown, Check, Loader2, Sparkles } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { PrecisionSlider } from '@/components/ui/PrecisionSlider'
import { type DocumentState } from '@/types/document'
import { EXPORT_FORMAT_OPTIONS, type ExportFormat } from './types'
import {
  sanitizeExportBaseName,
  buildExportFilename,
  calculateExportDimensions,
  exportAllDocuments,
} from './exportService'

export interface ExportAllModalProps {
  isOpen: boolean
  documents: DocumentState[]
  onClose: () => void
  onExportAllSuccess?: (docIds: string[]) => void
}

export const ExportAllModal: React.FC<ExportAllModalProps> = ({
  isOpen,
  documents,
  onClose,
  onExportAllSuccess,
}) => {
  const [format, setFormat] = useState<ExportFormat>('image/png')
  const [qualityPercent, setQualityPercent] = useState<number>(92)
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  if (!isOpen || documents.length === 0) return null

  const activeFormatOption =
    EXPORT_FORMAT_OPTIONS.find((opt) => opt.id === format) ?? EXPORT_FORMAT_OPTIONS[0]

  const handleDownloadAll = async () => {
    setIsExporting(true)
    setExportError(null)
    setProgress({ current: 0, total: documents.length })
    try {
      const exportedIds = await exportAllDocuments(
        documents,
        format,
        qualityPercent,
        (current, total) => setProgress({ current, total })
      )
      onExportAllSuccess?.(exportedIds)
      onClose()
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to batch export images')
    } finally {
      setIsExporting(false)
      setProgress(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Export All Open Photos (${documents.length})`}>
      <div className="space-y-3.5 text-xs text-[#C0C0D0]">
        {/* 1. Format Selection */}
        <div className="space-y-1.5">
          <span className="block text-[11px] font-medium text-[#A0A0B4]">Batch Output Format</span>
          <div className="grid grid-cols-3 gap-2">
            {EXPORT_FORMAT_OPTIONS.map((opt) => {
              const selected = opt.id === format
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormat(opt.id)}
                  className={`flex flex-col items-start p-2 rounded border text-left transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[#1D2436] border-[#60A5FA] text-[#F4F4F6]'
                      : 'bg-[#12121A] border-[#262636] text-[#A0A0B4] hover:border-[#3A3A4E]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-xs">{opt.label}</span>
                    {selected && <Check className="w-3.5 h-3.5 text-[#60A5FA]" />}
                  </div>
                  <span className="text-[10px] text-[#78788C] mt-0.5">
                    {opt.supportsAlpha ? 'Alpha supported' : 'Opaque'}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-[#808094]">{activeFormatOption.description}</p>
        </div>

        {/* 2. Quality Compression Slider (JPEG & WebP) */}
        {activeFormatOption.supportsQuality && (
          <div className="p-2.5 rounded bg-[#12121A] border border-[#242432]">
            <PrecisionSlider
              label="Compression Quality"
              value={qualityPercent}
              min={1}
              max={100}
              step={1}
              defaultValue={92}
              unit="%"
              onChange={(v: number) => setQualityPercent(Math.round(v))}
            />
          </div>
        )}

        {/* 3. Open Tabs List Summary */}
        <div className="p-2.5 rounded bg-[#12121A] border border-[#242432] space-y-1.5 max-h-40 overflow-y-auto">
          <div className="flex items-center justify-between text-[11px] text-[#808094] pb-1 border-b border-[#1E1E2A]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
              Photos Queued for Export
            </span>
            <span className="font-mono text-[#60A5FA]">{documents.length} files</span>
          </div>
          {documents.map((doc, idx) => {
            const outName = buildExportFilename(sanitizeExportBaseName(doc.name), format)
            const dims = calculateExportDimensions(
              doc.currentWidth,
              doc.currentHeight,
              doc.orientation?.scaleX ?? 1,
              doc.orientation?.scaleY ?? 1,
              doc.orientation?.rotation ?? 0
            )
            return (
              <div
                key={doc.id}
                className="flex items-center justify-between py-1 text-[11px] border-b border-[#1A1A24] last:border-b-0"
              >
                <span className="font-mono text-[#E4E4F0] truncate max-w-[180px]" title={outName}>
                  {idx + 1}. {outName}
                </span>
                <span className="font-mono text-[10px] text-[#78788C]">
                  {dims.width} × {dims.height}px
                </span>
              </div>
            )
          })}
        </div>

        {exportError && (
          <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[11px]">
            {exportError}
          </div>
        )}

        {/* 4. Footer Actions */}
        <div className="pt-1 flex items-center justify-between gap-2">
          <span className="text-[11px] text-[#78788C]">
            {progress
              ? `Exporting ${progress.current} of ${progress.total}...`
              : `Exports all ${documents.length} open tabs`}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isExporting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadAll}
              disabled={isExporting}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white border-[#3B82F6]"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Exporting All...</span>
                </>
              ) : (
                <>
                  <FolderDown className="w-3.5 h-3.5" />
                  <span>Download All ({documents.length})</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
