import React, { useState, useEffect } from 'react'
import { Download, FileImage, Sparkles, Check, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { PrecisionSlider } from '@/components/ui/PrecisionSlider'
import { type DocumentState } from '@/types/document'
import { EXPORT_FORMAT_OPTIONS, type ExportFormat } from './types'
import {
  sanitizeExportBaseName, buildExportFilename, formatByteSize,
  calculateExportDimensions, renderExportBlob, triggerBrowserDownload,
} from './exportService'

export interface ExportModalProps {
  isOpen: boolean
  document?: DocumentState
  onClose: () => void
  onExportSuccess?: (docId: string) => void
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen, document: activeDoc, onClose, onExportSuccess,
}) => {
  const [filename, setFilename] = useState(() => sanitizeExportBaseName(activeDoc?.name || 'ezedit-export'))
  const [format, setFormat] = useState<ExportFormat>('image/png')
  const [qualityPercent, setQualityPercent] = useState<number>(92)
  const [estimatedBytes, setEstimatedBytes] = useState<number | null>(null)
  const [isEstimating, setIsEstimating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const docId = activeDoc?.id
  const docName = activeDoc?.name
  const [prevKey, setPrevKey] = useState(`${isOpen}_${docId}_${docName}`)
  const currentKey = `${isOpen}_${docId}_${docName}`
  if (prevKey !== currentKey) {
    setPrevKey(currentKey)
    if (isOpen && docName) {
      setFilename(sanitizeExportBaseName(docName))
      setExportError(null)
    }
  }

  // Real-time estimated file size calculation
  useEffect(() => {
    if (!isOpen || !activeDoc) return

    let cancelled = false
    const timer = setTimeout(async () => {
      setIsEstimating(true)
      try {
        const res = await renderExportBlob(activeDoc, {
          filename,
          format,
          qualityPercent,
        })
        if (!cancelled) {
          setEstimatedBytes(res.byteSize)
          setIsEstimating(false)
        }
      } catch {
        if (!cancelled) {
          setEstimatedBytes(null)
          setIsEstimating(false)
        }
      }
    }, 140)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [isOpen, activeDoc, format, qualityPercent, filename])

  if (!isOpen || !activeDoc) return null

  const activeFormatOption = EXPORT_FORMAT_OPTIONS.find((opt) => opt.id === format) ?? EXPORT_FORMAT_OPTIONS[0]
  const finalFilename = buildExportFilename(filename, format)
  const dims = calculateExportDimensions(
    activeDoc.currentWidth,
    activeDoc.currentHeight,
    activeDoc.orientation?.scaleX ?? 1,
    activeDoc.orientation?.scaleY ?? 1,
    activeDoc.orientation?.rotation ?? 0
  )

  const handleDownload = async () => {
    setIsExporting(true)
    setExportError(null)
    try {
      const result = await renderExportBlob(activeDoc, {
        filename,
        format,
        qualityPercent,
      })
      triggerBrowserDownload(result.blob, result.filename)
      onExportSuccess?.(activeDoc.id)
      onClose()
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to export image')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export High-Resolution Image">
      <div className="space-y-3.5 text-xs text-[#C0C0D0]">
        {/* 1. Filename Input */}
        <div className="space-y-1">
          <label htmlFor="export-filename-input" className="block text-[11px] font-medium text-[#A0A0B4]">
            File Name
          </label>
          <div className="flex items-center bg-[#101016] border border-[#2C2C3C] rounded focus-within:border-[#60A5FA] px-2.5 py-1.5">
            <input
              id="export-filename-input"
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="ezedit-export"
              className="flex-1 bg-transparent text-xs text-[#F4F4F6] focus:outline-none font-mono"
            />
            <span className="text-[11px] font-mono text-[#78788C] pl-1.5 select-none">
              .{activeFormatOption.extension}
            </span>
          </div>
        </div>

        {/* 2. Format Selection */}
        <div className="space-y-1.5">
          <span className="block text-[11px] font-medium text-[#A0A0B4]">Format</span>
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

        {/* 3. Quality Compression Slider (JPEG & WebP) */}
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

        {/* 4. Native Resolution & Estimated Size Summary */}
        <div className="p-2.5 rounded bg-[#12121A] border border-[#242432] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#808094] flex items-center gap-1.5">
              <FileImage className="w-3.5 h-3.5 text-[#60A5FA]" />
              Output Resolution
            </span>
            <span className="font-mono text-[11px] text-[#F4F4F6]">
              {dims.width} × {dims.height} px
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#808094] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
              Estimated File Size
            </span>
            <span className="font-mono text-[11px] text-[#60A5FA]">
              {isEstimating
                ? 'Calculating...'
                : estimatedBytes != null
                  ? `~${formatByteSize(estimatedBytes)}`
                  : 'Ready'}
            </span>
          </div>
          <div className="text-[10px] text-[#707084] pt-0.5 border-t border-[#1E1E2A]">
            Bakes all 13 WebGL adjustments, preset filters, crops, retouches &amp; orientation at full resolution.
          </div>
        </div>

        {exportError && (
          <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[11px]">
            {exportError}
          </div>
        )}

        {/* 5. Footer Actions */}
        <div className="pt-1 flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono text-[#78788C] truncate max-w-[180px]" title={finalFilename}>
            {finalFilename}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isExporting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              disabled={isExporting}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white border-[#3B82F6]"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {activeFormatOption.label}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
