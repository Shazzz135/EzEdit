export interface TransformResult {
  blob: Blob
  url: string
  width: number
  height: number
}

export type RotateDegree = number

export type FlipDirection = 'horizontal' | 'vertical'

export interface ResizeOptions {
  width: number
  height: number
  lockAspectRatio: boolean
}

export interface StretchOptions {
  scaleX: number
  scaleY: number
}
