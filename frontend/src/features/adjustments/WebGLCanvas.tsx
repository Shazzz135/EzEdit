import React, { useRef, useEffect, useState } from 'react'
import { type AdjustmentValues, type FilterState } from '@/types/document'
import { WebGLAdjustmentPipeline } from './webglPipeline'

export interface WebGLCanvasProps {
  imageSrc: string
  width: number
  height: number
  adjustments: AdjustmentValues
  filter?: FilterState
  splitPosition?: number | null
  isHoldComparing?: boolean
  className?: string
  style?: React.CSSProperties
}

export const WebGLCanvas: React.FC<WebGLCanvasProps> = ({
  imageSrc,
  width,
  height,
  adjustments,
  filter,
  splitPosition,
  isHoldComparing,
  className,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pipelineRef = useRef<WebGLAdjustmentPipeline | null>(null)
  const loadedSrcRef = useRef<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)
  const renderParamsRef = useRef({
    adjustments,
    width,
    height,
    filter,
    splitPosition,
    isHoldComparing,
  })

  useEffect(() => {
    renderParamsRef.current = {
      adjustments,
      width,
      height,
      filter,
      splitPosition,
      isHoldComparing,
    }
  }, [adjustments, width, height, filter, splitPosition, isHoldComparing])

  // Initialize WebGL2 context and pipeline
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    })

    if (!gl) {
      queueMicrotask(() => setIsSupported(false))
      return
    }

    try {
      const pipeline = new WebGLAdjustmentPipeline(gl)
      pipelineRef.current = pipeline
      loadedSrcRef.current = null
    } catch (err) {
      console.warn('WebGL2 adjustment pipeline initialization failed:', err)
      queueMicrotask(() => setIsSupported(false))
    }

    return () => {
      pipelineRef.current?.destroy()
      pipelineRef.current = null
      loadedSrcRef.current = null
    }
  }, [])

  // Load image texture when imageSrc changes
  useEffect(() => {
    const pipeline = pipelineRef.current
    if (!pipeline || !isSupported || !imageSrc) return

    let cancelled = false
    const img = new Image()
    if (!imageSrc.startsWith('blob:') && !imageSrc.startsWith('data:')) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => {
      if (cancelled || !pipelineRef.current) return
      loadedSrcRef.current = imageSrc
      pipelineRef.current.setTexture(img)
      const p = renderParamsRef.current
      pipelineRef.current.render(
        p.adjustments,
        p.width,
        p.height,
        p.filter,
        p.splitPosition,
        p.isHoldComparing
      )
    }
    img.src = imageSrc

    return () => {
      cancelled = true
    }
  }, [imageSrc, isSupported])

  // Real-time 60fps render when adjustments, filter, dimensions, or split compare change
  useEffect(() => {
    const pipeline = pipelineRef.current
    if (!pipeline || !isSupported) return

    if (pipeline.hasTexture() && loadedSrcRef.current === imageSrc) {
      pipeline.render(adjustments, width, height, filter, splitPosition, isHoldComparing)
    } else if (imageSrc) {
      const img = new Image()
      if (!imageSrc.startsWith('blob:') && !imageSrc.startsWith('data:')) {
        img.crossOrigin = 'anonymous'
      }
      img.onload = () => {
        if (!pipelineRef.current) return
        loadedSrcRef.current = imageSrc
        pipelineRef.current.setTexture(img)
        const p = renderParamsRef.current
        pipelineRef.current.render(
          p.adjustments,
          p.width,
          p.height,
          p.filter,
          p.splitPosition,
          p.isHoldComparing
        )
      }
      img.src = imageSrc
    }
  }, [adjustments, filter, splitPosition, isHoldComparing, width, height, imageSrc, isSupported])

  if (!isSupported) {
    return (
      <img
        src={imageSrc}
        alt="Canvas Preview"
        draggable={false}
        className={className}
        style={style}
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={style}
    />
  )
}
