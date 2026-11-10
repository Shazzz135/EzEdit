import React from 'react'
import { X, Image as ImageIcon } from 'lucide-react'
import { type DocumentState } from '@/types/document'

export interface TabItemProps {
  document: DocumentState
  isActive: boolean
  onSelect: (id: string) => void
  onClose: (id: string, e: React.MouseEvent) => void
}

export const TabItem: React.FC<TabItemProps> = ({
  document,
  isActive,
  onSelect,
  onClose,
}) => {
  return (
    <div
      role="tab"
      aria-selected={isActive}
      tabIndex={0}
      onClick={() => onSelect(document.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(document.id)
        }
      }}
      className={`group relative flex items-center gap-2 h-8 px-2.5 max-w-[180px] min-w-[100px] border-r border-[#262634] cursor-pointer select-none text-xs transition-colors ${
        isActive
          ? 'bg-[#1D1D26] text-[#F4F4F6] font-medium'
          : 'bg-[#15151C] text-[#9090A0] hover:bg-[#1A1A22] hover:text-[#D4D4E0]'
      }`}
    >
      {/* Active Top Highlight indicator */}
      {isActive && (
        <div className="absolute top-0 inset-x-0 h-[2px] bg-[#60A5FA]" />
      )}

      {/* Thumbnail or placeholder icon */}
      <div className="w-4 h-4 rounded overflow-hidden flex-shrink-0 bg-[#282834] flex items-center justify-center">
        {document.thumbnailUrl || document.imageSrc ? (
          <img
            src={document.thumbnailUrl || document.imageSrc}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon className="w-2.5 h-2.5 text-[#808090]" />
        )}
      </div>

      {/* Document Name */}
      <span className="truncate flex-1 font-sans text-[11px]" title={document.name}>
        {document.name}
      </span>

      {/* Modified Indicator */}
      {document.isModified && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA] flex-shrink-0" title="Modified" />
      )}

      {/* Close Tab Button */}
      <button
        type="button"
        aria-label={`Close ${document.name}`}
        onClick={(e) => onClose(document.id, e)}
        className="opacity-0 group-hover:opacity-100 hover:bg-[#2A2A38] rounded p-0.5 text-[#808090] hover:text-[#F4F4F6] transition-all flex-shrink-0 cursor-pointer"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
