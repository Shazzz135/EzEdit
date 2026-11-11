import React, { useRef, useEffect, useState } from 'react'
import { type AdjustmentValues } from '@/types/document'
import { WebGLAdjustmentPipeline } from './webglPipeline'

export interface WebGLCanvasProps {
  imageSrc: string
  width: number
  height: number
  adjustments: AdjustmentValues
  className?: string
  style?: React.CSSProperties
}

export const WebGLCanvas: React.FC<WebGLCanvasProps> = ({
  imageSrc,
  width,
  height,
  adjustments,
  className,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pipelineRef = useRef<WebGLAdjustmentPipeline | null>(null)
  const [isSupported, setIsSupported] = useState(true)
  const imageRef = useRef<HTMLImageElement | null>(null)

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
    } catch (err) {
      console.warn('WebGL2 adjustment pipeline initialization failed:', err)
      queueMicrotask(() => setIsSupported(false))
    }

    return () => {
      pipelineRef.current?.destroy()
      pipelineRef.current = null
    }
  }, [])

  // Load image texture when imageSrc changes
  useEffect(() => {
    const pipeline = pipelineRef.current
    if (!pipeline || !isSupported) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageRef.current = img
      pipeline.setTexture(img)
      pipeline.render(adjustments, width, height)
    }
    img.src = imageSrc
  }, [imageSrc, isSupported, width, height, adjustments])

  // Real-time 60fps render when adjustments or dimensions change
  useEffect(() => {
    const pipeline = pipelineRef.current
    if (!pipeline || !imageRef.current || !isSupported) return
    pipeline.render(adjustments, width, height)
  }, [adjustments, width, height, isSupported])

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
