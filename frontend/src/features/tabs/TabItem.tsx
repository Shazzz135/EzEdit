import React, { useState, useRef, useEffect } from 'react'
import { X, Image as ImageIcon } from 'lucide-react'
import { type DocumentState } from '@/types/document'

export interface TabItemProps {
  document: DocumentState
  isActive: boolean
  onSelect: (id: string) => void
  onClose: (id: string, e: React.MouseEvent) => void
  onRename?: (id: string, newName: string) => void
}

export const TabItem: React.FC<TabItemProps> = ({
  document,
  isActive,
  onSelect,
  onClose,
  onRename,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [prevName, setPrevName] = useState(document.name)
  const [editName, setEditName] = useState(document.name)
  const inputRef = useRef<HTMLInputElement>(null)

  if (prevName !== document.name) {
    setPrevName(document.name)
    setEditName(document.name)
  }

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const commitRename = () => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== document.name && onRename) {
      onRename(document.id, trimmed)
    } else {
      setEditName(document.name)
    }
    setIsEditing(false)
  }

  const cancelRename = () => {
    setEditName(document.name)
    setIsEditing(false)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  return (
    <div
      role="tab"
      aria-selected={isActive}
      tabIndex={0}
      onClick={() => onSelect(document.id)}
      onDoubleClick={handleDoubleClick}
      onKeyDown={(e) => {
        if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
          onSelect(document.id)
        }
      }}
      title="Double-click to rename"
      className={`group relative flex items-center gap-2 h-8 px-2.5 max-w-[190px] min-w-[110px] border-r border-[#262634] cursor-pointer select-none text-xs transition-colors ${
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

      {/* Document Name or Inline Rename Input */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitRename()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              cancelRename()
            }
          }}
          onBlur={commitRename}
          className="flex-1 min-w-0 bg-[#101018] border border-[#3B82F6] text-[#F4F4F6] text-[11px] font-sans px-1 py-0.5 rounded outline-none"
        />
      ) : (
        <span
          className="truncate flex-1 font-sans text-[11px]"
          title={document.name}
        >
          {document.name}
        </span>
      )}

      {/* Modified Indicator */}
      {document.isModified && !isEditing && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#60A5FA] flex-shrink-0"
          title="Modified"
        />
      )}

      {/* Close Tab Button */}
      {!isEditing && (
        <button
          type="button"
          aria-label={`Close ${document.name}`}
          onClick={(e) => onClose(document.id, e)}
          className="opacity-0 group-hover:opacity-100 hover:bg-[#2A2A38] rounded p-0.5 text-[#808090] hover:text-[#F4F4F6] transition-all flex-shrink-0 cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
