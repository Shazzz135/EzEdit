import React from 'react'
import { X, PlusSquare, Replace, RefreshCw, Sparkles, Loader2 } from 'lucide-react'
import { type AIGeneratedResult } from './types'
import { STYLE_MODIFIER_PROMPTS } from './pollinationsService'

export interface AIPreviewModalProps {
  result: AIGeneratedResult | null
  hasActiveDocument: boolean
  isRegenerating?: boolean
  onOpenInNewTab: () => void
  onReplaceActiveImage: () => void
  onRegenerate: () => void
  onClose: () => void
}

export const AIPreviewModal: React.FC<AIPreviewModalProps> = ({
  result,
  hasActiveDocument,
  isRegenerating = false,
  onOpenInNewTab,
  onReplaceActiveImage,
  onRegenerate,
  onClose,
}) => {
  if (!result) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Generated AI Image Preview"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none"
    >
      <div className="w-full max-w-lg rounded-xl border border-[#2C2C3E] bg-[#14141E] text-[#F4F4F6] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#242434] bg-[#101018]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#60A5FA]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#E0E0EC]">
              Pollinations.ai Result Preview
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="p-1 rounded-md text-[#808096] hover:text-[#F4F4F6] hover:bg-[#222232] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image Preview Frame */}
        <div className="relative bg-[#0B0B10] flex items-center justify-center p-4 min-h-[260px] max-h-[55vh] overflow-hidden">
          <img
            src={result.url}
            alt={result.prompt}
            className={`max-w-full max-h-[50vh] object-contain rounded-lg border border-[#262638] shadow-lg transition-opacity ${
              isRegenerating ? 'opacity-40' : 'opacity-100'
            }`}
          />
          {isRegenerating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 text-xs text-[#E0E0EC]">
              <Loader2 className="w-6 h-6 text-[#60A5FA] animate-spin" />
              <span>Generating new variation...</span>
            </div>
          )}
        </div>

        {/* Metadata Bar */}
        <div className="px-4 py-2.5 bg-[#12121A] border-t border-[#222230] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#9090A6]">
          <p className="truncate max-w-[60%] text-[#D0D0E0]" title={result.prompt}>
            &ldquo;{result.prompt}&rdquo;
          </p>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-[#1E1E2C] border border-[#2C2C3E] text-[#60A5FA]">
              {result.width}&times;{result.height} ({result.aspectRatio})
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#1E1E2C] border border-[#2C2C3E]">
              {STYLE_MODIFIER_PROMPTS[result.style]?.label ?? result.style}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#1E1E2C] border border-[#2C2C3E]">
              Seed: {result.seed}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-[#161622] border-t border-[#242434] flex flex-col sm:flex-row items-center gap-2">
          <button
            type="button"
            disabled={isRegenerating}
            onClick={onOpenInNewTab}
            className="w-full sm:flex-1 py-2 px-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <PlusSquare className="w-3.5 h-3.5" />
            <span>Open in New Tab</span>
          </button>

          {hasActiveDocument && (
            <button
              type="button"
              disabled={isRegenerating}
              onClick={onReplaceActiveImage}
              className="w-full sm:flex-1 py-2 px-3 rounded-lg border border-[#383850] bg-[#1E1E2E] hover:bg-[#26263A] hover:border-[#60A5FA] disabled:opacity-40 text-[#F4F4F6] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Replace className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span>Replace Active Image</span>
            </button>
          )}

          <button
            type="button"
            disabled={isRegenerating}
            onClick={onRegenerate}
            title="Generate another variation with a new seed"
            className="w-full sm:w-auto py-2 px-3 rounded-lg border border-[#2A2A3C] bg-[#14141E] hover:bg-[#1C1C2A] disabled:opacity-40 text-[#C0C0D4] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#60A5FA] ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>Retry</span>
          </button>
        </div>
      </div>
    </div>
  )
}
