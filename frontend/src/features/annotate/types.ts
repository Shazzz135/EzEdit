export type AnnotateSubTool = 'shapes' | 'paint' | 'text'

export type ShapeGeometry =
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'star'
  | 'triangle'

export type ShapeStyleMode = 'outline' | 'filled' | 'both'

export type PaintBrushMode = 'brush' | 'highlighter'

export type FontFamilyOption =
  | 'sans-serif'
  | 'serif'
  | 'monospace'
  | 'Impact, sans-serif'
  | 'cursive'

export type TextAlignOption = 'left' | 'center' | 'right'

export interface AnnotatePoint {
  x: number
  y: number
}

export interface AnnotateShapeItem {
  id: string
  kind: 'shape'
  geometry: ShapeGeometry
  styleMode: ShapeStyleMode
  start: AnnotatePoint
  end: AnnotatePoint
  strokeColor: string
  fillColor: string
  strokeWidth: number
  cornerRadius: number
  opacity: number
}

export interface AnnotatePaintItem {
  id: string
  kind: 'paint'
  brushMode: PaintBrushMode
  points: AnnotatePoint[]
  color: string
  size: number
  opacity: number
}

export interface AnnotateTextItem {
  id: string
  kind: 'text'
  position: AnnotatePoint
  text: string
  fontFamily: FontFamilyOption
  fontSize: number
  bold: boolean
  italic: boolean
  align: TextAlignOption
  color: string
  opacity: number
  badgeEnabled: boolean
  badgeColor: string
}

export type AnnotateItem =
  | AnnotateShapeItem
  | AnnotatePaintItem
  | AnnotateTextItem

export interface AnnotateSettings {
  subTool: AnnotateSubTool
  // Shape settings
  shapeGeometry: ShapeGeometry
  shapeStyleMode: ShapeStyleMode
  strokeColor: string
  fillColor: string
  strokeWidth: number
  cornerRadius: number
  // Paint settings
  paintMode: PaintBrushMode
  brushSize: number
  // Shared opacity (10 to 100)
  opacity: number
  // Text settings
  textDraft: string
  fontFamily: FontFamilyOption
  fontSize: number
  bold: boolean
  italic: boolean
  textAlign: TextAlignOption
  badgeEnabled: boolean
  badgeColor: string
}

export const PRESET_SWATCHES: { label: string; hex: string }[] = [
  { label: 'White', hex: '#FFFFFF' },
  { label: 'Black', hex: '#111116' },
  { label: 'Slate', hex: '#64748B' },
  { label: 'Red', hex: '#EF4444' },
  { label: 'Orange', hex: '#F97316' },
  { label: 'Amber', hex: '#F59E0B' },
  { label: 'Green', hex: '#22C55E' },
  { label: 'Cyan', hex: '#06B6D4' },
  { label: 'Blue', hex: '#3B82F6' },
  { label: 'Purple', hex: '#A855F7' },
  { label: 'Pink', hex: '#EC4899' },
  { label: 'Rose', hex: '#F43F5E' },
]

export const DEFAULT_ANNOTATE_SETTINGS: AnnotateSettings = {
  subTool: 'shapes',
  shapeGeometry: 'rectangle',
  shapeStyleMode: 'outline',
  strokeColor: '#3B82F6',
  fillColor: '#3B82F6',
  strokeWidth: 4,
  cornerRadius: 8,
  paintMode: 'brush',
  brushSize: 12,
  opacity: 100,
  textDraft: 'Sample Text',
  fontFamily: 'sans-serif',
  fontSize: 36,
  bold: true,
  italic: false,
  textAlign: 'center',
  badgeEnabled: false,
  badgeColor: '#111116',
}
