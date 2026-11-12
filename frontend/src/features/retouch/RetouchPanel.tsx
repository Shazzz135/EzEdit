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
  return (
    <div className="flex flex-col gap-3.5 p-4 bg-[#12121A] text-[#F4F4F6] select-none text-xs">
      {/* 1. Header with Title & Reset */}
      <div className="flex items-center justify-between border-b border-[#222230] pb-2">
        <div className="flex items-center gap-1.5">
          <Stamp className="w-4 h-4 text-[#60A5FA]" />
          <span className="text-xs font-bold text-[#E0E0EC] uppercase tracking-wider">
            Retouch & Object Removal
          </span>
        </div>
        {tool !== 'object-remove' && sourcePoint && (
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
        {tool === 'object-remove' && hasMask && onClearMask && (
          <button
            type="button"
            onClick={onClearMask}
            title="Clear mask (Right-Click)"
            className="text-[11px] text-[#808096] hover:text-[#D0D0E0] flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-[#60A5FA]" />
            <span>Clear Mask</span>
          </button>
        )}
      </div>

      {/* 2. Tool Mode Selector Buttons */}
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-medium text-[#808096] uppercase tracking-wider">
          Retouch Tool
        </span>
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#161622] rounded-lg border border-[#222230]">
          <button
            type="button"
            onClick={() => onSelectTool('clone-stamp')}
            className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-md transition-colors cursor-pointer ${
              tool === 'clone-stamp' ? 'bg-[#222234] text-[#60A5FA] font-medium shadow-xs' : 'text-[#9090A0] hover:text-[#E0E0EC] hover:bg-[#1A1A28]'
            }`}
          >
            <Stamp className="w-4 h-4 mb-1 text-[#60A5FA]" />
            <span className="text-[9.5px]">Clone</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('healing-brush')}
            className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-md transition-colors cursor-pointer ${
              tool === 'healing-brush' ? 'bg-[#222234] text-[#60A5FA] font-medium shadow-xs' : 'text-[#9090A0] hover:text-[#E0E0EC] hover:bg-[#1A1A28]'
            }`}
          >
            <Sparkles className="w-4 h-4 mb-1 text-[#60A5FA]" />
            <span className="text-[9.5px]">Heal</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('spot-heal')}
            className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-md transition-colors cursor-pointer ${
              tool === 'spot-heal' ? 'bg-[#222234] text-[#60A5FA] font-medium shadow-xs' : 'text-[#9090A0] hover:text-[#E0E0EC] hover:bg-[#1A1A28]'
            }`}
          >
            <Target className="w-4 h-4 mb-1 text-[#60A5FA]" />
            <span className="text-[9.5px]">Spot</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('object-remove')}
            className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-md transition-colors cursor-pointer ${
              tool === 'object-remove' ? 'bg-[#222234] text-[#EF4444] font-medium shadow-xs' : 'text-[#9090A0] hover:text-[#E0E0EC] hover:bg-[#1A1A28]'
            }`}
          >
            <Eraser className="w-4 h-4 mb-1 text-[#EF4444]" />
            <span className="text-[9.5px]">Remove</span>
          </button>
        </div>
      </div>

      {/* 3. Helpful Instruction Banner */}
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#161622]/60 border border-[#222232] text-[#A0A0B2] text-[11px] leading-relaxed">
        <Info className="w-3.5 h-3.5 mt-0.5 text-[#60A5FA] flex-shrink-0" />
        <div>
          {tool === 'object-remove' && (
            <span>Paint over the unwanted object to mask it, then click Remove below. Right-click to clear.</span>
          )}
          {tool === 'spot-heal' && (
            <span>Click directly on blemishes or spots to auto-blend with surrounding texture.</span>
          )}
          {tool !== 'spot-heal' && tool !== 'object-remove' && !sourcePoint && (
            <span><strong className="text-[#60A5FA]">Right-Click</strong> (or hold Alt+Click) to set the sample anchor.</span>
          )}
          {tool !== 'spot-heal' && tool !== 'object-remove' && sourcePoint && (
            <span>Sample anchor set at ({sourcePoint.x}, {sourcePoint.y}). Drag to retouch, or right-click to move anchor.</span>
          )}
        </div>
      </div>

      {/* 4. Brush Parameters */}
      <div className="flex flex-col gap-3">
        <PrecisionSlider label="Brush Radius" value={settings.radius} min={2} max={150} step={1} unit="px" defaultValue={24} onChange={onChangeRadius} />
        {tool !== 'object-remove' && (
          <PrecisionSlider label="Edge Hardness" value={Math.round(settings.hardness * 100)} min={0} max={100} step={1} unit="%" defaultValue={50} onChange={(v) => onChangeHardness(v / 100)} />
        )}
        {tool !== 'spot-heal' && tool !== 'object-remove' && (
          <PrecisionSlider label="Opacity" value={Math.round(settings.opacity * 100)} min={10} max={100} step={1} unit="%" defaultValue={100} onChange={(v) => onChangeOpacity(v / 100)} />
        )}
      </div>

      {/* 5. Inpainting Method Selector & Action for Object Removal */}
      {tool === 'object-remove' && (
        <div className="flex flex-col gap-2.5 pt-1 border-t border-[#222230]">
          <span className="text-[11px] font-medium text-[#808096] uppercase tracking-wider">Inpainting Method</span>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#161622] rounded-lg border border-[#222230]">
            <button
              type="button"
              onClick={() => onChangeInpaintMethod('local-patch')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-colors cursor-pointer ${
                settings.inpaintMethod === 'local-patch' ? 'bg-[#222234] text-[#60A5FA] font-medium' : 'text-[#9090A0] hover:text-[#E0E0EC]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Local Worker</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeInpaintMethod('pollinations-ai')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-colors cursor-pointer ${
                settings.inpaintMethod === 'pollinations-ai' ? 'bg-[#222234] text-[#60A5FA] font-medium' : 'text-[#9090A0] hover:text-[#E0E0EC]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pollinations AI</span>
            </button>
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
      )}
    </div>
  )
}
