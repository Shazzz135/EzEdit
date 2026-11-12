import { useEffect, useRef, useState, useCallback } from 'react'
import { useDocumentStore } from './useDocumentStore'
import {
  loadAllDocuments,
  saveDocumentBlob,
  saveOriginalDocumentBlob,
  saveDocumentMeta,
  saveSession,
  deleteDocument,
  checkStorageQuota,
  type StorageQuotaEstimate,
} from '@/services/storage/indexedDbService'
import { type DocumentState } from '@/types/document'

export interface UseDocumentPersistenceReturn {
  isHydrated: boolean
  quotaWarning: StorageQuotaEstimate | null
  dismissQuotaWarning: () => void
}

export function useDocumentPersistence(): UseDocumentPersistenceReturn {
  const [isHydrated, setIsHydrated] = useState(false)
  const [quotaWarning, setQuotaWarning] = useState<StorageQuotaEstimate | null>(null)
  const prevDocIdsRef = useRef<Set<string>>(new Set())
  const prevImageSrcsRef = useRef<Map<string, string>>(new Map())
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { documents, activeDocumentId, setHydratedDocuments } = useDocumentStore()

  // 1. Initial hydration on mount
  useEffect(() => {
    let mounted = true

    async function initHydration() {
      try {
        const quota = await checkStorageQuota()
        if (mounted && quota.isExceeded) {
          setQuotaWarning(quota)
        }

        const loaded = await loadAllDocuments()
        if (mounted) {
          if (loaded.documents.length > 0) {
            setHydratedDocuments(loaded.documents, loaded.activeDocumentId)
            prevDocIdsRef.current = new Set(loaded.documents.map((d) => d.id))
            prevImageSrcsRef.current = new Map(loaded.documents.map((d) => [d.id, d.imageSrc]))
          }
          setIsHydrated(true)
        }
      } catch (err) {
        console.error('Failed to hydrate documents from IndexedDB:', err)
        if (mounted) setIsHydrated(true)
      }
    }

    initHydration()

    return () => {
      mounted = false
    }
  }, [setHydratedDocuments])

  // Helper to extract blob from doc
  const ensureBlob = useCallback(async (doc: DocumentState): Promise<Blob | null> => {
    if (doc.imageBlob) return doc.imageBlob
    try {
      const res = await fetch(doc.imageSrc)
      return await res.blob()
    } catch {
      return null
    }
  }, [])

  // 2. Debounced synchronizer to IndexedDB
  useEffect(() => {
    if (!isHydrated) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const currentIds = new Set(documents.map((d) => d.id))

      // Delete removed documents
      for (const oldId of prevDocIdsRef.current) {
        if (!currentIds.has(oldId)) {
          await deleteDocument(oldId)
          prevImageSrcsRef.current.delete(oldId)
        }
      }

      // Save each document
      for (const doc of documents) {
        const isNewDoc = !prevDocIdsRef.current.has(doc.id)
        if (isNewDoc) {
          const origBlob = doc.originalImageBlob || doc.history?.[0]?.imageBlob || (await ensureBlob(doc))
          if (origBlob) {
            await saveOriginalDocumentBlob(doc.id, origBlob)
          }
        }

        if (isNewDoc || prevImageSrcsRef.current.get(doc.id) !== doc.imageSrc) {
          const blob = await ensureBlob(doc)
          if (blob) {
            await saveDocumentBlob(doc.id, blob)
            prevImageSrcsRef.current.set(doc.id, doc.imageSrc)
          }
        }

        // Always sync metadata
        await saveDocumentMeta(doc.id, {
          id: doc.id,
          name: doc.name,
          originalWidth: doc.originalWidth,
          originalHeight: doc.originalHeight,
          currentWidth: doc.currentWidth,
          currentHeight: doc.currentHeight,
          thumbnailUrl: doc.thumbnailUrl,
          isModified: doc.isModified,
          adjustments: doc.adjustments,
          orientation: doc.orientation,
          filter: doc.filter,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        })
      }

      // Save session
      await saveSession({
        activeDocumentId,
        documentIds: documents.map((d) => d.id),
        updatedAt: Date.now(),
      })

      prevDocIdsRef.current = currentIds
    }, 400)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [documents, activeDocumentId, isHydrated, ensureBlob])

  const dismissQuotaWarning = useCallback(() => {
    setQuotaWarning(null)
  }, [])

  return {
    isHydrated,
    quotaWarning,
    dismissQuotaWarning,
  }
}
