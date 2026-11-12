import React from 'react'
import { Stamp, Sparkles, Target, RotateCcw, Info } from 'lucide-react'
import { type RetouchTool, type RetouchSettings, type Point } from './types'
import { PrecisionSlider } from '@/components/ui/PrecisionSlider'

export interface RetouchPanelProps {
  tool: RetouchTool
  settings: RetouchSettings
  sourcePoint: Point | null
  onSelectTool: (t: RetouchTool) => void
  onChangeRadius: (r: number) => void
  onChangeHardness: (h: number) => void
  onChangeOpacity: (o: number) => void
  onClearSourcePoint: () => void
}

export const RetouchPanel: React.FC<RetouchPanelProps> = ({
  tool, settings, sourcePoint, onSelectTool,
  onChangeRadius, onChangeHardness, onChangeOpacity, onClearSourcePoint,
}) => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-[#12121A] text-[#F4F4F6] select-none text-xs">
      {/* 1. Header with Title & Reset */}
      <div className="flex items-center justify-between border-b border-[#222230] pb-2">
        <div className="flex items-center gap-1.5">
          <Stamp className="w-4 h-4 text-[#60A5FA]" />
          <span className="text-xs font-bold text-[#E0E0EC] uppercase tracking-wider">
            Retouch & Healing
          </span>
        </div>
        {sourcePoint && (
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

      {/* 2. Tool Mode Selector Buttons */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-[#808096] uppercase tracking-wider">
          Retouch Tool
        </span>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#161622] rounded-lg border border-[#222230]">
          <button
            type="button"
            onClick={() => onSelectTool('clone-stamp')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-md transition-colors cursor-pointer ${
              tool === 'clone-stamp'
                ? 'bg-[#222234] text-[#60A5FA] font-medium shadow-xs'
                : 'text-[#9090A0] hover:text-[#E0E0EC] hover:bg-[#1A1A28]'
            }`}
          >
            <Stamp className="w-4 h-4 mb-1 text-[#60A5FA]" />
            <span className="text-[10px]">Clone Stamp</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('healing-brush')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-md transition-colors cursor-pointer ${
              tool === 'healing-brush'
                ? 'bg-[#222234] text-[#60A5FA] font-medium shadow-xs'
                : 'text-[#9090A0] hover:text-[#E0E0EC] hover:bg-[#1A1A28]'
            }`}
          >
            <Sparkles className="w-4 h-4 mb-1 text-[#60A5FA]" />
            <span className="text-[10px]">Healing Brush</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('spot-heal')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-md transition-colors cursor-pointer ${
              tool === 'spot-heal'
                ? 'bg-[#222234] text-[#60A5FA] font-medium shadow-xs'
                : 'text-[#9090A0] hover:text-[#E0E0EC] hover:bg-[#1A1A28]'
            }`}
          >
            <Target className="w-4 h-4 mb-1 text-[#60A5FA]" />
            <span className="text-[10px]">Spot Remover</span>
          </button>
        </div>
      </div>

      {/* 3. Helpful Instruction Banner */}
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#161622]/60 border border-[#222232] text-[#A0A0B2] text-[11px] leading-relaxed">
        <Info className="w-3.5 h-3.5 mt-0.5 text-[#60A5FA] flex-shrink-0" />
        <div>
          {tool === 'spot-heal' && (
            <span>Click directly on blemishes or spots to auto-blend with surrounding texture.</span>
          )}
          {tool !== 'spot-heal' && !sourcePoint && (
            <span>
              Hold <strong className="text-[#60A5FA]">Alt</strong> and click on the canvas to set the sample anchor point.
            </span>
          )}
          {tool !== 'spot-heal' && sourcePoint && (
            <span>
              Sample anchor set at ({sourcePoint.x}, {sourcePoint.y}). Drag on canvas to retouch.
            </span>
          )}
        </div>
      </div>

      {/* 4. Brush Parameters */}
      <div className="flex flex-col gap-3">
        <PrecisionSlider
          label="Brush Radius"
          value={settings.radius}
          min={2}
          max={150}
          step={1}
          unit="px"
          defaultValue={24}
          onChange={onChangeRadius}
        />

        <PrecisionSlider
          label="Edge Hardness"
          value={Math.round(settings.hardness * 100)}
          min={0}
          max={100}
          step={1}
          unit="%"
          defaultValue={50}
          onChange={(v) => onChangeHardness(v / 100)}
        />

        {tool !== 'spot-heal' && (
          <PrecisionSlider
            label="Opacity"
            value={Math.round(settings.opacity * 100)}
            min={10}
            max={100}
            step={1}
            unit="%"
            defaultValue={100}
            onChange={(v) => onChangeOpacity(v / 100)}
          />
        )}
      </div>
    </div>
  )
}
