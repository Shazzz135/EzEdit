export type RetouchTool = 'clone-stamp' | 'healing-brush' | 'spot-heal'

export interface Point {
  x: number
  y: number
}

export interface RetouchSettings {
  radius: number // Brush radius in pixels (2 - 150)
  hardness: number // Edge hardness 0.0 (soft Gaussian-like) to 1.0 (hard edge)
  opacity: number // Stroke opacity 0.1 to 1.0
}

export interface RetouchState {
  tool: RetouchTool
  settings: RetouchSettings
  sourcePoint: Point | null
  isAltPressed: boolean
}
