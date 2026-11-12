import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  sanitizeExportBaseName,
  buildExportFilename,
  normalizeExportQuality,
  formatByteSize,
  calculateExportDimensions,
  triggerBrowserDownload,
  EXPORT_FORMAT_OPTIONS,
} from '../index'
import { useDocumentStore } from '@/features/tabs/useDocumentStore'

describe('Multi-Format High-Resolution Export Engine (Issue 8.2)', () => {
  beforeEach(() => {
    useDocumentStore.setState({ documents: [], activeDocumentId: null })
  })

  it('sanitizes filenames and strips existing extensions cleanly', () => {
    expect(sanitizeExportBaseName('Mountain_Photo.png')).toBe('Mountain_Photo')
    expect(sanitizeExportBaseName('portrait.JPEG')).toBe('portrait')
    expect(sanitizeExportBaseName('bad:name*chars?.webp')).toBe('bad_name_chars_')
    expect(sanitizeExportBaseName('   ')).toBe('ezedit-export')
  })

  it('builds final export filenames matching PNG, JPEG, and WebP extensions', () => {
    expect(buildExportFilename('Studio_Shot.jpg', 'image/png')).toBe('Studio_Shot.png')
    expect(buildExportFilename('Studio_Shot.png', 'image/jpeg')).toBe('Studio_Shot.jpg')
    expect(buildExportFilename('Studio_Shot', 'image/webp')).toBe('Studio_Shot.webp')
  })

  it('clamps and normalizes compression quality between 0.01 and 1.00', () => {
    expect(normalizeExportQuality(92)).toBe(0.92)
    expect(normalizeExportQuality(100)).toBe(1)
    expect(normalizeExportQuality(0)).toBe(0.01)
    expect(normalizeExportQuality(-25)).toBe(0.01)
    expect(normalizeExportQuality(150)).toBe(1)
  })

  it('formats byte sizes into human-readable B, KB, and MB units', () => {
    expect(formatByteSize(0)).toBe('0 B')
    expect(formatByteSize(512)).toBe('512 B')
    expect(formatByteSize(2048)).toBe('2.0 KB')
    expect(formatByteSize(1048576 * 2.5)).toBe('2.50 MB')
  })

  it('calculates output dimensions with stretch and rotation applied', () => {
    expect(calculateExportDimensions(1920, 1080, 1, 1, 0)).toEqual({ width: 1920, height: 1080 })
    expect(calculateExportDimensions(1920, 1080, 1, 1, 90)).toEqual({ width: 1080, height: 1920 })
    expect(calculateExportDimensions(1000, 500, 1.5, 2, 0)).toEqual({ width: 1500, height: 1000 })
  })

  it('exposes PNG, JPEG, and WebP format metadata with alpha and quality flags', () => {
    expect(EXPORT_FORMAT_OPTIONS).toHaveLength(3)
    const png = EXPORT_FORMAT_OPTIONS.find((f) => f.id === 'image/png')
    const jpeg = EXPORT_FORMAT_OPTIONS.find((f) => f.id === 'image/jpeg')
    const webp = EXPORT_FORMAT_OPTIONS.find((f) => f.id === 'image/webp')

    expect(png?.supportsAlpha).toBe(true)
    expect(png?.supportsQuality).toBe(false)
    expect(jpeg?.supportsAlpha).toBe(false)
    expect(jpeg?.supportsQuality).toBe(true)
    expect(webp?.supportsAlpha).toBe(true)
    expect(webp?.supportsQuality).toBe(true)
  })

  it('triggers browser download and marks document as exported', () => {
    const createObjSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-export')

    const blob = new Blob(['test-image'], { type: 'image/png' })
    triggerBrowserDownload(blob, 'final.png')

    expect(createObjSpy).toHaveBeenCalledWith(blob)

    const store = useDocumentStore.getState()
    const added = store.addDocument({
      name: 'Photo.png',
      imageSrc: 'blob:photo',
      imageBlob: blob,
      originalWidth: 800,
      originalHeight: 600,
      currentWidth: 800,
      currentHeight: 600,
    })

    store.updateAdjustments(added.id!, { exposure: 25 })
    expect(useDocumentStore.getState().getActiveDocument()?.isModified).toBe(true)

    store.markDocumentExported(added.id!)
    expect(useDocumentStore.getState().getActiveDocument()?.isModified).toBe(false)

    createObjSpy.mockRestore()
  })
})
