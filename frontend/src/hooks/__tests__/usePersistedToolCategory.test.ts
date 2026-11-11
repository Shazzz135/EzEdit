import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getSavedToolCategory,
  saveToolCategory,
  TOOL_CATEGORY_STORAGE_KEY,
  VALID_CATEGORIES,
} from '../usePersistedToolCategory'

describe('Tool Category Persistence', () => {
  const store = new Map<string, string>()
  const mockStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, String(value)) },
    clear: () => { store.clear() },
    removeItem: (key: string) => { store.delete(key) },
  }

  beforeEach(() => {
    store.clear()
    vi.stubGlobal('localStorage', mockStorage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('contains all 6 primary tool categories', () => {
    expect(VALID_CATEGORIES).toContain('orientation')
    expect(VALID_CATEGORIES).toContain('adjustments')
    expect(VALID_CATEGORIES).toContain('filters')
    expect(VALID_CATEGORIES).toContain('selection')
    expect(VALID_CATEGORIES).toContain('retouch')
    expect(VALID_CATEGORIES).toContain('ai')
  })

  it('returns default adjustments when localStorage is empty', () => {
    expect(getSavedToolCategory()).toBe('adjustments')
  })

  it('restores valid category from localStorage', () => {
    localStorage.setItem(TOOL_CATEGORY_STORAGE_KEY, 'selection')
    expect(getSavedToolCategory()).toBe('selection')

    localStorage.setItem(TOOL_CATEGORY_STORAGE_KEY, 'filters')
    expect(getSavedToolCategory()).toBe('filters')
  })

  it('falls back to default if localStorage contains an invalid category string', () => {
    localStorage.setItem(TOOL_CATEGORY_STORAGE_KEY, 'invalid-category-xyz')
    expect(getSavedToolCategory()).toBe('adjustments')
  })

  it('saves updated category to localStorage', () => {
    saveToolCategory('orientation')
    expect(localStorage.getItem(TOOL_CATEGORY_STORAGE_KEY)).toBe('orientation')
    expect(getSavedToolCategory()).toBe('orientation')
  })
})
