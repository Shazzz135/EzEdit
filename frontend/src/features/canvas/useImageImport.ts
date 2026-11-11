import { useState } from 'react'
import { MAX_IMPORT_DIMENSION, MAX_TAB_LIMIT } from '@/types/document'
import { useDocumentStore } from '@/features/tabs/useDocumentStore'

export const useImageImport = (onTabLimitExceeded: () => void) => {
  const [oversizedFile, setOversizedFile] = useState<{ file: File; width: number; height: number } | null>(null)
  const { documents, addDocument } = useDocumentStore()

  const handleDropFile = (file: File) => {
    if (documents.length >= MAX_TAB_LIMIT) {
      onTabLimitExceeded()
      return
    }
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = img
      if (width > MAX_IMPORT_DIMENSION || height > MAX_IMPORT_DIMENSION) {
        setOversizedFile({ file, width, height })
        URL.revokeObjectURL(objectUrl)
        return
      }
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

  const handleDownscaleAndImport = () => {
    if (!oversizedFile) return
    const { file, width, height } = oversizedFile
    const scale = MAX_IMPORT_DIMENSION / Math.max(width, height)
    const targetW = Math.round(width * scale)
    const targetH = Math.round(height * scale)

    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, targetW, targetH)
        canvas.toBlob((blob) => {
          if (blob) {
            const downscaledUrl = URL.createObjectURL(blob)
            addDocument({
              name: file.name,
              originalWidth: targetW,
              originalHeight: targetH,
              currentWidth: targetW,
              currentHeight: targetH,
              imageSrc: downscaledUrl,
              imageBlob: blob,
            })
          }
          URL.revokeObjectURL(url)
        }, file.type || 'image/png')
      }
    }
    img.src = url
    setOversizedFile(null)
  }

  return {
    oversizedFile,
    setOversizedFile,
    handleDropFile,
    handleDownscaleAndImport,
  }
}
