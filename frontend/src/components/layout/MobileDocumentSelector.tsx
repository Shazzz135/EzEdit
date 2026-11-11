import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Plus, Image as ImageIcon, X } from 'lucide-react'
import { type DocumentState } from '@/types/document'

export interface MobileDocumentSelectorProps {
  documents: DocumentState[]
  activeDocumentId: string | null
  onSelectDocument: (id: string) => void
  onCloseDocument?: (id: string) => void
  onImportClick?: () => void
}

export const MobileDocumentSelector: React.FC<MobileDocumentSelectorProps> = ({
  documents,
  activeDocumentId,
  onSelectDocument,
  onCloseDocument,
  onImportClick,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const activeDoc = documents.find((d) => d.id === activeDocumentId)

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const label = activeDoc ? activeDoc.name : 'No image'

  return (
    <div ref={menuRef} className="relative flex-1 max-w-[200px] sm:max-w-[260px] mx-1">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1 bg-[#1A1A24] hover:bg-[#20202E] border border-[#2C2C3E] rounded-md text-xs font-medium text-[#E0E0EC] transition-colors cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
          <ImageIcon className="w-3.5 h-3.5 text-[#60A5FA] flex-shrink-0" />
          <span className="truncate text-left">{label}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#808096] flex-shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-[#161622] border border-[#2E2E40] rounded-lg shadow-2xl p-1 z-50 flex flex-col gap-0.5 animate-in fade-in-50 duration-100">
          <div className="px-2 py-1 text-[10px] font-semibold text-[#707086] uppercase tracking-wider">
            Open Documents ({documents.length}/6)
          </div>

          {documents.length === 0 ? (
            <div className="px-2.5 py-2 text-xs text-[#707080] italic">
              No images open
            </div>
          ) : (
            documents.map((doc) => {
              const isActive = doc.id === activeDocumentId
              return (
                <div
                  key={doc.id}
                  className={`flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#2563EB]/20 text-[#60A5FA]'
                      : 'text-[#C4C4D4] hover:bg-[#1E1E2C] hover:text-white'
                  }`}
                  onClick={() => {
                    onSelectDocument(doc.id)
                    setIsOpen(false)
                  }}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
                    {isActive ? (
                      <Check className="w-3.5 h-3.5 text-[#60A5FA] flex-shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                    <span className="truncate">{doc.name}</span>
                  </div>
                  {onCloseDocument && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCloseDocument(doc.id)
                      }}
                      className="p-1 text-[#707080] hover:text-red-400 rounded cursor-pointer"
                      title="Close Tab"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            })
          )}

          <div className="h-[1px] bg-[#222230] my-1" />

          {onImportClick && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onImportClick()
              }}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-[#60A5FA] hover:bg-[#1E1E2C] rounded transition-colors cursor-pointer w-full text-left font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import Image...</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
