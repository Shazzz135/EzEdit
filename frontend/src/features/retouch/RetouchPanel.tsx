import React from 'react'
import { Stamp, Sparkles, Target, Eraser, RotateCcw, Info, Loader2, Cpu } from 'lucide-react'
import { type RetouchTool, type RetouchSettings, type InpaintingMethod, type Point } from './types'
import { PrecisionSlider } from '@/components/ui/PrecisionSlider'

export interface RetouchPanelProps {
  tool: RetouchTool
  settings: RetouchSettings
  sourcePoint: Point | null
  hasMask?: boolean
  isProcessingInpaint?: boolean
  inpaintProgress?: number
  onSelectTool: (t: RetouchTool) => void
  onChangeRadius: (r: number) => void
  onChangeHardness: (h: number) => void
  onChangeOpacity: (o: number) => void
  onChangeInpaintMethod: (m: InpaintingMethod) => void
  onChangeInpaintPrompt: (p: string) => void
  onClearSourcePoint: () => void
  onClearMask?: () => void
  onExecuteInpaint?: () => void
}

export const RetouchPanel: React.FC<RetouchPanelProps> = ({
  tool, settings, sourcePoint, hasMask = false, isProcessingInpaint = false, inpaintProgress = 0,
  onSelectTool, onChangeRadius, onChangeHardness, onChangeOpacity,
  onChangeInpaintMethod, onChangeInpaintPrompt, onClearSourcePoint, onClearMask, onExecuteInpaint,
}) => {
  const isRemoveMode = tool === 'object-remove'

  return (
    <div className="flex flex-col gap-4 p-4 bg-[#12121A] text-[#F4F4F6] select-none text-xs">
      {/* ================= SECTION 1: RETOUCH ================= */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[#222230] pb-2">
          <div className="flex items-center gap-1.5">
            <Stamp className="w-4 h-4 text-[#60A5FA]" />
            <span className="text-xs font-bold text-[#E0E0EC] uppercase tracking-wider">Retouch</span>
          </div>
          {!isRemoveMode && sourcePoint && (
            <button
              type="button"
              onClick={onClearSourcePoint}
              title="Clear sample anchor (Right-Click)"
              className="text-[11px] text-[#808096] hover:text-[#D0D0E0] flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-[#60A5FA]" />
              <span>Reset Anchor</span>
            </button>
          )}
        </div>

        {/* Retouch 3-Tool Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#161622] rounded-lg border border-[#222230]">
          <button
            type="button"
            onClick={() => onSelectTool('clone-stamp')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-md transition-colors cursor-pointer ${
              tool === 'clone-stamp' ? 'bg-[#222234] text-[#60A5FA] font-medium shadow-xs border border-[#60A5FA]/40' : 'text-[#9090A0] hover:text-[#E0E0EC] hover:bg-[#1A1A28]'
            }`}
          >
            <Stamp className="w-4 h-4 mb-1 text-[#60A5FA]" />
            <span className="text-[10px]">Clone</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('healing-brush')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-md transition-colors cursor-pointer ${
              tool === 'healing-brush' ? 'bg-[#222234] text-[#60A5FA] font-medium shadow-xs border border-[#60A5FA]/40' : 'text-[#9090A0] hover:text-[#E0E0EC] hover:bg-[#1A1A28]'
            }`}
          >
            <Sparkles className="w-4 h-4 mb-1 text-[#60A5FA]" />
            <span className="text-[10px]">Heal</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('spot-heal')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-md transition-colors cursor-pointer ${
              tool === 'spot-heal' ? 'bg-[#222234] text-[#60A5FA] font-medium shadow-xs border border-[#60A5FA]/40' : 'text-[#9090A0] hover:text-[#E0E0EC] hover:bg-[#1A1A28]'
            }`}
          >
            <Target className="w-4 h-4 mb-1 text-[#60A5FA]" />
            <span className="text-[10px]">Spot</span>
          </button>
        </div>

        {!isRemoveMode && (
          <>
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#161622]/60 border border-[#222232] text-[#A0A0B2] text-[11px] leading-relaxed">
              <Info className="w-3.5 h-3.5 mt-0.5 text-[#60A5FA] flex-shrink-0" />
              <div>
                {tool === 'spot-heal' && <span>Click directly on blemishes or spots to auto-blend with surrounding texture.</span>}
                {tool !== 'spot-heal' && !sourcePoint && <span><strong className="text-[#60A5FA]">Right-Click</strong> (or hold Alt+Click) on the canvas to set the sample anchor.</span>}
                {tool !== 'spot-heal' && sourcePoint && <span>Anchor set at ({sourcePoint.x}, {sourcePoint.y}). Drag to retouch, or right-click to move anchor.</span>}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <PrecisionSlider label="Brush Radius" value={settings.radius} min={2} max={150} step={1} unit="px" defaultValue={24} onChange={onChangeRadius} />
              <PrecisionSlider label="Edge Hardness" value={Math.round(settings.hardness * 100)} min={0} max={100} step={1} unit="%" defaultValue={50} onChange={(v) => onChangeHardness(v / 100)} />
              {tool !== 'spot-heal' && (
                <PrecisionSlider label="Opacity" value={Math.round(settings.opacity * 100)} min={10} max={100} step={1} unit="%" defaultValue={100} onChange={(v) => onChangeOpacity(v / 100)} />
              )}
            </div>
          </>
        )}
      </div>

      {/* ================= BOLD SECTION SEPARATOR ================= */}
      <div className="h-[2px] bg-[#323246] w-full rounded-full" />

      {/* ================= SECTION 2: REMOVE ================= */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[#222230] pb-2">
          <div className="flex items-center gap-1.5">
            <Eraser className="w-4 h-4 text-[#EF4444]" />
            <span className="text-xs font-bold text-[#E0E0EC] uppercase tracking-wider">Remove</span>
          </div>
          {hasMask && onClearMask && (
            <button
              type="button"
              onClick={onClearMask}
              title="Clear painted mask (Right-Click)"
              className="text-[11px] text-[#808096] hover:text-[#D0D0E0] flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-[#60A5FA]" />
              <span>Clear Mask</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onSelectTool('object-remove')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
            isRemoveMode
              ? 'border-[#EF4444] bg-[#221A22] text-[#F4F4F6] shadow-xs'
              : 'border-[#262636] bg-[#161622] hover:bg-[#1A1A28] text-[#A0A0B2] hover:text-[#E0E0EC]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Eraser className="w-4 h-4 text-[#EF4444]" />
            <span>Mask Object Brush</span>
          </div>
          <span className={`text-[10px] font-mono ${isRemoveMode ? 'text-[#EF4444]' : 'text-[#707082]'}`}>
            {isRemoveMode ? 'Active' : 'Select Tool'}
          </span>
        </button>

        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#161622]/60 border border-[#222232] text-[#A0A0B2] text-[11px] leading-relaxed">
          <Info className="w-3.5 h-3.5 mt-0.5 text-[#EF4444] flex-shrink-0" />
          <span>Paint over unwanted objects with the mask brush, then click Remove Masked Object below. Right-click to clear mask.</span>
        </div>

        <PrecisionSlider
          label="Mask Brush Size"
          value={settings.radius}
          min={2}
          max={150}
          step={1}
          unit="px"
          defaultValue={24}
          onChange={(r) => {
            if (!isRemoveMode) onSelectTool('object-remove')
            onChangeRadius(r)
          }}
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-[#808096] uppercase tracking-wider">Inpainting Method</span>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#161622] rounded-lg border border-[#222230]">
            <button
              type="button"
              onClick={() => { if (!isRemoveMode) onSelectTool('object-remove'); onChangeInpaintMethod('local-patch') }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-colors cursor-pointer ${
                settings.inpaintMethod === 'local-patch' ? 'bg-[#222234] text-[#60A5FA] font-medium' : 'text-[#9090A0] hover:text-[#E0E0EC]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Local Patch</span>
            </button>
            <button
              type="button"
              onClick={() => { if (!isRemoveMode) onSelectTool('object-remove'); onChangeInpaintMethod('pollinations-ai') }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-colors cursor-pointer ${
                settings.inpaintMethod === 'pollinations-ai' ? 'bg-[#222234] text-[#60A5FA] font-medium' : 'text-[#9090A0] hover:text-[#E0E0EC]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pollinations AI</span>
            </button>
          </div>
        </div>

        {settings.inpaintMethod === 'pollinations-ai' && (
          <input
            type="text"
            placeholder="Prompt (optional, e.g. seamless clean grass)"
            value={settings.inpaintPrompt}
            onChange={(e) => onChangeInpaintPrompt(e.target.value)}
            className="w-full bg-[#161622] border border-[#2A2A3C] rounded px-2.5 py-1.5 text-xs text-[#E0E0EC] placeholder-[#606074] focus:outline-none focus:border-[#60A5FA]"
          />
        )}

        {isProcessingInpaint && (
          <div className="w-full bg-[#1E1E2C] rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#60A5FA] h-1.5 transition-all duration-150" style={{ width: `${Math.round(inpaintProgress * 100)}%` }} />
          </div>
        )}

        <button
          type="button"
          disabled={!hasMask || isProcessingInpaint}
          onClick={onExecuteInpaint}
          className="w-full py-2 px-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          {isProcessingInpaint ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Removing Object ({Math.round(inpaintProgress * 100)}%)...</span>
            </>
          ) : (
            <>
              <Eraser className="w-3.5 h-3.5" />
              <span>Remove Masked Object</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
