import {
  type DocumentState,
  type AdjustmentValues,
  type OrientationValues,
  type FilterState,
  type HistoryActionType,
  type DocumentHistoryEntry,
} from '@/types/document'

export interface TransferEditCategories {
  adjustments?: boolean
  filter?: boolean
}

export const lastStateOp: Record<string, { type: string; time: number }> = {}

export function pushOrReplaceHistory(
  doc: DocumentState,
  nextState: { adjustments: AdjustmentValues; orientation: OrientationValues; filter: FilterState },
  opKey?: string,
  meta?: { actionType?: HistoryActionType; description?: string }
): Pick<DocumentState, 'history' | 'historyIndex'> {
  const now = Date.now()
  const baseHistory = doc.history?.length ? doc.history : [{
    imageSrc: doc.imageSrc, imageBlob: doc.imageBlob, width: doc.currentWidth, height: doc.currentHeight,
    adjustments: { ...doc.adjustments }, orientation: { ...doc.orientation }, filter: { ...doc.filter },
    actionType: 'init' as const, description: 'Open Image', timestamp: now,
  }]
  const idx = doc.historyIndex ?? 0
  const historySlice = baseHistory.slice(0, idx + 1)
  const nextEntry: DocumentHistoryEntry = {
    imageSrc: doc.imageSrc, imageBlob: doc.imageBlob, width: doc.currentWidth, height: doc.currentHeight,
    adjustments: { ...nextState.adjustments }, orientation: { ...nextState.orientation }, filter: { ...nextState.filter },
    actionType: meta?.actionType, description: meta?.description, timestamp: now,
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
