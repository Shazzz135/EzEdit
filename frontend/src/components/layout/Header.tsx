import React from 'react'
import {
  Undo2, Redo2, RotateCcw, ArrowRightLeft, ZoomIn, ZoomOut,
  SplitSquareVertical, Download, FolderDown, Sparkles, Layers, Hand,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'

export interface HeaderProps {
  onUndo?: () => void; onRedo?: () => void; onMassReset?: () => void; onOpenTransferEdits?: () => void
  onZoomIn?: () => void; onZoomOut?: () => void; onToggleCompare?: () => void; onToggleGrab?: () => void
  isGrabActive?: boolean; onExport?: () => void; onExportAll?: () => void; onOpenAI?: () => void
  canUndo?: boolean; canRedo?: boolean; canMassReset?: boolean; canTransferEdits?: boolean
  canExportAll?: boolean; isComparing?: boolean; children?: React.ReactNode; mobileSelector?: React.ReactNode
}

export const Header: React.FC<HeaderProps> = ({
  onUndo, onRedo, onMassReset, onOpenTransferEdits, onZoomIn, onZoomOut,
  onToggleCompare, onToggleGrab, isGrabActive = false, onExport, onExportAll, onOpenAI,
  canUndo = false, canRedo = false, canMassReset = false, canTransferEdits = false,
  canExportAll = false, isComparing = false, children, mobileSelector,
}) => {
  return (
    <header className="h-11 min-h-[44px] bg-[#16161C] border-b border-[#242430] flex items-center justify-between px-2 sm:px-3 gap-1.5 select-none z-20">
      {/* 1. Small Brand Logo */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="w-6 h-6 rounded bg-[#242432] border border-[#343448] flex items-center justify-center text-[#60A5FA]">
          <Layers className="w-3.5 h-3.5" />
        </div>
        <span className="font-semibold text-xs sm:text-sm tracking-tight text-[#F4F4F6] hidden xs:inline">
          EzEdit
        </span>
      </div>

      {/* 2. Middle: Desktop Tab Bar vs Mobile Image Selector Dropdown */}
      <div className="hidden md:flex flex-1 items-center overflow-x-auto no-scrollbar mx-2">
        {children || (
          <div className="flex items-center text-xs text-[#707080] font-sans px-2">
            No image opened
          </div>
        )}
      </div>

      <div className="flex md:hidden flex-1 items-center justify-center min-w-0">
        {mobileSelector}
      </div>

      {/* 3. Mobile Action Buttons */}
      <div className="flex md:hidden items-center gap-1 flex-shrink-0">
        <Button
          variant="icon"
          size="icon"
          disabled={!canMassReset}
          onClick={onMassReset}
          aria-label="Reset All Tools"
          title="Reset Image Completely"
          className="text-[#F87171] hover:text-[#FCA5A5] disabled:opacity-40"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="icon"
          size="icon"
          disabled={!canTransferEdits}
          onClick={onOpenTransferEdits}
          aria-label="Transfer Edits"
          title="Transfer Edits to Other Photos"
          className="text-[#60A5FA] hover:text-[#93C5FD] disabled:opacity-40"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="icon"
          size="icon"
          isActive={isGrabActive}
          onClick={onToggleGrab}
          aria-label="Grab Tool"
          title="Grab Tool (Space)"
          className={isGrabActive ? 'text-[#60A5FA] bg-[#222234]' : 'text-[#808094] hover:text-[#D0D0DC]'}
        >
          <Hand className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="icon"
          size="icon"
          onClick={onOpenAI}
          aria-label="AI Tools"
          title="AI Tools"
          className="text-[#60A5FA] hover:text-[#93C5FD]"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onExport}
          className="text-xs px-2 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] flex items-center gap-1"
        >
          <Download className="w-3 h-3 text-white" />
          <span className="hidden sm:inline">Export</span>
        </Button>
        {canExportAll && (
          <Button
            variant="primary"
            size="sm"
            onClick={onExportAll}
            title="Export All Open Photos"
            className="text-xs px-2 py-1 bg-[#1D4ED8] hover:bg-[#1E40AF] flex items-center gap-1"
          >
            <FolderDown className="w-3 h-3 text-white" />
            <span className="hidden sm:inline">Export All</span>
          </Button>
        )}
      </div>

      {/* 4. Desktop Right Controls */}
      <div className="hidden md:flex items-center gap-1 flex-shrink-0">
        <Tooltip content="Undo" shortcut="Ctrl+Z">
          <Button variant="icon" size="icon" disabled={!canUndo} onClick={onUndo} aria-label="Undo">
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>

        <Tooltip content="Redo" shortcut="Ctrl+Y">
          <Button variant="icon" size="icon" disabled={!canRedo} onClick={onRedo} aria-label="Redo">
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>

        <Tooltip content="Reset Image Completely (All Tools)">
          <Button
            variant="default"
            size="sm"
            disabled={!canMassReset}
            onClick={onMassReset}
            aria-label="Reset All Tools"
            className="text-xs text-[#F87171] border-[#3A242B] hover:border-[#EF4444] disabled:opacity-40"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </Button>
        </Tooltip>

        <Tooltip content="Transfer Selected Edits to Other Photos">
          <Button
            variant="default"
            size="sm"
            disabled={!canTransferEdits}
            onClick={onOpenTransferEdits}
            aria-label="Transfer Edits"
            className="text-xs text-[#60A5FA] border-[#2E2E42] hover:border-[#60A5FA] disabled:opacity-40"
          >
            <ArrowRightLeft className="w-3 h-3 text-[#60A5FA]" />
            <span>Transfer Edits</span>
          </Button>
        </Tooltip>

        <div className="w-[1px] h-4 bg-[#262634] mx-1" />

        <Tooltip content="Grab / Pan Canvas" shortcut="Space">
          <Button
            variant="icon"
            size="icon"
            isActive={isGrabActive}
            onClick={onToggleGrab}
            aria-label="Grab Tool"
            className={isGrabActive ? 'text-[#60A5FA] bg-[#222234]' : ''}
          >
            <Hand className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>

        <Tooltip content="Zoom Out" shortcut="-">
          <Button variant="icon" size="icon" onClick={onZoomOut} aria-label="Zoom Out">
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>

        <Tooltip content="Zoom In" shortcut="+">
          <Button variant="icon" size="icon" onClick={onZoomIn} aria-label="Zoom In">
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>

        <Tooltip content="Compare with Original" shortcut="Hold \ or C">
          <Button
            variant="icon"
            size="icon"
            isActive={isComparing}
            onClick={onToggleCompare}
            aria-label="Compare with Original"
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
            <span>AI</span>
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

        {canExportAll && (
          <Tooltip content="Batch Export All Open Photos">
            <Button
              variant="primary"
              size="sm"
              onClick={onExportAll}
              className="text-xs bg-[#2563EB] hover:bg-[#1D4ED8] border-[#3B82F6] text-white"
            >
              <FolderDown className="w-3 h-3 text-white" />
              <span>Export All</span>
            </Button>
          </Tooltip>
        )}
      </div>
    </header>
  )
}
