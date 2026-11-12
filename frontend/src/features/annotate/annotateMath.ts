import { type AnnotatePoint } from './types'

/**
 * Normalizes two drag points into a positive bounding box { x, y, width, height }.
 */
export function getNormalizedBox(p1: AnnotatePoint, p2: AnnotatePoint): {
  x: number
  y: number
  width: number
  height: number
} {
  const x = Math.min(p1.x, p2.x)
  const y = Math.min(p1.y, p2.y)
  const width = Math.abs(p2.x - p1.x)
  const height = Math.abs(p2.y - p1.y)
  return { x, y, width, height }
}

/**
 * Computes the two wing points for an arrowhead at `end` pointing from `start` -> `end`.
 */
export function getArrowheadPoints(
  start: AnnotatePoint,
  end: AnnotatePoint,
  strokeWidth: number
): [AnnotatePoint, AnnotatePoint, AnnotatePoint] {
  const angle = Math.atan2(end.y - start.y, end.x - start.x)
  const headLength = Math.max(12, strokeWidth * 3.5)
  const spread = Math.PI / 6 // 30 degrees

  const wing1: AnnotatePoint = {
    x: end.x - headLength * Math.cos(angle - spread),
    y: end.y - headLength * Math.sin(angle - spread),
  }
  const wing2: AnnotatePoint = {
    x: end.x - headLength * Math.cos(angle + spread),
    y: end.y - headLength * Math.sin(angle + spread),
  }
  return [wing1, end, wing2]
}

/**
 * Generates the 10 alternating outer/inner vertices of a 5-point star inside a bounding box.
 */
export function getStarVertices(
  p1: AnnotatePoint,
  p2: AnnotatePoint,
  spikes = 5
): AnnotatePoint[] {
  const box = getNormalizedBox(p1, p2)
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  const outerRx = box.width / 2
  const outerRy = box.height / 2
  const innerRx = outerRx * 0.42
  const innerRy = outerRy * 0.42

  const vertices: AnnotatePoint[] = []
  const totalPoints = spikes * 2
  for (let i = 0; i < totalPoints; i++) {
    const isOuter = i % 2 === 0
    const rx = isOuter ? outerRx : innerRx
    const ry = isOuter ? outerRy : innerRy
    const angle = (i * Math.PI) / spikes - Math.PI / 2
    vertices.push({
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry,
    })
  }
  return vertices
}

/**
 * Generates the 3 vertices of an isosceles triangle inside a bounding box.
 */
export function getTriangleVertices(
  p1: AnnotatePoint,
  p2: AnnotatePoint
): [AnnotatePoint, AnnotatePoint, AnnotatePoint] {
  const box = getNormalizedBox(p1, p2)
  const top: AnnotatePoint = { x: box.x + box.width / 2, y: box.y }
  const bottomRight: AnnotatePoint = { x: box.x + box.width, y: box.y + box.height }
  const bottomLeft: AnnotatePoint = { x: box.x, y: box.y + box.height }
  return [top, bottomRight, bottomLeft]
}

/**
 * Converts a 6-digit hex color and opacity (0-100) into an rgba() CSS string.
 */
export function hexToRgba(hex: string, opacityPercent: number): string {
  const clean = hex.replace('#', '').trim()
  const alpha = Math.max(0, Math.min(1, opacityPercent / 100))
  if (clean.length !== 6) return `rgba(59, 130, 246, ${alpha})`
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  if ([r, g, b].some((v) => Number.isNaN(v))) {
    return `rgba(59, 130, 246, ${alpha})`
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
