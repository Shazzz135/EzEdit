import { get, set, del, clear, createStore } from 'idb-keyval'
import {
  type DocumentState,
  type DocumentHistoryEntry,
  type AdjustmentValues,
  type OrientationValues,
  type FilterState,
  defaultAdjustments,
  defaultOrientation,
  defaultFilterState,
} from '@/types/document'

export const ezEditStore = createStore('ezedit_db', 'documents')

export interface StoredDocumentMeta {
  id: string
  name: string
  originalWidth: number
  originalHeight: number
  currentWidth: number
  currentHeight: number
  thumbnailUrl?: string
  isModified: boolean
  adjustments: AdjustmentValues
  orientation: OrientationValues
  filter: FilterState
  createdAt: number
  updatedAt: number
}

export interface StoredSession {
  activeDocumentId: string | null
  documentIds: string[]
  updatedAt: number
}

export interface StorageQuotaEstimate {
  quota: number
  usage: number
  percentUsed: number
  isExceeded: boolean
}

const SESSION_KEY = 'ezedit_session'
const META_PREFIX = 'ezedit_meta_'
const BLOB_PREFIX = 'ezedit_blob_'
const ORIG_BLOB_PREFIX = 'ezedit_orig_blob_'

export async function saveDocumentBlob(id: string, blob: Blob): Promise<void> {
  await set(`${BLOB_PREFIX}${id}`, blob, ezEditStore)
}

export async function getDocumentBlob(id: string): Promise<Blob | undefined> {
  return await get<Blob>(`${BLOB_PREFIX}${id}`, ezEditStore)
}

export async function saveOriginalDocumentBlob(id: string, blob: Blob): Promise<void> {
  await set(`${ORIG_BLOB_PREFIX}${id}`, blob, ezEditStore)
}

export async function getOriginalDocumentBlob(id: string): Promise<Blob | undefined> {
  return await get<Blob>(`${ORIG_BLOB_PREFIX}${id}`, ezEditStore)
}

export async function saveDocumentMeta(id: string, meta: StoredDocumentMeta): Promise<void> {
  await set(`${META_PREFIX}${id}`, meta, ezEditStore)
}

export async function getDocumentMeta(id: string): Promise<StoredDocumentMeta | undefined> {
  return await get<StoredDocumentMeta>(`${META_PREFIX}${id}`, ezEditStore)
}

export async function saveSession(session: StoredSession): Promise<void> {
  await set(SESSION_KEY, session, ezEditStore)
}

export async function getSession(): Promise<StoredSession | undefined> {
  return await get<StoredSession>(SESSION_KEY, ezEditStore)
}

export async function deleteDocument(id: string): Promise<void> {
  await del(`${META_PREFIX}${id}`, ezEditStore)
  await del(`${BLOB_PREFIX}${id}`, ezEditStore)
  await del(`${ORIG_BLOB_PREFIX}${id}`, ezEditStore)
}

export async function clearAllStorage(): Promise<void> {
  await clear(ezEditStore)
}

export async function checkStorageQuota(): Promise<StorageQuotaEstimate> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate()
      const usage = estimate.usage || 0
      const quota = estimate.quota || 0
      const percentUsed = quota > 0 ? (usage / quota) * 100 : 0
      return {
        quota,
        usage,
        percentUsed,
        isExceeded: percentUsed >= 80,
      }
    } catch {
      // Fallback if permission or API fails
    }
  }
  return { quota: 0, usage: 0, percentUsed: 0, isExceeded: false }
}

export async function loadAllDocuments(): Promise<{
  documents: DocumentState[]
  activeDocumentId: string | null
}> {
  const session = await getSession()
  if (!session || !session.documentIds || session.documentIds.length === 0) {
    return { documents: [], activeDocumentId: null }
  }

  const documents: DocumentState[] = []

  for (const id of session.documentIds) {
    const meta = await getDocumentMeta(id)
    const blob = await getDocumentBlob(id)

    if (meta && blob) {
      let origBlob = await getOriginalDocumentBlob(id)
      if (!origBlob) {
        origBlob = blob
        await saveOriginalDocumentBlob(id, origBlob)
      }
      const originalImageSrc = URL.createObjectURL(origBlob)
      const imageSrc = origBlob === blob ? originalImageSrc : URL.createObjectURL(blob)
      const adjustmentsState = meta.adjustments ? { ...defaultAdjustments, ...meta.adjustments } : { ...defaultAdjustments }
      const orientationState = meta.orientation ? { ...defaultOrientation, ...meta.orientation } : { ...defaultOrientation }
      const filterState = meta.filter ? { ...meta.filter } : { ...defaultFilterState }

      const baseEntry: DocumentHistoryEntry = {
        imageSrc: originalImageSrc,
        imageBlob: origBlob,
        width: meta.originalWidth || meta.currentWidth,
        height: meta.originalHeight || meta.currentHeight,
        adjustments: { ...defaultAdjustments },
        orientation: { ...defaultOrientation },
        filter: { ...defaultFilterState },
      }

      const history: DocumentHistoryEntry[] = meta.isModified
        ? [
            baseEntry,
            {
              imageSrc,
              imageBlob: blob,
              width: meta.currentWidth,
              height: meta.currentHeight,
              adjustments: { ...adjustmentsState },
              orientation: { ...orientationState },
              filter: { ...filterState },
            },
          ]
        : [baseEntry]

      documents.push({
        ...meta,
        imageSrc,
        imageBlob: blob,
        originalImageSrc,
        originalImageBlob: origBlob,
        adjustments: adjustmentsState,
        orientation: orientationState,
        filter: filterState,
        resetVersion: 0,
        history,
        historyIndex: history.length - 1,
      })
    }
  }

  return {
    documents,
    activeDocumentId: session.activeDocumentId,
  }
}
