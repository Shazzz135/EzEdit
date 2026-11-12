import React from 'react'
import {
  Square, Circle, Minus, MoveUpRight, Star, Triangle,
  Brush, Highlighter, Type, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Undo2, Redo2, Trash2, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PrecisionSlider } from '@/components/ui/PrecisionSlider'
import { ColorPickerSection } from './ColorPickerSection'
import {
  type AnnotateSettings, type ShapeGeometry, type ShapeStyleMode,
  type FontFamilyOption, type TextAlignOption,
} from './types'

export interface AnnotatePanelProps {
  settings: AnnotateSettings; itemCount: number; redoCount?: number; isBaking: boolean
  onUpdateSettings: (partial: Partial<AnnotateSettings>) => void
  onUndoLast: () => void; onRedoLast?: () => void; onClearAll: () => void; onApplyToImage: () => void
}

const SHAPE_OPTIONS: { id: ShapeGeometry; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'rectangle', label: 'Box', icon: Square },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'line', label: 'Line', icon: Minus },
  { id: 'arrow', label: 'Arrow', icon: MoveUpRight },
  { id: 'star', label: 'Star', icon: Star },
  { id: 'triangle', label: 'Triangle', icon: Triangle },
]

const STYLE_MODES: { id: ShapeStyleMode; label: string }[] = [
  { id: 'outline', label: 'Outline' },
  { id: 'filled', label: 'Filled' },
  { id: 'both', label: 'Both' },
]

const FONT_FAMILIES: { id: FontFamilyOption; label: string }[] = [
  { id: 'sans-serif', label: 'Sans-Serif (Inter)' },
  { id: 'serif', label: 'Serif (Editorial)' },
  { id: 'monospace', label: 'Monospace (Code)' },
  { id: 'Impact, sans-serif', label: 'Display (Bold)' },
  { id: 'cursive', label: 'Handwritten' },
]

