import { type Point, type SelectionMode } from '@/types/selection'

export function createRectPath(p1: Point, p2: Point): Point[] {
  const minX = Math.min(p1.x, p2.x)
  const maxX = Math.max(p1.x, p2.x)
  const minY = Math.min(p1.y, p2.y)
  const maxY = Math.max(p1.y, p2.y)

  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ]
}

export function createEllipsePath(p1: Point, p2: Point, segments = 36): Point[] {
  const minX = Math.min(p1.x, p2.x)
  const maxX = Math.max(p1.x, p2.x)
  const minY = Math.min(p1.y, p2.y)
  const maxY = Math.max(p1.y, p2.y)

  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const rx = Math.max(1, (maxX - minX) / 2)
  const ry = Math.max(1, (maxY - minY) / 2)

  const points: Point[] = []
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    points.push({
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry,
    })
  }
  return points
}

export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y

    const intersect = yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function getBoundingBox(paths: Point[][]): {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
} | null {
  if (paths.length === 0) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let count = 0

  for (const path of paths) {
    for (const p of path) {
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
      count++
    }
  }

  if (count === 0) return null

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  }
}

export function buildPath2D(paths: Point[][]): Path2D {
  const path2d = new Path2D()
  for (const loop of paths) {
    if (loop.length < 2) continue
    path2d.moveTo(loop[0].x, loop[0].y)
    for (let i = 1; i < loop.length; i++) {
      path2d.lineTo(loop[i].x, loop[i].y)
    }
    path2d.closePath()
  }
  return path2d
}

export function combinePaths(
  existing: Point[][],
  newPath: Point[],
  mode: SelectionMode
): Point[][] {
  if (newPath.length < 3) return existing

  if (mode === 'add') {
    return [...existing, newPath]
  }

  if (mode === 'subtract') {
    // If subtracting, filter out or trim points
    // When subtracting a path, keep existing paths that don't fall completely within the subtracted path
    return existing.filter((p) => {
      // Check if majority of vertices are inside the subtract path
      const insideCount = p.filter((pt) => isPointInPolygon(pt, newPath)).length
      return insideCount < p.length * 0.75
    })
  }

  return existing
}
