import React from 'react'
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  SplitSquareVertical,
  Download,
  Sparkles,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'

export interface HeaderProps {
  onUndo?: () => void
  onRedo?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onToggleCompare?: () => void
  onExport?: () => void
  onOpenAI?: () => void
  canUndo?: boolean
  canRedo?: boolean
  isComparing?: boolean
  children?: React.ReactNode // Tab bar container slot
}

export const Header: React.FC<HeaderProps> = ({
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onToggleCompare,
  onExport,
  onOpenAI,
  canUndo = false,
  canRedo = false,
  isComparing = false,
  children,
}) => {
  return (
    <header className="h-11 min-h-[44px] bg-[#16161C] border-b border-[#242430] flex items-center justify-between px-3 gap-2 select-none z-20">
      {/* Brand logo & icon */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-6 h-6 rounded bg-[#242432] border border-[#343448] flex items-center justify-center text-[#60A5FA]">
          <Layers className="w-3.5 h-3.5" />
        </div>
        <span className="font-semibold text-sm tracking-tight text-[#F4F4F6]">
          EzEdit
        </span>
      </div>

      {/* Middle Tab Bar Slot */}
      <div className="flex-1 flex items-center overflow-x-auto no-scrollbar mx-2">
        {children || (
          <div className="flex items-center text-xs text-[#707080] font-sans px-2">
            No image opened
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Tooltip content="Undo" shortcut="Ctrl+Z">
          <Button
            variant="icon"
            size="icon"
            disabled={!canUndo}
            onClick={onUndo}
            aria-label="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>

        <Tooltip content="Redo" shortcut="Ctrl+Y">
          <Button
            variant="icon"
            size="icon"
            disabled={!canRedo}
            onClick={onRedo}
            aria-label="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>

        <div className="w-[1px] h-4 bg-[#262634] mx-1 hidden sm:block" />

        <Tooltip content="Zoom Out" shortcut="-">
          <Button
            variant="icon"
            size="icon"
            onClick={onZoomOut}
            aria-label="Zoom Out"
            className="hidden sm:inline-flex"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>

        <Tooltip content="Zoom In" shortcut="+">
          <Button
            variant="icon"
            size="icon"
            onClick={onZoomIn}
            aria-label="Zoom In"
            className="hidden sm:inline-flex"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>

        <Tooltip content="Compare with Original" shortcut="Hold Space">
          <Button
            variant="icon"
            size="icon"
            isActive={isComparing}
            onClick={onToggleCompare}
            aria-label="Compare with Original"
            className="hidden sm:inline-flex"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>

        <div className="w-[1px] h-4 bg-[#262634] mx-1" />

        <Tooltip content="AI Enhancements via Pollinations.ai">
          <Button
            variant="default"
            size="sm"
            onClick={onOpenAI}
            className="text-xs text-[#60A5FA] border-[#2E2E42] hover:border-[#60A5FA]"
          >
            <Sparkles className="w-3 h-3 text-[#60A5FA]" />
            <span className="hidden md:inline">AI</span>
          </Button>
        </Tooltip>

        <Button
          variant="primary"
          size="sm"
          onClick={onExport}
          className="text-xs bg-[#242436] border-[#383850] hover:border-[#60A5FA]"
        >
          <Download className="w-3 h-3 text-[#F4F4F6]" />
          <span>Export</span>
        </Button>
      </div>
    </header>
  )
}
