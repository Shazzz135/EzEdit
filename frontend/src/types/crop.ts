export type AspectRatio =
  | 'free'
  | 'original'
  | '1:1'
  | '16:9'
  | '4:3'
  | '9:16'
  | '3:2'
  | '2:3'

export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

export type CropHandle =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
  | 'move'

export interface AspectRatioOption {
  id: AspectRatio
  label: string
  ratio?: number
}
