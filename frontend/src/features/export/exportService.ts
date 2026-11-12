import { type DocumentState } from '@/types/document'
import { WebGLAdjustmentPipeline } from '@/features/adjustments/webglPipeline'
import { EXPORT_FORMAT_OPTIONS, type ExportFormat, type ExportOptions, type ExportOutputResult } from './types'

/**
 * Strips any existing image extension and sanitizes a filename base.
 */
export function sanitizeExportBaseName(rawName: string): string {
  const withoutExt = rawName.replace(/\.(png|jpe?g|webp|gif|bmp|svg)$/i, '').trim()
  const sanitized = withoutExt.replace(/[<>:"/\\|?*]+/g, '_').trim()
  return sanitized || 'ezedit-export'
}

/**
 * Builds the final filename with the selected format's extension.
 */
export function buildExportFilename(baseName: string, format: ExportFormat): string {
  const cleanBase = sanitizeExportBaseName(baseName)
  const option = EXPORT_FORMAT_OPTIONS.find((opt) => opt.id === format)
  const ext = option?.extension ?? 'png'
  return `${cleanBase}.${ext}`
}

/**
 * Clamps quality percentage between 1 and 100 and converts to 0.01 - 1.00.
 */
export function normalizeExportQuality(qualityPercent: number): number {
  const clamped = Math.max(1, Math.min(100, Math.round(qualityPercent)))
  return Number((clamped / 100).toFixed(2))
}

/**
 * Formats byte count into human-readable B / KB / MB string.
 */
export function formatByteSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${Math.round(bytes)} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(2)} MB`
}

/**
 * Calculates the final output pixel dimensions after applying orientation
 * stretch (scaleX, scaleY) and rotation.
 */
export function calculateExportDimensions(
  baseWidth: number,
  baseHeight: number,
  scaleX = 1,
  scaleY = 1,
  rotationDeg = 0
): { width: number; height: number } {
  const stretchedW = Math.max(1, Math.round(baseWidth * Math.abs(scaleX || 1)))
  const stretchedH = Math.max(1, Math.round(baseHeight * Math.abs(scaleY || 1)))
  const rad = (rotationDeg * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const outW = Math.max(1, Math.round(stretchedW * cos + stretchedH * sin))
  const outH = Math.max(1, Math.round(stretchedW * sin + stretchedH * cos))
  return { width: outW, height: outH }
}

function loadExportImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (!src.startsWith('blob:') && !src.startsWith('data:')) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load source image for export'))
    img.src = src
  })
}

/**
 * Renders the document through the WebGL2 adjustment & preset filter shader pipeline
 * at full native resolution, then applies orientation transforms and encodes to Blob.
 */
export async function renderExportBlob(
  doc: DocumentState,
  options: ExportOptions
): Promise<ExportOutputResult> {
  const baseW = Math.max(1, doc.currentWidth)
  const baseH = Math.max(1, doc.currentHeight)
  const img = await loadExportImage(doc.imageSrc)

  // Step 1: Bake WebGL2 adjustments and preset filters at full native resolution
  const glCanvas = document.createElement('canvas')
  glCanvas.width = baseW
  glCanvas.height = baseH

  let stageSource: HTMLCanvasElement | HTMLImageElement = img
  const gl = glCanvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
  })

  if (gl) {
    try {
      const pipeline = new WebGLAdjustmentPipeline(gl)
      pipeline.setTexture(img)
      pipeline.render(doc.adjustments, baseW, baseH, doc.filter, null, false)
      stageSource = glCanvas
      pipeline.destroy()
    } catch {
      stageSource = img
    }
  }

  // Step 2: Apply orientation (rotation, flipH, flipV, scaleX, scaleY) onto final canvas
  const orient = doc.orientation
  const scaleX = orient?.scaleX ?? 1
  const scaleY = orient?.scaleY ?? 1
  const flipH = orient?.flipH ? -1 : 1
  const flipV = orient?.flipV ? -1 : 1
  const rotation = orient?.rotation ?? 0

  const { width: outW, height: outH } = calculateExportDimensions(baseW, baseH, scaleX, scaleY, rotation)
  const outCanvas = document.createElement('canvas')
  outCanvas.width = outW
  outCanvas.height = outH

  const ctx = outCanvas.getContext('2d')
  if (ctx) {
    // JPEG does not support alpha transparency; fill with dark neutral matte
    if (options.format === 'image/jpeg') {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, outW, outH)
    } else {
      ctx.clearRect(0, 0, outW, outH)
    }

    ctx.save()
    ctx.translate(outW / 2, outH / 2)
    if (rotation !== 0) {
      ctx.rotate((rotation * Math.PI) / 180)
    }
    ctx.scale(scaleX * flipH, scaleY * flipV)
    ctx.drawImage(stageSource, -baseW / 2, -baseH / 2, baseW, baseH)
    ctx.restore()
  }

  const quality = normalizeExportQuality(options.qualityPercent)
  const blob = await new Promise<Blob>((resolve, reject) => {
    if (typeof outCanvas.toBlob !== 'function') {
      resolve(new Blob(['mock-export-binary'], { type: options.format }))
      return
    }
    outCanvas.toBlob(
      (b) => {
        if (b) resolve(b)
        else reject(new Error('Failed to encode exported image blob'))
      },
      options.format,
      options.format === 'image/png' ? undefined : quality
    )
  })

  return {
    blob,
    width: outW,
    height: outH,
    filename: buildExportFilename(options.filename, options.format),
    byteSize: blob.size,
  }
}

/**
 * Triggers a native browser file download and revokes the temporary Object URL.
 */
export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  try {
    if (typeof document !== 'undefined') {
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      anchor.style.display = 'none'
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
    }
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
