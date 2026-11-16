import React from 'react'
import {
  Sliders,
  Wand2,
  Crop,
  Brush,
  PenTool,
  Sparkles,
  Scissors,
  ClipboardPaste,
  RotateCw,
  Image as ImageIcon,
} from 'lucide-react'
import { type DocumentHistoryEntry, type HistoryActionType } from '@/types/document'
import { formatHistoryLabel } from './historyUtils'

export interface HistoryItemProps {
  entry: DocumentHistoryEntry
  index: number
  isActive: boolean
  isUndone: boolean
  onSelect: (index: number) => void
}

function renderActionIcon(actionType?: HistoryActionType) {
  switch (actionType) {
    case 'adjustment':
      return <Sliders className="w-3.5 h-3.5" />
    case 'filter':
      return <Wand2 className="w-3.5 h-3.5" />
    case 'crop':
      return <Crop className="w-3.5 h-3.5" />
    case 'retouch':
      return <Brush className="w-3.5 h-3.5" />
    case 'annotate':
      return <PenTool className="w-3.5 h-3.5" />
    case 'ai':
      return <Sparkles className="w-3.5 h-3.5" />
    case 'cutout':
      return <Scissors className="w-3.5 h-3.5" />
    case 'paste':
      return <ClipboardPaste className="w-3.5 h-3.5" />
    case 'orientation':
      return <RotateCw className="w-3.5 h-3.5" />
    case 'init':
    default:
      return <ImageIcon className="w-3.5 h-3.5" />
  }
}

export const HistoryItem: React.FC<HistoryItemProps> = ({
  entry,
  index,
  isActive,
  isUndone,
  onSelect,
}) => {
  const label = formatHistoryLabel(entry, index)

  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      title={`Jump to Step ${index + 1}: ${label}`}
      aria-label={`Step ${index + 1}: ${label}${isActive ? ' (Current)' : ''}${isUndone ? ' (Undone)' : ''}`}
      aria-current={isActive ? 'step' : undefined}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors rounded-md group cursor-pointer ${
        isActive
          ? 'bg-[#1E293B] border border-[#3B82F6]/60 text-[#F8FAFC] font-medium shadow-sm'
          : isUndone
          ? 'opacity-40 hover:opacity-75 text-[#94A3B8] hover:bg-[#1A1A24]'
          : 'text-[#E2E8F0] hover:bg-[#1E1E2A] border border-transparent'
      }`}
    >
      <div
        className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
          isActive
            ? 'bg-[#3B82F6] text-white shadow-sm'
            : isUndone
            ? 'bg-[#181822] text-[#64748B]'
            : 'bg-[#1C1C26] text-[#60A5FA] group-hover:bg-[#252536]'
        }`}
      >
        {renderActionIcon(entry.actionType)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="truncate tracking-tight">{label}</div>
      </div>

      <span className="text-[10px] font-mono text-[#64748B] flex-shrink-0">
        #{index + 1}
      </span>
    </button>
  )
}
