import React, { useState } from 'react'
import { X, ArrowRightLeft, CheckSquare, Square, Sliders, Wand2 } from 'lucide-react'
import { type DocumentState, defaultAdjustments } from '@/types/document'
import { type TransferEditCategories } from '@/features/tabs/useDocumentStore'

export interface TransferEditsModalProps {
  isOpen: boolean
  sourceDoc?: DocumentState
  documents: DocumentState[]
  onClose: () => void
  onTransfer: (sourceId: string, targetIds: string[], categories: TransferEditCategories) => void
}

function getModifiedAdjustments(doc: DocumentState): Array<{ key: string; val: number }> {
  return (Object.keys(defaultAdjustments) as Array<keyof typeof defaultAdjustments>)
    .filter((k) => doc.adjustments[k] !== defaultAdjustments[k])
    .map((k) => ({ key: k, val: doc.adjustments[k] }))
}

function hasActiveSimpleOrFilterEdits(doc?: DocumentState): boolean {
  if (!doc) return false
  return getModifiedAdjustments(doc).length > 0 || doc.filter.preset !== 'none'
}

export const TransferEditsModal: React.FC<TransferEditsModalProps> = ({
  isOpen, sourceDoc, documents, onClose, onTransfer,
}) => {
  const [customSourceId, setCustomSourceId] = useState<string | null>(null)
  const [excludedTargets, setExcludedTargets] = useState<string[]>([])
  const [categories, setCategories] = useState<TransferEditCategories>({
    adjustments: true,
    filter: true,
  })

  if (!isOpen || !sourceDoc) return null

  const defaultSourceDoc = hasActiveSimpleOrFilterEdits(sourceDoc)
    ? sourceDoc
    : documents.find((d) => hasActiveSimpleOrFilterEdits(d)) || sourceDoc

  const effectiveSourceDoc = documents.find((d) => d.id === customSourceId) || defaultSourceDoc
  const targetDocs = documents.filter((d) => d.id !== effectiveSourceDoc.id)
  const activeTargetIds = targetDocs.map((d) => d.id).filter((id) => !excludedTargets.includes(id))

  const modifiedAdjustments = getModifiedAdjustments(effectiveSourceDoc)
  const adjustmentSummary =
    modifiedAdjustments.length > 0
      ? modifiedAdjustments
          .slice(0, 3)
          .map((m) => `${m.key}: ${m.val > 0 ? `+${m.val}` : m.val}`)
          .join(', ') + (modifiedAdjustments.length > 3 ? ` (+${modifiedAdjustments.length - 3} more)` : '')
      : 'All 13 sliders at 0.0'

  const filterSummary =
    effectiveSourceDoc.filter.preset === 'none'
      ? 'None'
      : `${effectiveSourceDoc.filter.preset} (${effectiveSourceDoc.filter.intensity}%)`

  const toggleTarget = (id: string) => {
    setExcludedTargets((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    if (activeTargetIds.length === targetDocs.length) setExcludedTargets(targetDocs.map((d) => d.id))
    else setExcludedTargets([])
  }

  const toggleCategory = (key: keyof TransferEditCategories) => {
    setCategories((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const canSubmit = !!(categories.adjustments || categories.filter) && activeTargetIds.length > 0

  const handleApply = () => {
    if (!canSubmit) return
    onTransfer(effectiveSourceDoc.id, activeTargetIds, {
      adjustments: !!categories.adjustments,
      filter: !!categories.filter,
    })
    setCustomSourceId(null)
    setExcludedTargets([])
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Transfer Edits to Other Photos"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none"
    >
      <div className="w-full max-w-md rounded-xl border border-[#2C2C3E] bg-[#14141E] text-[#F4F4F6] shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#242434] bg-[#101018]">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-[#60A5FA]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#E0E0EC]">
              Transfer Adjustments &amp; Filters
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close transfer modal"
            className="p-1 rounded-md text-[#808096] hover:text-[#F4F4F6] hover:bg-[#222232] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3.5 max-h-[75vh] overflow-y-auto text-xs">
          {/* 1. Source Photo Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9090A6]">
              1. Copy Values From (Source Photo)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {documents.map((doc) => {
                const isSelectedSource = doc.id === effectiveSourceDoc.id
                const docEdited = hasActiveSimpleOrFilterEdits(doc)
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => { setCustomSourceId(doc.id); setExcludedTargets([]); }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                      isSelectedSource
                        ? 'border-[#60A5FA] bg-[#1C1C2C] text-[#F4F4F6] font-semibold'
                        : 'border-[#262636] bg-[#161620] text-[#A0A0B4] hover:border-[#3A3A4E]'
                    }`}
                  >
                    <img src={doc.imageSrc} alt={doc.name} className="w-5 h-5 rounded object-cover" />
                    <span className="truncate max-w-[120px]">{doc.name}</span>
                    {docEdited && (
                      <span className="px-1.5 py-0.5 text-[9px] rounded bg-[#2563EB]/30 text-[#93C5FD] font-mono">Edited</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Tool Categories (Only Simple Adjustments & Preset Filters) */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9090A6]">
              2. Edits to Transfer
            </span>
            <button
              type="button"
              onClick={() => toggleCategory('adjustments')}
              className={`flex flex-col gap-1 p-2.5 rounded-lg border transition-colors cursor-pointer text-left ${
                categories.adjustments ? 'border-[#60A5FA] bg-[#1C1C2C]' : 'border-[#262636] bg-[#161620]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {categories.adjustments ? <CheckSquare className="w-4 h-4 text-[#60A5FA]" /> : <Square className="w-4 h-4 text-[#606074]" />}
                  <Sliders className="w-3.5 h-3.5 text-[#A0A0B8]" />
                  <span className="font-medium">Simple Adjustments</span>
                </div>
                <span className="text-[10px] font-mono text-[#60A5FA]">{modifiedAdjustments.length} / 13 active</span>
              </div>
              <span className="text-[10px] font-mono text-[#808098] pl-6 truncate w-full">{adjustmentSummary}</span>
            </button>

            <button
              type="button"
              onClick={() => toggleCategory('filter')}
              className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors cursor-pointer ${
                categories.filter ? 'border-[#60A5FA] bg-[#1C1C2C]' : 'border-[#262636] bg-[#161620]'
              }`}
            >
              <div className="flex items-center gap-2">
                {categories.filter ? <CheckSquare className="w-4 h-4 text-[#60A5FA]" /> : <Square className="w-4 h-4 text-[#606074]" />}
                <Wand2 className="w-3.5 h-3.5 text-[#A0A0B8]" />
                <span className="font-medium">Preset Filters</span>
              </div>
              <span className="text-[10px] font-mono text-[#60A5FA] capitalize">{filterSummary}</span>
            </button>
          </div>

          {/* 3. Select Target Photos */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9090A6]">
                3. Target Photos ({activeTargetIds.length}/{targetDocs.length})
              </span>
              {targetDocs.length > 1 && (
                <button type="button" onClick={toggleSelectAll} className="text-[11px] text-[#60A5FA] hover:underline cursor-pointer">
                  {activeTargetIds.length === targetDocs.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
              {targetDocs.map((doc) => {
                const checked = activeTargetIds.includes(doc.id)
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => toggleTarget(doc.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer ${
                      checked ? 'border-[#60A5FA] bg-[#1C1C2C]' : 'border-[#262636] bg-[#161620]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {checked ? <CheckSquare className="w-4 h-4 text-[#60A5FA] flex-shrink-0" /> : <Square className="w-4 h-4 text-[#606074] flex-shrink-0" />}
                      <img src={doc.imageSrc} alt={doc.name} className="w-7 h-7 rounded object-cover border border-[#2E2E42] flex-shrink-0" />
                      <span className="truncate font-medium text-[#E0E0EC]">{doc.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#808098] flex-shrink-0 ml-2">
                      {doc.currentWidth}&times;{doc.currentHeight}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-[#101018] border-t border-[#242434] flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg border border-[#2C2C3E] text-xs text-[#A0A0B4] hover:text-[#F4F4F6] cursor-pointer">
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleApply}
            className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transfer to {activeTargetIds.length} Photo{activeTargetIds.length === 1 ? '' : 's'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
