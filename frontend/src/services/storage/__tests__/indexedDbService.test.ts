import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  saveDocumentBlob,
  getDocumentBlob,
  saveDocumentMeta,
  getDocumentMeta,
  saveSession,
  getSession,
  deleteDocument,
  clearAllStorage,
  checkStorageQuota,
  loadAllDocuments,
  type StoredDocumentMeta,
} from '../indexedDbService'
import { defaultAdjustments, defaultOrientation } from '@/types/document'

// Mock in-memory database store for idb-keyval
const inMemoryStore = new Map<string, unknown>()

vi.mock('idb-keyval', () => ({
  createStore: vi.fn(() => ({})),
  set: vi.fn(async (key: string, val: unknown) => {
    inMemoryStore.set(key, val)
  }),
  get: vi.fn(async (key: string) => {
    return inMemoryStore.get(key)
  }),
  del: vi.fn(async (key: string) => {
    inMemoryStore.delete(key)
  }),
  clear: vi.fn(async () => {
    inMemoryStore.clear()
  }),
}))

describe('indexedDbService', () => {
  beforeEach(() => {
    inMemoryStore.clear()
    vi.restoreAllMocks()
    globalThis.URL.createObjectURL = vi.fn((_blob: Blob) => 'blob:mock-url')
  })

  it('saves and retrieves document blob', async () => {
    const mockBlob = new Blob(['sample-image-data'], { type: 'image/png' })
    await saveDocumentBlob('doc_1', mockBlob)

    const retrieved = await getDocumentBlob('doc_1')
    expect(retrieved).toBeDefined()
    expect(retrieved).toBe(mockBlob)
  })

  it('saves and retrieves document metadata', async () => {
    const meta: StoredDocumentMeta = {
      id: 'doc_1',
      name: 'photo.png',
      originalWidth: 1920,
      originalHeight: 1080,
      currentWidth: 1920,
      currentHeight: 1080,
      isModified: true,
      adjustments: { ...defaultAdjustments, exposure: 1.5 },
      orientation: { ...defaultOrientation, rotation: 90 },
      createdAt: 1000,
      updatedAt: 2000,
    }

    await saveDocumentMeta('doc_1', meta)
    const retrieved = await getDocumentMeta('doc_1')

    expect(retrieved).toBeDefined()
    expect(retrieved?.name).toBe('photo.png')
    expect(retrieved?.adjustments.exposure).toBe(1.5)
    expect(retrieved?.orientation.rotation).toBe(90)
  })

  it('saves and retrieves session', async () => {
    await saveSession({
      activeDocumentId: 'doc_2',
      documentIds: ['doc_1', 'doc_2'],
      updatedAt: 12345,
    })

    const session = await getSession()
    expect(session).toBeDefined()
    expect(session?.activeDocumentId).toBe('doc_2')
    expect(session?.documentIds).toEqual(['doc_1', 'doc_2'])
  })

  it('deletes document metadata and blob', async () => {
    const mockBlob = new Blob(['data'], { type: 'image/png' })
    const meta: StoredDocumentMeta = {
      id: 'doc_1',
      name: 'test.png',
      originalWidth: 100,
      originalHeight: 100,
      currentWidth: 100,
      currentHeight: 100,
      isModified: false,
      adjustments: { ...defaultAdjustments },
      orientation: { ...defaultOrientation },
      createdAt: 1000,
      updatedAt: 1000,
    }

    await saveDocumentBlob('doc_1', mockBlob)
    await saveDocumentMeta('doc_1', meta)

    await deleteDocument('doc_1')

    expect(await getDocumentBlob('doc_1')).toBeUndefined()
    expect(await getDocumentMeta('doc_1')).toBeUndefined()
  })

  it('clears all storage', async () => {
    await saveSession({ activeDocumentId: null, documentIds: [], updatedAt: 1 })
    await clearAllStorage()
    expect(await getSession()).toBeUndefined()
  })

  it('estimates storage quota safely', async () => {
    const quota = await checkStorageQuota()
    expect(quota).toBeDefined()
    expect(typeof quota.isExceeded).toBe('boolean')
  })

  it('loads all documents and restores image blobs via object URLs', async () => {
    const mockBlob = new Blob(['binary'], { type: 'image/jpeg' })
    const meta: StoredDocumentMeta = {
      id: 'doc_alpha',
      name: 'sunset.jpg',
      originalWidth: 800,
      originalHeight: 600,
      currentWidth: 800,
      currentHeight: 600,
      isModified: false,
      adjustments: { ...defaultAdjustments },
      orientation: { ...defaultOrientation },
      createdAt: 500,
      updatedAt: 600,
    }

    await saveDocumentBlob('doc_alpha', mockBlob)
    await saveDocumentMeta('doc_alpha', meta)
    await saveSession({
      activeDocumentId: 'doc_alpha',
      documentIds: ['doc_alpha'],
      updatedAt: 1000,
    })

    const result = await loadAllDocuments()
    expect(result.activeDocumentId).toBe('doc_alpha')
    expect(result.documents.length).toBe(1)
    expect(result.documents[0].name).toBe('sunset.jpg')
    expect(result.documents[0].imageSrc).toBe('blob:mock-url')
    expect(result.documents[0].imageBlob).toBe(mockBlob)
  })
})
