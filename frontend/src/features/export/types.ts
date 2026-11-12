export type ExportFormat = 'image/png' | 'image/jpeg' | 'image/webp'

export interface ExportFormatOption {
  id: ExportFormat
  label: string
  extension: string
  description: string
  supportsQuality: boolean
  supportsAlpha: boolean
}

export const EXPORT_FORMAT_OPTIONS: ExportFormatOption[] = [
  {
    id: 'image/png',
    label: 'PNG',
    extension: 'png',
    description: 'Lossless compression with full alpha transparency',
    supportsQuality: false,
    supportsAlpha: true,
  },
  {
    id: 'image/jpeg',
    label: 'JPEG',
    extension: 'jpg',
    description: 'Compact photo format (opaque background)',
    supportsQuality: true,
    supportsAlpha: false,
  },
  {
    id: 'image/webp',
    label: 'WebP',
    extension: 'webp',
    description: 'Modern high-efficiency format with alpha support',
    supportsQuality: true,
    supportsAlpha: true,
  },
]

export interface ExportOptions {
  filename: string
  format: ExportFormat
  /** Compression quality from 1 to 100 (for JPEG & WebP) */
  qualityPercent: number
}

export interface ExportOutputResult {
  blob: Blob
  width: number
  height: number
  filename: string
  byteSize: number
}
