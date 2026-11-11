import { describe, it, expect, beforeEach } from 'vitest'
import { FILTER_PRESETS, PRESET_SHADER_MAP } from '../filterPresets'
import { FRAGMENT_SHADER_SOURCE } from '@/features/adjustments/adjustmentShaders'
import { defaultFilterState, type PresetFilterType } from '@/types/document'
import { useDocumentStore } from '@/features/tabs/useDocumentStore'

describe('Milestone 5 - Issue 5.2: Preset Filter Shaders & Split-Compare Tool', () => {
  describe('Filter Preset Definitions', () => {
    it('defines 8 stylized presets plus None (9 total)', () => {
      expect(FILTER_PRESETS).toHaveLength(9)
      const ids = FILTER_PRESETS.map((p) => p.id)
      expect(ids).toContain('none')
      expect(ids).toContain('vivid')
      expect(ids).toContain('warm')
      expect(ids).toContain('cool')
      expect(ids).toContain('dramatic')
      expect(ids).toContain('heavy-warm')
      expect(ids).toContain('heavy-cool')
      expect(ids).toContain('mono')
      expect(ids).toContain('noir')
    })

    it('maps every preset to a unique shader integer index from 0 to 8', () => {
      const indices = Object.values(PRESET_SHADER_MAP)
      expect(indices).toHaveLength(9)
      expect(new Set(indices).size).toBe(9)
      expect(PRESET_SHADER_MAP.none).toBe(0)
      expect(PRESET_SHADER_MAP.vivid).toBe(1)
      expect(PRESET_SHADER_MAP.warm).toBe(2)
      expect(PRESET_SHADER_MAP.cool).toBe(3)
      expect(PRESET_SHADER_MAP.dramatic).toBe(4)
      expect(PRESET_SHADER_MAP['heavy-warm']).toBe(5)
      expect(PRESET_SHADER_MAP['heavy-cool']).toBe(6)
      expect(PRESET_SHADER_MAP.mono).toBe(7)
      expect(PRESET_SHADER_MAP.noir).toBe(8)
    })
  })

  describe('GLSL Fragment Shader Verification', () => {
    it('declares uniforms for filter preset, intensity, split position, and compare mode', () => {
      expect(FRAGMENT_SHADER_SOURCE).toContain('uniform int u_filterPreset;')
      expect(FRAGMENT_SHADER_SOURCE).toContain('uniform float u_filterIntensity;')
      expect(FRAGMENT_SHADER_SOURCE).toContain('uniform float u_splitPosition;')
      expect(FRAGMENT_SHADER_SOURCE).toContain('uniform int u_compareOriginal;')
    })

    it('implements hold-to-compare and split-screen comparison branches', () => {
      expect(FRAGMENT_SHADER_SOURCE).toContain('u_compareOriginal == 1')
      expect(FRAGMENT_SHADER_SOURCE).toContain('u_splitPosition >= 0.0')
      expect(FRAGMENT_SHADER_SOURCE).toContain('v_texCoord.x < u_splitPosition')
    })

    it('implements color transformations for all 8 preset filter shaders', () => {
      expect(FRAGMENT_SHADER_SOURCE).toContain('u_filterPreset == 1') // Vivid
      expect(FRAGMENT_SHADER_SOURCE).toContain('u_filterPreset == 2') // Warm
      expect(FRAGMENT_SHADER_SOURCE).toContain('u_filterPreset == 3') // Cool
      expect(FRAGMENT_SHADER_SOURCE).toContain('u_filterPreset == 4') // Dramatic
      expect(FRAGMENT_SHADER_SOURCE).toContain('u_filterPreset == 5') // Heavy Warm
      expect(FRAGMENT_SHADER_SOURCE).toContain('u_filterPreset == 6') // Heavy Cool
      expect(FRAGMENT_SHADER_SOURCE).toContain('u_filterPreset == 7') // Mono
      expect(FRAGMENT_SHADER_SOURCE).toContain('u_filterPreset == 8') // Noir
    })

    it('smoothly scales effect using filter intensity mix', () => {
      expect(FRAGMENT_SHADER_SOURCE).toContain('mix(color, clamp(f, 0.0, 1.0), clamp(u_filterIntensity, 0.0, 1.0))')
    })
  })

  describe('Store Filter State & Non-Destructive Compare', () => {
    beforeEach(() => {
      useDocumentStore.getState().clearAllDocuments()
    })

    it('initializes new document with default filter state (none, 100%)', () => {
      const store = useDocumentStore.getState()
      const res = store.addDocument({
        name: 'test.jpg',
        originalWidth: 800,
        originalHeight: 600,
        currentWidth: 800,
        currentHeight: 600,
        imageSrc: 'blob:test-image',
      })
      expect(res.success).toBe(true)
      const doc = store.getActiveDocument()
      expect(doc).toBeDefined()
      expect(doc?.filter).toEqual(defaultFilterState)
      expect(doc?.filter.preset).toBe('none')
      expect(doc?.filter.intensity).toBe(100)
    })

    it('updates filter preset and intensity without altering raster pixels', () => {
      const store = useDocumentStore.getState()
      const res = store.addDocument({
        name: 'test.jpg',
        originalWidth: 800,
        originalHeight: 600,
        currentWidth: 800,
        currentHeight: 600,
        imageSrc: 'blob:test-image',
      })
      const docId = res.id!
      store.updateFilter(docId, { preset: 'dramatic' as PresetFilterType, intensity: 75 })

      const updated = store.getActiveDocument()
      expect(updated?.filter.preset).toBe('dramatic')
      expect(updated?.filter.intensity).toBe(75)
      expect(updated?.isModified).toBe(true)
    })

    it('resets filter back to none and 100% on resetFilter', () => {
      const store = useDocumentStore.getState()
      const res = store.addDocument({
        name: 'test.jpg',
        originalWidth: 800,
        originalHeight: 600,
        currentWidth: 800,
        currentHeight: 600,
        imageSrc: 'blob:test-image',
      })
      const docId = res.id!
      store.updateFilter(docId, { preset: 'noir' as PresetFilterType, intensity: 50 })
      expect(store.getActiveDocument()?.filter.preset).toBe('noir')

      store.resetFilter(docId)
      expect(store.getActiveDocument()?.filter).toEqual(defaultFilterState)
      expect(store.getActiveDocument()?.filter.preset).toBe('none')
    })
  })
})
