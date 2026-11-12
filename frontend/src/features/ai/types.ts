export const MAX_PROMPT_LENGTH = 300

export type AIMode = 'generate' | 'edit'

export type AIAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4'

export type AIStyleModifier =
  | 'none'
  | 'photorealistic'
  | 'cinematic'
  | 'digital-art'
  | 'anime'
  | 'watercolor'
  | 'cyberpunk'
  | 'oil-painting'

export interface AIGenerateRequest {
  prompt: string
  aspectRatio: AIAspectRatio
  style: AIStyleModifier
  seed: number
  enhance: boolean
  mode?: AIMode
  sourceImageSrc?: string
  sourceWidth?: number
  sourceHeight?: number
}

export interface AIGeneratedResult {
  url: string
  blob: Blob
  width: number
  height: number
  prompt: string
  style: AIStyleModifier
  aspectRatio: AIAspectRatio
  seed: number
}
