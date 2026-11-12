import {
  type DocumentState,
  type AdjustmentValues,
  type OrientationValues,
  type FilterState,
} from '@/types/document'

export interface TransferEditCategories {
  adjustments?: boolean
  filter?: boolean
}

export const lastStateOp: Record<string, { type: string; time: number }> = {}

export function pushOrReplaceHistory(
  doc: DocumentState,
  nextState: { adjustments: AdjustmentValues; orientation: OrientationValues; filter: FilterState },
  opKey?: string
): Pick<DocumentState, 'history' | 'historyIndex'> {
  const now = Date.now()
  const baseHistory = doc.history?.length ? doc.history : [{
    imageSrc: doc.imageSrc, imageBlob: doc.imageBlob, width: doc.currentWidth, height: doc.currentHeight,
    adjustments: { ...doc.adjustments }, orientation: { ...doc.orientation }, filter: { ...doc.filter },
  }]
  const idx = doc.historyIndex ?? 0
  const historySlice = baseHistory.slice(0, idx + 1)
  const nextEntry = {
    imageSrc: doc.imageSrc, imageBlob: doc.imageBlob, width: doc.currentWidth, height: doc.currentHeight,
    adjustments: { ...nextState.adjustments }, orientation: { ...nextState.orientation }, filter: { ...nextState.filter },
  }
  const prev = opKey ? lastStateOp[doc.id] : undefined
  if (opKey && prev && prev.type === opKey && now - prev.time < 450 && idx > 0) {
    lastStateOp[doc.id] = { type: opKey, time: now }
    return { history: [...historySlice.slice(0, -1), nextEntry], historyIndex: idx }
  }
  if (opKey) lastStateOp[doc.id] = { type: opKey, time: now }
  else delete lastStateOp[doc.id]
  return { history: [...historySlice, nextEntry], historyIndex: historySlice.length }
}
