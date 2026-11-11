export interface AdjustmentValues {
  exposure: number       // -5.0 to +5.0 EV, step 0.1, default 0.0
  brilliance: number     // -100.0 to +100.0, step 0.1, default 0.0
  highlights: number     // -100.0 to +100.0, step 0.1, default 0.0
  shadows: number        // -100.0 to +100.0, step 0.1, default 0.0
  contrast: number       // -100.0 to +100.0, step 0.1, default 0.0
  brightness: number     // -100.0 to +100.0, step 0.1, default 0.0
  saturation: number     // -100.0 to +100.0, step 0.1, default 0.0
  vibrance: number       // -100.0 to +100.0, step 0.1, default 0.0
  warmth: number         // -100.0 to +100.0, step 0.1, default 0.0
  tint: number           // -100.0 to +100.0, step 0.1, default 0.0
  sharpness: number      // 0.0 to +100.0, step 0.1, default 0.0
  definition: number     // 0.0 to +100.0, step 0.1, default 0.0
  noise: number          // 0.0 to +100.0, step 0.1, default 0.0
}

export const defaultAdjustments: AdjustmentValues = {
  exposure: 0.0,
  brilliance: 0.0,
  highlights: 0.0,
  shadows: 0.0,
  contrast: 0.0,
  brightness: 0.0,
  saturation: 0.0,
  vibrance: 0.0,
  warmth: 0.0,
  tint: 0.0,
  sharpness: 0.0,
  definition: 0.0,
  noise: 0.0,
}

export interface OrientationValues {
  rotation: number       // in degrees: 0, 90, 180, 270, or arbitrary
  flipH: boolean
  flipV: boolean
  scaleX: number         // for stretch: 1.0 default
  scaleY: number         // for stretch: 1.0 default
}

export const defaultOrientation: OrientationValues = {
  rotation: 0,
  flipH: false,
  flipV: false,
  scaleX: 1.0,
  scaleY: 1.0,
}

export interface DocumentHistoryEntry {
  imageSrc: string
  imageBlob?: Blob
  width: number
  height: number
  adjustments: AdjustmentValues
  orientation: OrientationValues
}

export interface DocumentState {
  id: string
  name: string
  originalWidth: number
  originalHeight: number
  currentWidth: number
  currentHeight: number
  imageSrc: string
  imageBlob?: Blob
  thumbnailUrl?: string
  isModified: boolean
  adjustments: AdjustmentValues
  orientation: OrientationValues
  history: DocumentHistoryEntry[]
  historyIndex: number
  createdAt: number
  updatedAt: number
}

export const MAX_TAB_LIMIT = 6
export const MAX_IMPORT_DIMENSION = 4096
