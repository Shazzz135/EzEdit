import { describe, it, expect, beforeEach } from 'vitest'
import { VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE } from '../adjustmentShaders'
import { defaultAdjustments, type AdjustmentValues } from '@/types/document'
import { useDocumentStore } from '@/features/tabs/useDocumentStore'

describe('WebGL 2.0 Adjustment Shader Pipeline', () => {
  describe('Shader Source Integrity', () => {
    it('declares WebGL 2.0 GLSL ES 3.00 specification header', () => {
      expect(VERTEX_SHADER_SOURCE).toContain('#version 300 es')
      expect(FRAGMENT_SHADER_SOURCE).toContain('#version 300 es')
    })

    it('declares all 13 adjustment shader uniforms in fragment shader', () => {
      const requiredUniforms = [
        'uniform float u_exposure;',
        'uniform float u_brilliance;',
        'uniform float u_highlights;',
        'uniform float u_shadows;',
        'uniform float u_contrast;',
        'uniform float u_brightness;',
        'uniform float u_saturation;',
        'uniform float u_vibrance;',
        'uniform float u_warmth;',
        'uniform float u_tint;',
        'uniform float u_sharpness;',
        'uniform float u_definition;',
        'uniform float u_noise;',
        'uniform vec2 u_resolution;',
      ]

      for (const uniform of requiredUniforms) {
        expect(FRAGMENT_SHADER_SOURCE).toContain(uniform)
      }
    })

    it('implements convolution kernel sampling for sharpness and definition', () => {
      expect(FRAGMENT_SHADER_SOURCE).toContain('u_sharpness')
      expect(FRAGMENT_SHADER_SOURCE).toContain('u_definition')
      expect(FRAGMENT_SHADER_SOURCE).toContain('u_noise')
      expect(FRAGMENT_SHADER_SOURCE).toContain('laplacian')
    })
  })

  describe('Non-Destructive Adjustments Store Integration', () => {
    beforeEach(() => {
      useDocumentStore.getState().clearAllDocuments()
    })

    it('initializes all 13 adjustments to default 0.0', () => {
      const keys = Object.keys(defaultAdjustments) as (keyof AdjustmentValues)[]
      expect(keys).toHaveLength(13)
      for (const key of keys) {
        expect(defaultAdjustments[key]).toBe(0.0)
      }
    })

    it('updates any of the 13 adjustment parameters with 0.1 precision', () => {
      const store = useDocumentStore.getState()
      const doc = store.addDocument({
        name: 'test.jpg',
        originalWidth: 800,
        originalHeight: 600,
        currentWidth: 800,
        currentHeight: 600,
        imageSrc: 'blob:test',
      })
      const id = doc.id!

      store.updateAdjustments(id, {
        exposure: 1.3,
        contrast: 25.5,
        vibrance: -12.4,
        sharpness: 45.2,
      })

      const updated = store.getActiveDocument()
      expect(updated?.adjustments.exposure).toBe(1.3)
      expect(updated?.adjustments.contrast).toBe(25.5)
      expect(updated?.adjustments.vibrance).toBe(-12.4)
      expect(updated?.adjustments.sharpness).toBe(45.2)
      // Unmodified values remain default 0.0
      expect(updated?.adjustments.brilliance).toBe(0.0)
      expect(updated?.isModified).toBe(true)
    })

    it('resets all adjustments back to default 0.0 via resetAdjustments', () => {
      const store = useDocumentStore.getState()
      const doc = store.addDocument({
        name: 'test.jpg',
        originalWidth: 800,
        originalHeight: 600,
        currentWidth: 800,
        currentHeight: 600,
        imageSrc: 'blob:test',
      })
      const id = doc.id!

      store.updateAdjustments(id, {
        exposure: -2.1,
        highlights: 50.0,
        shadows: -30.0,
        warmth: 15.5,
      })

      store.resetAdjustments(id)
      const resetDoc = store.getActiveDocument()
      expect(resetDoc?.adjustments).toEqual(defaultAdjustments)
    })
  })
})
