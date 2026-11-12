import { useState, useCallback, useEffect, useMemo } from 'react'
import { type RetouchTool, type RetouchSettings, type InpaintingMethod, type Point, type MaskStroke } from './types'
import { executeInpainting } from './executeInpainting'
import { type DocumentState } from '@/types/document'
import { type TransformResult } from '@/types/transform'

export interface UseRetouchStateOptions {
  isActive: boolean
}

export const useRetouchState = (options: UseRetouchStateOptions) => {
  const [tool, setToolState] = useState<RetouchTool>('clone-stamp')
  const [sourcePoint, setSourcePoint] = useState<Point | null>(null)
  const [isAltPressed, setIsAltPressed] = useState(false)
  const [isProcessingInpaint, setIsProcessingInpaint] = useState(false)
  const [inpaintProgress, setInpaintProgress] = useState(0)
  const [paintedMaskStrokes, setPaintedMaskStrokes] = useState<MaskStroke[]>([])

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
      setPaintedMaskStrokes([])
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
    const onBlur = () => setIsAltPressed(false)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [options.isActive])

  const setTool = useCallback((nextTool: RetouchTool) => {
    setToolState((prevTool) => {
      if (prevTool !== nextTool) {
        if (nextTool === 'object-remove') {
          setSourcePoint(null)
        } else if (prevTool === 'object-remove') {
          setPaintedMaskStrokes([])
        }
      }
      return nextTool
    })
  }, [])

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

  const addMaskPath = useCallback((pts: Point[], strokeRadius?: number) => {
    if (pts.length >= 1) {
      setPaintedMaskStrokes((prev) => [
        ...prev,
        { points: pts, radius: strokeRadius ?? settings.radius },
      ])
    }
  }, [settings.radius])

  const clearMaskPaths = useCallback(() => {
    setPaintedMaskStrokes([])
  }, [])

  const paintedMaskPaths = useMemo(
    () => paintedMaskStrokes.map((s) => s.points),
    [paintedMaskStrokes]
  )

  const handleExecuteInpaint = useCallback(
    async (
      activeDoc: DocumentState | undefined,
      onApplyTransform: (res: TransformResult) => void,
      vectorPaths?: Point[][]
    ) => {
      if (!activeDoc) return
      const hasStrokes = paintedMaskStrokes.length > 0
      const hasVector = !!(vectorPaths && vectorPaths.length > 0)
      if (!hasStrokes && !hasVector) return

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
            brushRadius: settings.radius,
            maskStrokes: paintedMaskStrokes,
            vectorPaths,
            onProgress: (p) => setInpaintProgress(p),
          }
        )
        onApplyTransform(result)
        setPaintedMaskStrokes([])
      } catch (err) {
        console.error('Inpainting failed:', err)
      } finally {
        setIsProcessingInpaint(false)
        setInpaintProgress(0)
      }
    },
    [paintedMaskStrokes, settings.inpaintMethod, settings.inpaintPrompt, settings.radius]
  )

  const clearSourcePoint = useCallback(() => setSourcePoint(null), [])

  const resetRetouch = useCallback(() => {
    setSourcePoint(null)
    setIsAltPressed(false)
    setPaintedMaskStrokes([])
  }, [])

  return {
    tool,
    settings,
    sourcePoint,
    isAltPressed,
    isProcessingInpaint,
    inpaintProgress,
    paintedMaskPaths,
    paintedMaskStrokes,
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
