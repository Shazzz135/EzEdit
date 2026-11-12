import React from 'react'
import { Sparkles, Dices, Loader2, AlertCircle, Wand2, CheckCircle2, Circle, ImagePlus, Image } from 'lucide-react'
import { MAX_PROMPT_LENGTH, type AIMode, type AIAspectRatio, type AIStyleModifier } from './types'
import { ASPECT_RATIO_DIMENSIONS, STYLE_MODIFIER_PROMPTS, inferAspectRatio } from './pollinationsService'

export interface AIPanelProps {
  mode?: AIMode
  hasActiveDocument?: boolean
  activeWidth?: number
  activeHeight?: number
  prompt: string
  aspectRatio: AIAspectRatio
  style: AIStyleModifier
  seed: number
  enhance: boolean
  isGenerating: boolean
  error: string | null
  onChangeMode?: (mode: AIMode) => void
  onChangePrompt: (p: string) => void
  onChangeAspectRatio: (r: AIAspectRatio) => void
  onChangeStyle: (s: AIStyleModifier) => void
  onChangeSeed: (seed: number) => void
  onRandomizeSeed: () => void
  onToggleEnhance: () => void
  onGenerate: () => void
}

const ASPECT_OPTIONS: AIAspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4']
const STYLE_OPTIONS: AIStyleModifier[] = [
  'photorealistic', 'cinematic', 'digital-art', 'anime',
  'watercolor', 'cyberpunk', 'oil-painting', 'none',
]

