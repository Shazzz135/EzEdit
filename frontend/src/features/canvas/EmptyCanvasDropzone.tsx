import React, { useRef } from 'react'
import { Plus } from 'lucide-react'

export interface EmptyCanvasDropzoneProps {
  onDropImage?: (file: File) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

export const EmptyCanvasDropzone: React.FC<EmptyCanvasDropzoneProps> = ({
  onDropImage,
  onDragOver,
  onDrop,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && onDropImage) onDropImage(file)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="group flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#2E2E3E] hover:border-[#60A5FA] bg-[#161622]/70 hover:bg-[#1A1A2A] rounded-2xl transition-all cursor-pointer mb-3 shadow-lg hover:shadow-[#60A5FA]/10"
      >
        <div className="w-14 h-14 rounded-full bg-[#20202E] group-hover:bg-[#2563EB]/20 flex items-center justify-center mb-3 text-[#9090A0] group-hover:text-[#60A5FA] transition-colors border border-[#2D2D3E] group-hover:border-[#3B82F6]/50">
          <Plus className="w-7 h-7" />
        </div>
        <span className="text-sm font-semibold text-[#E0E0EC] group-hover:text-white flex items-center gap-1.5">
          Import Image
        </span>
        <span className="text-xs text-[#707080] mt-1">
          Click to browse or drag & drop image
        </span>
      </button>
      <p className="text-xs text-[#707080] max-w-xs">
        Supports PNG, JPEG, WebP. Multi-tab editing supports up to 6 documents simultaneously.
      </p>
    </div>
  )
}
