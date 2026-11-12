import { useState, useCallback, useEffect } from 'react'
import { type RetouchTool, type RetouchSettings, type Point } from './types'

export interface UseRetouchStateOptions {
  isActive: boolean
}

export const useRetouchState = (options: UseRetouchStateOptions) => {
  const [tool, setTool] = useState<RetouchTool>('clone-stamp')
  const [sourcePoint, setSourcePoint] = useState<Point | null>(null)
  const [isAltPressed, setIsAltPressed] = useState(false)
  const [settings, setSettings] = useState<RetouchSettings>({
    radius: 24,
    hardness: 0.5,
    opacity: 1.0,
  })

  // Synchronize active state during render
  const [prevActive, setPrevActive] = useState(options.isActive)
  if (prevActive !== options.isActive) {
    setPrevActive(options.isActive)
    if (!options.isActive) {
      setIsAltPressed(false)
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

  const clearSourcePoint = useCallback(() => {
    setSourcePoint(null)
  }, [])

  const resetRetouch = useCallback(() => {
    setSourcePoint(null)
    setIsAltPressed(false)
  }, [])

  return {
    tool,
    settings,
    sourcePoint,
    isAltPressed,
    setTool,
    setRadius,
    setHardness,
    setOpacity,
    setSourcePoint,
    clearSourcePoint,
    resetRetouch,
  }
}
