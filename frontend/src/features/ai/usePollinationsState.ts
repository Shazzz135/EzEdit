import { useState, useCallback, useEffect } from 'react'
import {
  MAX_PROMPT_LENGTH,
  type AIMode,
  type AIAspectRatio,
  type AIStyleModifier,
  type AIGeneratedResult,
} from './types'
import { generatePollinationsImage, generateRandomSeed } from './pollinationsService'
import { aiRateLimiter, AIRateLimitError } from './rateLimiter'
import { useAIRateLimiter } from './useAIRateLimiter'

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

  const { isRateLimited, cooldownSeconds, cancelActiveRequest, clearCooldown } = useAIRateLimiter()

  useEffect(() => {
    return () => {
      aiRateLimiter.cancelInFlight()
    }
  }, [])

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
      const status = aiRateLimiter.getStatus()
      if (!status.allowed) {
        if (status.reason === 'cooldown') {
          setError(`Rate limit cooldown active. Please wait ${status.remainingSeconds}s before retrying.`)
        } else {
          setError('An AI request is already in progress. Please wait for it to complete.')
        }
        return
      }

      const activeSeed = overrideSeed ?? seed
      setError(null)
      setIsGenerating(true)
      const controller = new AbortController()
      aiRateLimiter.recordRequestStart(controller)

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
          signal: controller.signal,
        })
        aiRateLimiter.recordRequestSuccess()
        setPreviewResult((prev) => {
          if (prev && prev.url.startsWith('blob:')) {
            URL.revokeObjectURL(prev.url)
          }
          return result
        })
      } catch (err) {
        if (err instanceof AIRateLimitError) {
          aiRateLimiter.recordRequestRateLimited(err.retryAfterSeconds)
          setError(err.message)
        } else {
          aiRateLimiter.recordRequestError()
          setError(err instanceof Error ? err.message : 'Failed to generate image from Pollinations.ai.')
        }
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
    isRateLimited,
    cooldownSeconds,
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
    cancelActiveRequest,
    clearCooldown,
  }
}
