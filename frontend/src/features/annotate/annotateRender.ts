import {
  type AnnotateItem,
  type AnnotateShapeItem,
  type AnnotatePaintItem,
  type AnnotateTextItem,
} from './types'
import {
  getNormalizedBox,
  getArrowheadPoints,
  getStarVertices,
  getTriangleVertices,
  hexToRgba,
} from './annotateMath'
import { type TransformResult } from '@/types/transform'

function drawPolygonPath(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]) {
  if (points.length === 0) return
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.closePath()
}

export function renderShapeItem(ctx: CanvasRenderingContext2D, item: AnnotateShapeItem) {
  ctx.save()
  const doFill = item.styleMode === 'filled' || item.styleMode === 'both'
  const doStroke = item.styleMode === 'outline' || item.styleMode === 'both'

  ctx.strokeStyle = hexToRgba(item.strokeColor, item.opacity)
  ctx.fillStyle = hexToRgba(item.fillColor, item.opacity)
  ctx.lineWidth = item.strokeWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const box = getNormalizedBox(item.start, item.end)

  switch (item.geometry) {
    case 'rectangle': {
      ctx.beginPath()
      const r = Math.min(item.cornerRadius, box.width / 2, box.height / 2)
      if (typeof ctx.roundRect === 'function' && r > 0) {
        ctx.roundRect(box.x, box.y, box.width, box.height, r)
      } else {
        ctx.rect(box.x, box.y, box.width, box.height)
      }
      if (doFill) ctx.fill()
      if (doStroke) ctx.stroke()
      break
    }
    case 'circle': {
      ctx.beginPath()
      ctx.ellipse(
        box.x + box.width / 2,
        box.y + box.height / 2,
        Math.max(1, box.width / 2),
        Math.max(1, box.height / 2),
        0,
        0,
        Math.PI * 2
      )
      if (doFill) ctx.fill()
      if (doStroke) ctx.stroke()
      break
    }
    case 'line': {
      ctx.beginPath()
      ctx.moveTo(item.start.x, item.start.y)
      ctx.lineTo(item.end.x, item.end.y)
      ctx.stroke()
      break
    }
    case 'arrow': {
      ctx.beginPath()
      ctx.moveTo(item.start.x, item.start.y)
      ctx.lineTo(item.end.x, item.end.y)
      ctx.stroke()

      const [w1, tip, w2] = getArrowheadPoints(item.start, item.end, item.strokeWidth)
      ctx.beginPath()
      ctx.moveTo(w1.x, w1.y)
      ctx.lineTo(tip.x, tip.y)
      ctx.lineTo(w2.x, w2.y)
      if (doFill) {
        ctx.closePath()
        ctx.fill()
      }
      ctx.stroke()
      break
    }
    case 'star': {
      const pts = getStarVertices(item.start, item.end, 5)
      drawPolygonPath(ctx, pts)
      if (doFill) ctx.fill()
      if (doStroke) ctx.stroke()
      break
    }
    case 'triangle': {
      const pts = getTriangleVertices(item.start, item.end)
      drawPolygonPath(ctx, pts)
      if (doFill) ctx.fill()
      if (doStroke) ctx.stroke()
      break
    }
  }
  ctx.restore()
}

export function renderPaintItem(ctx: CanvasRenderingContext2D, item: AnnotatePaintItem) {
  if (item.points.length === 0) return
  ctx.save()
  const effectiveOpacity = item.brushMode === 'highlighter' ? Math.min(45, item.opacity) : item.opacity
  ctx.strokeStyle = hexToRgba(item.color, effectiveOpacity)
  ctx.fillStyle = hexToRgba(item.color, effectiveOpacity)
  ctx.lineWidth = item.size
  ctx.lineCap = item.brushMode === 'highlighter' ? 'square' : 'round'
  ctx.lineJoin = 'round'

  if (item.points.length === 1) {
    ctx.beginPath()
    ctx.arc(item.points[0].x, item.points[0].y, item.size / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    return
  }

  ctx.beginPath()
  ctx.moveTo(item.points[0].x, item.points[0].y)
  for (let i = 1; i < item.points.length - 1; i++) {
    const midX = (item.points[i].x + item.points[i + 1].x) / 2
    const midY = (item.points[i].y + item.points[i + 1].y) / 2
    ctx.quadraticCurveTo(item.points[i].x, item.points[i].y, midX, midY)
  }
  const last = item.points[item.points.length - 1]
  ctx.lineTo(last.x, last.y)
  ctx.stroke()
  ctx.restore()
}

export function renderTextItem(ctx: CanvasRenderingContext2D, item: AnnotateTextItem) {
  const lines = item.text.split('\n').filter((l) => l.length > 0)
  if (lines.length === 0) return

  ctx.save()
  const weight = item.bold ? 'bold ' : ''
  const style = item.italic ? 'italic ' : ''
  ctx.font = `${style}${weight}${item.fontSize}px ${item.fontFamily}`
  ctx.textAlign = item.align
  ctx.textBaseline = 'top'

  const lineHeight = Math.round(item.fontSize * 1.22)
  const totalHeight = lines.length * lineHeight
  let maxWidth = 0
  for (const line of lines) {
    const m = ctx.measureText(line)
    if (m.width > maxWidth) maxWidth = m.width
  }

  const padX = Math.max(8, Math.round(item.fontSize * 0.35))
  const padY = Math.max(6, Math.round(item.fontSize * 0.22))
  let boxX = item.position.x - padX
  if (item.align === 'center') boxX = item.position.x - maxWidth / 2 - padX
  else if (item.align === 'right') boxX = item.position.x - maxWidth - padX
  const boxY = item.position.y - totalHeight / 2 - padY

  if (item.badgeEnabled) {
    ctx.fillStyle = hexToRgba(item.badgeColor, Math.min(90, item.opacity))
    ctx.beginPath()
    const bw = maxWidth + padX * 2
    const bh = totalHeight + padY * 2
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(boxX, boxY, bw, bh, 8)
    } else {
      ctx.rect(boxX, boxY, bw, bh)
    }
    ctx.fill()
  }

  ctx.fillStyle = hexToRgba(item.color, item.opacity)
  const startY = item.position.y - totalHeight / 2
  lines.forEach((line, idx) => {
    ctx.fillText(line, item.position.x, startY + idx * lineHeight)
  })
  ctx.restore()
}

export function renderAllAnnotations(
  ctx: CanvasRenderingContext2D,
  items: AnnotateItem[],
  activeDraft?: AnnotateItem | null
) {
  const all = activeDraft ? [...items, activeDraft] : items
  for (const item of all) {
    if (item.kind === 'shape') renderShapeItem(ctx, item)
    else if (item.kind === 'paint') renderPaintItem(ctx, item)
    else if (item.kind === 'text') renderTextItem(ctx, item)
  }
}

export async function bakeAnnotationsToImage(
  imageSrc: string,
  width: number,
  height: number,
  items: AnnotateItem[]
): Promise<TransformResult> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    if (!imageSrc.startsWith('blob:') && !imageSrc.startsWith('data:')) el.crossOrigin = 'anonymous'
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('Failed to load base image for annotation bake'))
    el.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.drawImage(img, 0, 0, width, height)
    renderAllAnnotations(ctx, items)
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    if (typeof canvas.toBlob !== 'function') {
      resolve(new Blob(['mock-annotated'], { type: 'image/png' }))
      return
    }
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to encode annotated image'))), 'image/png')
  })

  return { url: URL.createObjectURL(blob), blob, width, height }
}
