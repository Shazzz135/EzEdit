import React, { useRef } from 'react'
import { Plus } from 'lucide-react'
import { useDocumentStore } from './useDocumentStore'
import { TabItem } from './TabItem'
import { MAX_TAB_LIMIT, MAX_IMPORT_DIMENSION } from '@/types/document'

export interface TabBarProps {
  onTabLimitExceeded: () => void
  onDimensionExceeded: (file: File, width: number, height: number) => void
  onUnsavedClosePrompt?: (docId: string, docName: string) => void
}

export const TabBar: React.FC<TabBarProps> = ({
  onTabLimitExceeded,
  onDimensionExceeded,
  onUnsavedClosePrompt,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { documents, activeDocumentId, setActiveDocument, closeDocument, addDocument } =
    useDocumentStore()

  const handleOpenPicker = () => {
    if (documents.length >= MAX_TAB_LIMIT) {
      onTabLimitExceeded()
      return
    }
    fileInputRef.current?.click()
  }

  const processImageFile = (file: File) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = img

      // Check 4096px dimension limit safeguard
      if (width > MAX_IMPORT_DIMENSION || height > MAX_IMPORT_DIMENSION) {
        onDimensionExceeded(file, width, height)
        URL.revokeObjectURL(objectUrl)
        return
      }

      // Add to store
      addDocument({
        name: file.name,
        originalWidth: width,
        originalHeight: height,
        currentWidth: width,
        currentHeight: height,
        imageSrc: objectUrl,
        imageBlob: file,
      })
    }
    img.src = objectUrl
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
    // Reset input so same file can be reopened if desired
    e.target.value = ''
  }

  const handleClose = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const doc = documents.find((d) => d.id === id)
    if (doc?.isModified && onUnsavedClosePrompt) {
      onUnsavedClosePrompt(id, doc.name)
    } else {
      closeDocument(id)
    }
  }

  return (
    <div className="flex items-center h-full overflow-hidden w-full">
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Tabs list with horizontal scroll */}
      <div className="flex items-center overflow-x-auto no-scrollbar h-full">
        {documents.map((doc) => (
          <TabItem
            key={doc.id}
            document={doc}
            isActive={doc.id === activeDocumentId}
            onSelect={setActiveDocument}
            onClose={handleClose}
          />
        ))}
      </div>

      {/* New Tab Button */}
      <button
        type="button"
        onClick={handleOpenPicker}
        title={
          documents.length >= MAX_TAB_LIMIT
            ? 'Maximum 6 tabs reached'
            : `Open Image (${documents.length}/${MAX_TAB_LIMIT})`
        }
        className="flex items-center gap-1 h-7 px-2 ml-1 text-xs text-[#9090A0] hover:text-[#F4F4F6] bg-[#161620] hover:bg-[#20202C] border border-[#262634] rounded-[4px] cursor-pointer transition-colors flex-shrink-0"
      >
        <Plus className="w-3.5 h-3.5" />
        <span className="text-[10px] font-mono">
          {documents.length}/{MAX_TAB_LIMIT}
        </span>
      </button>
    </div>
  )
}