export const AIPanel: React.FC<AIPanelProps> = ({
  mode = 'generate', hasActiveDocument = false, activeWidth, activeHeight,
  prompt, aspectRatio, style, seed, enhance, isGenerating, error,
  onChangeMode, onChangePrompt, onChangeAspectRatio, onChangeStyle,
  onChangeSeed, onRandomizeSeed, onToggleEnhance, onGenerate,
}) => {
  const isEditMode = mode === 'edit' && hasActiveDocument
  const editRatio = activeWidth && activeHeight ? inferAspectRatio(activeWidth, activeHeight) : '1:1'

  return (
    <div className="flex flex-col gap-3.5 p-3 bg-[#12121A] text-[#F4F4F6] select-none text-xs rounded-lg border border-[#222230]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#222230] pb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#60A5FA]" />
          <span className="text-xs font-bold text-[#E0E0EC] uppercase tracking-wider">
            Pollinations.ai Studio
          </span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1A1A28] text-[#60A5FA] border border-[#2A2A3E]">
          {isEditMode ? 'Edit (Klein)' : 'Flux'}
        </span>
      </div>

      {/* Mode Switcher */}
      {onChangeMode && (
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#161622] rounded-lg border border-[#222230]">
          <button
            type="button"
            onClick={() => onChangeMode('generate')}
            disabled={isGenerating}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              !isEditMode
                ? 'bg-[#222234] text-[#60A5FA] border border-[#60A5FA]/40'
                : 'text-[#9090A4] hover:text-[#E0E0EC]'
            }`}
          >
            <ImagePlus className="w-3.5 h-3.5" />
            <span>Generate New</span>
          </button>
          <button
            type="button"
            onClick={() => hasActiveDocument && onChangeMode('edit')}
            disabled={isGenerating || !hasActiveDocument}
            title={hasActiveDocument ? 'Edit the active canvas image with AI' : 'Open an image first to edit it'}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-[11px] font-medium transition-colors ${
              !hasActiveDocument
                ? 'opacity-40 cursor-not-allowed text-[#707084]'
                : isEditMode
                  ? 'bg-[#222234] text-[#60A5FA] border border-[#60A5FA]/40 cursor-pointer'
                  : 'text-[#9090A4] hover:text-[#E0E0EC] cursor-pointer'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Edit Current</span>
          </button>
        </div>
      )}

      {/* Prompt Input (max 300 chars) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="ai-prompt-input" className="text-[11px] font-medium text-[#9090A6] uppercase tracking-wider">
            {isEditMode ? 'Edit Instruction' : 'Image Prompt'}
          </label>
          <span className={`text-[10px] font-mono ${prompt.length >= MAX_PROMPT_LENGTH ? 'text-[#F59E0B]' : 'text-[#707086]'}`}>
            {prompt.length}/{MAX_PROMPT_LENGTH}
          </span>
        </div>
        <textarea
          id="ai-prompt-input"
          rows={3}
          maxLength={MAX_PROMPT_LENGTH}
          placeholder={
            isEditMode
              ? 'Describe how to modify the current image (e.g., change sky to sunset)...'
              : 'Describe the image you want to create...'
          }
          value={prompt}
          onChange={(e) => onChangePrompt(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
          disabled={isGenerating}
          className="w-full bg-[#161622] border border-[#2A2A3C] rounded-lg p-2.5 text-xs text-[#F4F4F6] placeholder-[#606076] focus:outline-none focus:border-[#60A5FA] resize-none"
        />
      </div>

      {/* Aspect Ratio Selector OR Locked Active Image Scale */}
      {isEditMode && activeWidth && activeHeight ? (
        <div className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-[#161622] border border-[#262636] text-[11px]">
          <span className="text-[#9090A6] uppercase tracking-wider font-medium">Scale &amp; Ratio</span>
          <span className="font-mono text-[#60A5FA]">{activeWidth}&times;{activeHeight} ({editRatio})</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-[#9090A6] uppercase tracking-wider">Aspect Ratio</span>
          <div className="grid grid-cols-5 gap-1 p-1 bg-[#161622] rounded-lg border border-[#222230]">
            {ASPECT_OPTIONS.map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => onChangeAspectRatio(ratio)}
                disabled={isGenerating}
                title={ASPECT_RATIO_DIMENSIONS[ratio].label}
                className={`py-1.5 px-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  aspectRatio === ratio
                    ? 'bg-[#222234] text-[#60A5FA] font-semibold border border-[#60A5FA]/40'
                    : 'text-[#9090A4] hover:text-[#E0E0EC] hover:bg-[#1C1C2A]'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Style Modifier Selector */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-[#9090A6] uppercase tracking-wider">Style Modifier</span>
        <div className="grid grid-cols-2 gap-1.5">
          {STYLE_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChangeStyle(s)}
              disabled={isGenerating}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] transition-colors cursor-pointer ${
                style === s
                  ? 'border-[#60A5FA] bg-[#1E1E2E] text-[#F4F4F6] font-medium'
                  : 'border-[#262636] bg-[#161622]/70 hover:bg-[#1C1C2A] text-[#A0A0B4]'
              }`}
            >
              <Wand2 className={`w-3 h-3 ${style === s ? 'text-[#60A5FA]' : 'text-[#707086]'}`} />
              <span className="truncate">{STYLE_MODIFIER_PROMPTS[s].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Seed & Enhance Controls */}
      <div className="flex flex-col gap-2 pt-1 border-t border-[#222230]">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="ai-seed-input" className="text-[11px] font-medium text-[#9090A6] uppercase tracking-wider">
            Seed
          </label>
          <div className="flex items-center gap-1.5">
            <input
              id="ai-seed-input"
              type="number"
              value={seed}
              onChange={(e) => onChangeSeed(Number(e.target.value) || 0)}
              disabled={isGenerating}
              className="w-28 bg-[#161622] border border-[#2A2A3C] rounded px-2 py-1 text-xs font-mono text-[#E0E0EC] focus:outline-none focus:border-[#60A5FA]"
            />
            <button
              type="button"
              onClick={onRandomizeSeed}
              disabled={isGenerating}
              title="Randomize Seed"
              className="p-1.5 rounded bg-[#181826] hover:bg-[#222234] border border-[#2A2A3C] text-[#60A5FA] transition-colors cursor-pointer"
            >
              <Dices className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleEnhance}
          disabled={isGenerating}
          className="flex items-center justify-between p-2 rounded-lg border border-[#262636] bg-[#161622]/60 hover:bg-[#1A1A28] text-xs text-[#C0C0D0] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {enhance ? <CheckCircle2 className="w-3.5 h-3.5 text-[#60A5FA]" /> : <Circle className="w-3.5 h-3.5 text-[#606070]" />}
            <span>Enhance Prompt Details</span>
          </div>
          <span className="text-[10px] font-mono text-[#808096]">{enhance ? 'Enabled' : 'Raw'}</span>
        </button>
      </div>

      {/* Error Notification */}
      {error && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#2A1418] border border-[#EF4444]/40 text-[#FCA5A5] text-[11px] leading-relaxed">
          <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Button */}
      <button
        type="button"
        disabled={!prompt.trim() || isGenerating}
        onClick={onGenerate}
        className="w-full py-2.5 px-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{isEditMode ? 'Editing via Pollinations.ai...' : 'Generating via Pollinations.ai...'}</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>{isEditMode ? 'Edit Current Image' : 'Generate Image'}</span>
          </>
        )}
      </button>
    </div>
  )
}
