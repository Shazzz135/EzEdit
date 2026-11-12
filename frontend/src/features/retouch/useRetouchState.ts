import { useState, useCallback, useEffect } from 'react'
import { type RetouchTool, type RetouchSettings, type InpaintingMethod, type Point } from './types'
import { executeInpainting } from './executeInpainting'
import { type DocumentState } from '@/types/document'
import { type TransformResult } from '@/types/transform'

export interface UseRetouchStateOptions {
  isActive: boolean
}

export const useRetouchState = (options: UseRetouchStateOptions) => {
  const [tool, setTool] = useState<RetouchTool>('clone-stamp')
  const [sourcePoint, setSourcePoint] = useState<Point | null>(null)
  const [isAltPressed, setIsAltPressed] = useState(false)
  const [isProcessingInpaint, setIsProcessingInpaint] = useState(false)
  const [inpaintProgress, setInpaintProgress] = useState(0)
  const [paintedMaskPaths, setPaintedMaskPaths] = useState<Point[][]>([])

  const [settings, setSettings] = useState<RetouchSettings>({
    radius: 24,
    hardness: 0.5,
    opacity: 1.0,
    inpaintMethod: 'local-patch',
    inpaintPrompt: '',
  })

  // Synchronize active state during render
  const [prevActive, setPrevActive] = useState(options.isActive)
  if (prevActive !== options.isActive) {
    setPrevActive(options.isActive)
    if (!options.isActive) {
      setIsAltPressed(false)
      setIsProcessingInpaint(false)
      setInpaintProgress(0)
      setPaintedMaskPaths([])
    }
  }

  // Global Alt key tracker for sampling source anchor
  useEffect(() => {
    if (!options.isActive) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || e.altKey) setIsAltPressed(true)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || !e.altKey) setIsAltPressed(false)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', () => setIsAltPressed(false))

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', () => setIsAltPressed(false))
    }
  }, [options.isActive])

  const setRadius = useCallback((radius: number) => {
    setSettings((s) => ({ ...s, radius: Math.max(2, Math.min(150, radius)) }))
  }, [])

  const setHardness = useCallback((hardness: number) => {
    setSettings((s) => ({ ...s, hardness: Math.max(0, Math.min(1, hardness)) }))
  }, [])

  const setOpacity = useCallback((opacity: number) => {
    setSettings((s) => ({ ...s, opacity: Math.max(0.1, Math.min(1, opacity)) }))
  }, [])

  const setInpaintMethod = useCallback((method: InpaintingMethod) => {
    setSettings((s) => ({ ...s, inpaintMethod: method }))
  }, [])

  const setInpaintPrompt = useCallback((prompt: string) => {
    setSettings((s) => ({ ...s, inpaintPrompt: prompt }))
  }, [])

  const addMaskPath = useCallback((pts: Point[]) => {
    if (pts.length >= 3) {
      setPaintedMaskPaths((prev) => [...prev, pts])
    }
  }, [])

  const clearMaskPaths = useCallback(() => {
    setPaintedMaskPaths([])
  }, [])

  const handleExecuteInpaint = useCallback(
    async (
      activeDoc: DocumentState | undefined,
      onApplyTransform: (res: TransformResult) => void,
      vectorPaths?: Point[][]
    ) => {
      if (!activeDoc) return
      const pathsToUse = (vectorPaths && vectorPaths.length > 0) ? vectorPaths : paintedMaskPaths
      if (pathsToUse.length === 0) return

      setIsProcessingInpaint(true)
      setInpaintProgress(0.1)

      try {
        const result = await executeInpainting(
          activeDoc.imageSrc,
          activeDoc.currentWidth,
          activeDoc.currentHeight,
          {
            method: settings.inpaintMethod,
            prompt: settings.inpaintPrompt,
            maskPaths: pathsToUse,
            onProgress: (p) => setInpaintProgress(p),
          }
        )
        onApplyTransform(result)
        setPaintedMaskPaths([])
      } catch (err) {
        console.error('Inpainting failed:', err)
      } finally {
        setIsProcessingInpaint(false)
        setInpaintProgress(0)
      }
    },
    [paintedMaskPaths, settings.inpaintMethod, settings.inpaintPrompt]
  )

  const clearSourcePoint = useCallback(() => setSourcePoint(null), [])

  const resetRetouch = useCallback(() => {
    setSourcePoint(null)
    setIsAltPressed(false)
    setPaintedMaskPaths([])
  }, [])

  return {
    tool,
    settings,
    sourcePoint,
    isAltPressed,
    isProcessingInpaint,
    inpaintProgress,
    paintedMaskPaths,
    setTool,
    setRadius,
    setHardness,
    setOpacity,
    setInpaintMethod,
    setInpaintPrompt,
    addMaskPath,
    clearMaskPaths,
    handleExecuteInpaint,
    setSourcePoint,
    clearSourcePoint,
    resetRetouch,
  }
}
