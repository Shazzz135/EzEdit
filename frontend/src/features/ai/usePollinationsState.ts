import { useState, useCallback } from 'react'
import {
  MAX_PROMPT_LENGTH,
  type AIMode,
  type AIAspectRatio,
  type AIStyleModifier,
  type AIGeneratedResult,
} from './types'
import { generatePollinationsImage, generateRandomSeed } from './pollinationsService'

export interface ActiveImageSource {
  imageSrc: string
  width: number
  height: number
}

export const usePollinationsState = () => {
  const [mode, setMode] = useState<AIMode>('generate')
  const [prompt, setPromptState] = useState('')
  const [aspectRatio, setAspectRatio] = useState<AIAspectRatio>('1:1')
  const [style, setStyle] = useState<AIStyleModifier>('photorealistic')
  const [seed, setSeed] = useState<number>(() => generateRandomSeed())
  const [enhance, setEnhance] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewResult, setPreviewResult] = useState<AIGeneratedResult | null>(null)

  const setPrompt = useCallback((next: string) => {
    setPromptState(next.slice(0, MAX_PROMPT_LENGTH))
  }, [])

  const randomizeSeed = useCallback(() => {
    const next = generateRandomSeed()
    setSeed(next)
    return next
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const closePreview = useCallback(() => {
    setPreviewResult((prev) => {
      if (prev && prev.url.startsWith('blob:')) {
        URL.revokeObjectURL(prev.url)
      }
      return null
    })
  }, [])

  const consumePreview = useCallback((): AIGeneratedResult | null => {
    const current = previewResult
    setPreviewResult(null)
    return current
  }, [previewResult])

  const handleGenerate = useCallback(
    async (overrideSeed?: number, activeSource?: ActiveImageSource) => {
      const activeSeed = overrideSeed ?? seed
      setError(null)
      setIsGenerating(true)

      try {
        const result = await generatePollinationsImage({
          prompt,
          aspectRatio,
          style,
          seed: activeSeed,
          enhance,
          mode: mode === 'edit' && activeSource ? 'edit' : 'generate',
          sourceImageSrc: activeSource?.imageSrc,
          sourceWidth: activeSource?.width,
          sourceHeight: activeSource?.height,
        })
        setPreviewResult((prev) => {
          if (prev && prev.url.startsWith('blob:')) {
            URL.revokeObjectURL(prev.url)
          }
          return result
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate image from Pollinations.ai.')
      } finally {
        setIsGenerating(false)
      }
    },
    [prompt, aspectRatio, style, seed, enhance, mode]
  )

  const handleRegenerateWithNewSeed = useCallback(
    async (activeSource?: ActiveImageSource) => {
      const nextSeed = generateRandomSeed()
      setSeed(nextSeed)
      await handleGenerate(nextSeed, activeSource)
    },
    [handleGenerate]
  )

  return {
    mode,
    prompt,
    aspectRatio,
    style,
    seed,
    enhance,
    isGenerating,
    error,
    previewResult,
    setMode,
    setPrompt,
    setAspectRatio,
    setStyle,
    setSeed,
    setEnhance,
    randomizeSeed,
    clearError,
    closePreview,
    consumePreview,
    handleGenerate,
    handleRegenerateWithNewSeed,
  }
}