export const AnnotatePanel: React.FC<AnnotatePanelProps> = ({
  settings, itemCount, redoCount = 0, isBaking, onUpdateSettings, onUndoLast, onRedoLast, onClearAll, onApplyToImage,
}) => {
  return (
    <div className="flex flex-col gap-3 text-xs text-[#D0D0E0]">
      {/* 1. Sub-Tool Segmented Bar */}
      <div className="grid grid-cols-3 rounded-lg bg-[#14141E] p-0.5 border border-[#242432]">
        {[
          { id: 'shapes', label: 'Shapes', icon: Square },
          { id: 'paint', label: 'Paint', icon: Brush },
          { id: 'text', label: 'Text', icon: Type },
        ].map((tab) => {
          const Icon = tab.icon
          const active = settings.subTool === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onUpdateSettings({ subTool: tab.id as AnnotateSettings['subTool'] })}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                active ? 'bg-[#20202E] text-[#60A5FA]' : 'text-[#808092] hover:text-[#D0D0E0]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* 2. Shapes Controls */}
      {settings.subTool === 'shapes' && (
        <div className="space-y-3 p-2.5 rounded-lg bg-[#14141C] border border-[#242432]">
          <div className="grid grid-cols-3 gap-1.5">
            {SHAPE_OPTIONS.map((sh) => {
              const Icon = sh.icon
              const active = settings.shapeGeometry === sh.id
              return (
                <button
                  key={sh.id}
                  type="button"
                  onClick={() => onUpdateSettings({ shapeGeometry: sh.id })}
                  className={`flex flex-col items-center gap-1 p-2 rounded border transition-colors cursor-pointer ${
                    active ? 'bg-[#1D2436] border-[#60A5FA] text-[#F4F4F6]' : 'bg-[#101016] border-[#262634] text-[#9090A4] hover:border-[#3A3A4E]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-medium">{sh.label}</span>
                </button>
              )
            })}
          </div>

          {settings.shapeGeometry !== 'line' && (
            <div className="grid grid-cols-3 gap-1 bg-[#101016] p-0.5 rounded border border-[#242432]">
              {STYLE_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onUpdateSettings({ shapeStyleMode: m.id })}
                  className={`py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                    settings.shapeStyleMode === m.id ? 'bg-[#242436] text-[#60A5FA]' : 'text-[#808094]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          <PrecisionSlider
            label="Stroke Width"
            value={settings.strokeWidth}
            min={1} max={50} step={1} defaultValue={4} unit="px"
            onChange={(v) => onUpdateSettings({ strokeWidth: Math.round(v) })}
          />

          {settings.shapeGeometry === 'rectangle' && (
            <PrecisionSlider
              label="Corner Radius"
              value={settings.cornerRadius}
              min={0} max={50} step={1} defaultValue={8} unit="px"
              onChange={(v) => onUpdateSettings({ cornerRadius: Math.round(v) })}
            />
          )}
        </div>
      )}

      {/* 3. Paint Controls */}
      {settings.subTool === 'paint' && (
        <div className="space-y-3 p-2.5 rounded-lg bg-[#14141C] border border-[#242432]">
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'brush', label: 'Freehand Brush', icon: Brush },
              { id: 'highlighter', label: 'Highlighter', icon: Highlighter },
            ].map((b) => {
              const Icon = b.icon
              const active = settings.paintMode === b.id
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onUpdateSettings({ paintMode: b.id as AnnotateSettings['paintMode'] })}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded border text-xs font-medium cursor-pointer ${
                    active ? 'bg-[#1D2436] border-[#60A5FA] text-[#F4F4F6]' : 'bg-[#101016] border-[#262634] text-[#9090A4]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{b.label}</span>
                </button>
              )
            })}
          </div>
          <PrecisionSlider
            label="Brush Size"
            value={settings.brushSize}
            min={1} max={80} step={1} defaultValue={12} unit="px"
            onChange={(v) => onUpdateSettings({ brushSize: Math.round(v) })}
          />
        </div>
      )}

      {/* 4. Text Controls */}
      {settings.subTool === 'text' && (
        <div className="space-y-2.5 p-2.5 rounded-lg bg-[#14141C] border border-[#242432]">
          <textarea
            rows={2}
            value={settings.textDraft}
            onChange={(e) => onUpdateSettings({ textDraft: e.target.value })}
            placeholder="Type annotation text, then click on canvas..."
            className="w-full p-2 rounded bg-[#101016] border border-[#2A2A38] text-xs text-[#F4F4F6] focus:border-[#60A5FA] focus:outline-none resize-none"
          />
          <select
            value={settings.fontFamily}
            onChange={(e) => onUpdateSettings({ fontFamily: e.target.value as FontFamilyOption })}
            className="w-full p-1.5 rounded bg-[#101016] border border-[#2A2A38] text-xs text-[#F4F4F6]"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>

          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <Button variant="icon" size="icon" isActive={settings.bold} onClick={() => onUpdateSettings({ bold: !settings.bold })} title="Bold"><Bold className="w-3.5 h-3.5" /></Button>
              <Button variant="icon" size="icon" isActive={settings.italic} onClick={() => onUpdateSettings({ italic: !settings.italic })} title="Italic"><Italic className="w-3.5 h-3.5" /></Button>
            </div>
            <div className="flex items-center gap-1">
              {(['left', 'center', 'right'] as TextAlignOption[]).map((al) => (
                <Button key={al} variant="icon" size="icon" isActive={settings.textAlign === al} onClick={() => onUpdateSettings({ textAlign: al })} title={`Align ${al}`}>
                  {al === 'left' ? <AlignLeft className="w-3.5 h-3.5" /> : al === 'center' ? <AlignCenter className="w-3.5 h-3.5" /> : <AlignRight className="w-3.5 h-3.5" />}
                </Button>
              ))}
            </div>
          </div>

          <PrecisionSlider
            label="Font Size"
            value={settings.fontSize}
            min={12} max={140} step={1} defaultValue={36} unit="px"
            onChange={(v) => onUpdateSettings({ fontSize: Math.round(v) })}
          />

          <label className="flex items-center justify-between pt-1 cursor-pointer">
            <span className="text-[11px] text-[#A0A0B4]">Text Background Badge</span>
            <input type="checkbox" checked={settings.badgeEnabled} onChange={(e) => onUpdateSettings({ badgeEnabled: e.target.checked })} className="accent-[#3B82F6]" />
          </label>
          <p className="text-[10px] text-[#78788C]">Click anywhere on the canvas to place text.</p>
        </div>
      )}

      {/* 5. Color Palette & Opacity */}
      <ColorPickerSection
        label={settings.subTool === 'text' ? 'Text Color' : 'Stroke / Brush Color'}
        color={settings.strokeColor}
        onChangeColor={(hex) => onUpdateSettings({ strokeColor: hex })}
        secondaryLabel={settings.subTool === 'shapes' && settings.shapeStyleMode !== 'outline' ? 'Fill Color' : settings.subTool === 'text' && settings.badgeEnabled ? 'Badge Color' : undefined}
        secondaryColor={settings.subTool === 'text' ? settings.badgeColor : settings.fillColor}
        onChangeSecondaryColor={(hex) => onUpdateSettings(settings.subTool === 'text' ? { badgeColor: hex } : { fillColor: hex })}
        opacity={settings.opacity}
        onChangeOpacity={(opacity) => onUpdateSettings({ opacity })}
      />

      {/* 6. Session Actions (Undo, Redo, Clear, Apply to Image) */}
      <div className="space-y-2 pt-1">
        <div className="grid grid-cols-3 gap-1.5">
          <Button variant="default" size="sm" disabled={itemCount === 0 || isBaking} onClick={onUndoLast}>
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo ({itemCount})</span>
          </Button>
          <Button variant="default" size="sm" disabled={redoCount === 0 || isBaking} onClick={onRedoLast}>
            <Redo2 className="w-3.5 h-3.5" />
            <span>Redo ({redoCount})</span>
          </Button>
          <Button variant="default" size="sm" disabled={(itemCount === 0 && redoCount === 0) || isBaking} onClick={onClearAll}>
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </Button>
        </div>
        <Button variant="primary" size="sm" disabled={itemCount === 0 || isBaking} onClick={onApplyToImage} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white">
          <Check className="w-3.5 h-3.5" />
          <span>{isBaking ? 'Applying...' : 'Apply Annotations to Image'}</span>
        </Button>
      </div>
    </div>
  )
}
