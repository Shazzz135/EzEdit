export type RetouchTool = 'clone-stamp' | 'healing-brush' | 'spot-heal' | 'object-remove'

export type InpaintingMethod = 'pollinations-ai'

export interface Point {
  x: number
  y: number
}

export interface MaskStroke {
  points: Point[]
  radius: number
}

export interface RetouchSettings {
  radius: number // Brush radius in pixels (2 - 150)
  hardness: number // Edge hardness 0.0 to 1.0
  opacity: number // Stroke opacity 0.1 to 1.0
  inpaintMethod: InpaintingMethod
  inpaintPrompt: string
}

export interface RetouchState {
  tool: RetouchTool
  settings: RetouchSettings
  sourcePoint: Point | null
  isAltPressed: boolean
  isProcessingInpaint: boolean
  inpaintProgress: number
}
