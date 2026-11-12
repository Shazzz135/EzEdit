import React, { useState, useEffect } from 'react'
import {
  Eraser,
  Sparkles,
  RotateCcw,
  FlipHorizontal,
  Scissors,
  CheckCircle2,
  Circle,
  KeyRound,
} from 'lucide-react'
import { PrecisionSlider } from '@/components/ui/PrecisionSlider'
import { type RemoveBackgroundOptions } from './backgroundRemoval'

const STORAGE_KEY_REMOVE_BG = 'ezedit_remove_bg_key'

export interface CutoutPanelProps {
  hasSelection?: boolean
  isProcessing?: boolean
  onExecuteAutoCutout: (options: RemoveBackgroundOptions) => Promise<void>
  onExecuteSelectionCutout: (invert: boolean) => Promise<void>
}

export const CutoutPanel: React.FC<CutoutPanelProps> = ({
  hasSelection = false,
  isProcessing = false,
  onExecuteAutoCutout,
  onExecuteSelectionCutout,
}) => {
  const [tolerance, setTolerance] = useState(25)
  const [feather, setFeather] = useState(2)
  const [contiguous, setContiguous] = useState(true)
  const [invert, setInvert] = useState(false)
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY_REMOVE_BG) || '' } catch { return '' }
  })

  useEffect(() => {
    try {
      if (apiKey) localStorage.setItem(STORAGE_KEY_REMOVE_BG, apiKey)
      else localStorage.removeItem(STORAGE_KEY_REMOVE_BG)
    } catch { /* storage restricted */ }
  }, [apiKey])

  const handleResetDefaults = () => {
    setTolerance(25)
    setFeather(2)
    setContiguous(true)
    setInvert(false)
  }

  const handleAutoClick = async () => {
    if (isProcessing) return
    await onExecuteAutoCutout({
      tolerance,
      feather,
      contiguous,
      invert,
      removeBgApiKey: apiKey.trim() || undefined,
      useAi: true,
    })
  }

  return (
    <div className="flex flex-col gap-3 pb-4 select-none">
      {/* Top Header with Reset */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#222230]">
        <div className="flex items-center gap-2">
          <Eraser className="w-4 h-4 text-[#60A5FA]" />
          <span className="text-xs font-bold text-[#E0E0EC] uppercase tracking-wider">
            Background Removal
          </span>
        </div>
        <button
          type="button"
          onClick={handleResetDefaults}
          title="Reset parameters to defaults"
          className="text-[11px] text-[#808096] hover:text-[#D0D0E0] flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3 text-[#60A5FA]" />
          <span>Reset</span>
        </button>
      </div>

      {/* Main Remove Background Action */}
      <button
        type="button"
        onClick={handleAutoClick}
        disabled={isProcessing}
        className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
          isProcessing
            ? 'border-[#2D2D3E] bg-[#161622] text-[#606070] cursor-wait'
            : 'border-[#38384C] hover:border-[#60A5FA] bg-[#161622]/80 hover:bg-[#1A1A2A] text-[#F4F4F6] cursor-pointer shadow-sm hover:shadow-[#60A5FA]/10'
        }`}
      >
        <Sparkles className="w-4 h-4 text-[#60A5FA]" />
        <span>{isProcessing ? 'Removing Background...' : apiKey.trim() ? 'Remove Background (remove.bg)' : 'Remove Background (AI)'}</span>
      </button>

      {/* remove.bg API Key Configuration */}
      <div className="flex flex-col gap-1 p-2 bg-[#12121A] border border-[#20202E] rounded-lg">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#808098]">
          <KeyRound className="w-3 h-3 text-[#60A5FA]" />
          <span>remove.bg API Key (Optional)</span>
        </div>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Paste API key for remove.bg..."
          className="w-full px-2 py-1 bg-[#181824] border border-[#2A2A3C] rounded text-xs text-[#E0E0EC] placeholder:text-[#505060] focus:border-[#60A5FA] outline-none"
        />
        <span className="text-[10px] text-[#606075]">
          Uses remove.bg API when key is provided, or built-in neural AI when blank.
        </span>
      </div>

      {/* Selection-Based Cutouts (if vector selection exists) */}
      {hasSelection && (
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-[#808096] uppercase tracking-wider">
            Selection Cutout
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onExecuteSelectionCutout(false)}
              disabled={isProcessing}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border border-[#28283A] bg-[#161622]/60 hover:bg-[#1A1A28] text-xs font-medium text-[#F4F4F6] transition-colors cursor-pointer"
            >
              <Scissors className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span>Keep Subject</span>
            </button>
            <button
              type="button"
              onClick={() => onExecuteSelectionCutout(true)}
              disabled={isProcessing}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border border-[#28283A] bg-[#161622]/60 hover:bg-[#1A1A28] text-xs font-medium text-[#F4F4F6] transition-colors cursor-pointer"
            >
              <Eraser className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span>Erase Subject</span>
            </button>
          </div>
        </div>
      )}

      {/* Bold Separator */}
      <div className="h-[2px] bg-[#323246] w-full rounded-full my-0.5" />

      {/* Threshold / Tolerance Slider */}
      <div className="flex flex-col gap-2">
        <PrecisionSlider
          label="Color Threshold"
          value={tolerance}
          onChange={setTolerance}
          min={1}
          max={100}
          step={1}
          defaultValue={25}
          unit="%"
        />
        <PrecisionSlider
          label="Edge Feather"
          value={feather}
          onChange={setFeather}
          min={0}
          max={20}
          step={1}
          defaultValue={2}
          unit=" px"
        />
      </div>

      {/* Bold Separator */}
      <div className="h-[2px] bg-[#323246] w-full rounded-full my-0.5" />

      {/* Advanced Toggles */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setContiguous((v) => !v)}
          className="flex items-center justify-between p-2 rounded-lg border border-[#262636] bg-[#161622]/60 hover:bg-[#1A1A28] text-xs text-[#C0C0D0] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {contiguous ? <CheckCircle2 className="w-3.5 h-3.5 text-[#60A5FA]" /> : <Circle className="w-3.5 h-3.5 text-[#606070]" />}
            <span>Contiguous Edge Fill</span>
          </div>
          <span className="text-[10px] text-[#707080] font-mono">{contiguous ? 'Edges Only' : 'Global'}</span>
        </button>

        <button
          type="button"
          onClick={() => setInvert((v) => !v)}
          className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
            invert ? 'border-[#60A5FA] bg-[#1E1E2C] text-[#60A5FA]' : 'border-[#262636] bg-[#161622]/60 hover:bg-[#1A1A28] text-[#C0C0D0]'
          }`}
        >
          <div className="flex items-center gap-2">
            <FlipHorizontal className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>Invert Cutout Mask</span>
          </div>
          <span className="text-[10px] font-mono">{invert ? 'Inverted' : 'Standard'}</span>
        </button>
      </div>
    </div>
  )
}
