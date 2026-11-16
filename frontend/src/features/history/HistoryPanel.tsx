import React, { useRef, useEffect } from 'react'
import { History, RotateCcw, Sparkles } from 'lucide-react'
import { type DocumentState } from '@/types/document'
import { HistoryItem } from './HistoryItem'

export interface HistoryPanelProps {
  document?: DocumentState
  onJumpToIndex: (index: number) => void
  onResetCompletely?: () => void
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  document,
  onJumpToIndex,
  onResetCompletely,
}) => {
  const listRef = useRef<HTMLDivElement>(null)
  const history = document?.history ?? []
  const activeIndex = document?.historyIndex ?? 0

  useEffect(() => {
    if (!listRef.current) return
    const activeEl = listRef.current.querySelector('[aria-current="step"]')
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [activeIndex])

  if (!document) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-[#707080] text-xs text-center select-none">
        <History className="w-8 h-8 mb-2 text-[#404050]" />
        <span>No image open</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#131318] select-none text-[#F4F4F6]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#22222C] flex-shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#60A5FA]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#E0E0EC]">
            History
          </span>
          <span className="text-[10px] bg-[#1E1E2C] border border-[#2A2A3C] text-[#808098] px-1.5 py-0.5 rounded-full font-mono">
            {activeIndex + 1}/{history.length}
          </span>
        </div>

        {onResetCompletely && history.length > 1 && (
          <button
            type="button"
            onClick={onResetCompletely}
            title="Revert back to initial image (Mass Reset)"
            className="text-[11px] text-[#F87171] hover:text-[#FCA5A5] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Revert</span>
          </button>
        )}
      </div>

      {/* History Items List */}
      <div
        ref={listRef}
        role="listbox"
        aria-label="Edit History Steps"
        className="flex-1 overflow-y-auto overflow-x-hidden p-2 flex flex-col gap-1 no-scrollbar"
      >
        {history.map((entry, idx) => (
          <HistoryItem
            key={`${entry.timestamp || idx}-${idx}`}
            entry={entry}
            index={idx}
            isActive={idx === activeIndex}
            isUndone={idx > activeIndex}
            onSelect={onJumpToIndex}
          />
        ))}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-2 border-t border-[#1C1C24] bg-[#0E0E12] flex items-center justify-between text-[10px] text-[#707086] flex-shrink-0">
        <span className="truncate">Click step to undo/jump</span>
        <span className="flex items-center gap-1 text-[#60A5FA]">
          <Sparkles className="w-3 h-3" />
          <span>Non-destructive</span>
        </span>
      </div>
    </div>
  )
}
