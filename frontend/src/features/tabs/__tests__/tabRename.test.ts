import { describe, it, expect, beforeEach } from 'vitest'
import { useDocumentStore } from '../useDocumentStore'

describe('Document Tab Renaming', () => {
  beforeEach(() => {
    useDocumentStore.getState().clearAllDocuments()
  })

  it('renames a document tab and updates state', () => {
    const store = useDocumentStore.getState()
    const doc = store.addDocument({
      name: 'original.png',
      originalWidth: 100,
      originalHeight: 100,
      currentWidth: 100,
      currentHeight: 100,
      imageSrc: 'blob:orig',
    })
    const id = doc.id!

    store.renameDocument(id, 'renamed_photo.png')
    const updated = store.getActiveDocument()
    expect(updated?.name).toBe('renamed_photo.png')
  })

  it('ignores empty or whitespace-only names', () => {
    const store = useDocumentStore.getState()
    const doc = store.addDocument({
      name: 'keep_me.jpg',
      originalWidth: 100,
      originalHeight: 100,
      currentWidth: 100,
      currentHeight: 100,
      imageSrc: 'blob:orig',
    })
    const id = doc.id!

    store.renameDocument(id, '   ')
    expect(store.getActiveDocument()?.name).toBe('keep_me.jpg')

    store.renameDocument(id, '')
    expect(store.getActiveDocument()?.name).toBe('keep_me.jpg')
  })

  it('trims leading and trailing whitespace from the new name', () => {
    const store = useDocumentStore.getState()
    const doc = store.addDocument({
      name: 'raw.jpg',
      originalWidth: 100,
      originalHeight: 100,
      currentWidth: 100,
      currentHeight: 100,
      imageSrc: 'blob:orig',
    })
    const id = doc.id!

    store.renameDocument(id, '  trimmed_name.png  ')
    expect(store.getActiveDocument()?.name).toBe('trimmed_name.png')
  })
})
