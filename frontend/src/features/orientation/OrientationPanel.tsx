import React, { useEffect, useCallback } from 'react'
import { type DocumentState } from '@/types/document'
import { type TransformResult } from '@/types/transform'
import { type AspectRatio } from '@/types/crop'
import { type CropPanelProps } from '@/features/crop/CropPanel'
import { useTransformState } from './useTransformState'
import { CropSection } from './CropSection'
import { RotateFlipSection } from './RotateFlipSection'
import { ScaleSection } from './ScaleSection'
import { StretchSection } from './StretchSection'
import {
  executeRotate,
  executeFlip,
  executeResize,
  executeStretch,
} from './transformService'

export interface OrientationPanelProps {
  document: DocumentState
  cropProps: CropPanelProps
  rotationAngle: number
  onRotateChange: (angle: number) => void
  onApplyTransform: (result: TransformResult) => void
  onPreviewScaleChange?: (scale: { x: number; y: number } | undefined) => void
}

export const OrientationPanel: React.FC<OrientationPanelProps> = ({
  document: doc,
  cropProps,
  rotationAngle,
  onRotateChange,
  onApplyTransform,
  onPreviewScaleChange,
}) => {
  const transform = useTransformState({
    currentWidth: doc.currentWidth,
    currentHeight: doc.currentHeight,
  })

  // Propagate real-time stretch and scale preview to canvas
  useEffect(() => {
    onPreviewScaleChange?.(transform.previewScale)
  }, [transform.previewScale, onPreviewScaleChange])

  const handleRatioSelect = (ratio: AspectRatio) => {
    if (rotationAngle !== 0) onRotateChange(0)
    transform.resetStretch()
    transform.resetResize()
    if (!cropProps.isCropActive) {
      cropProps.onStartCrop()
    }
    cropProps.onSelectRatio(ratio)
  }

  const handleRotateChange = (angle: number) => {
    if (cropProps.isCropActive) cropProps.onCancelCrop()
    transform.resetStretch()
    transform.resetResize()
    onRotateChange(angle)
  }

  const handleApplyRotation = async () => {
    if (rotationAngle === 0) return
    try {
      transform.setIsProcessing(true)
      const res = await executeRotate(doc.imageSrc, rotationAngle)
      onApplyTransform(res)
      onRotateChange(0)
    } catch (err) {
      console.error('Failed to rotate image:', err)
    } finally {
      transform.setIsProcessing(false)
    }
  }

  const handleFlip = async (dir: 'horizontal' | 'vertical') => {
    if (cropProps.isCropActive) cropProps.onCancelCrop()
    if (rotationAngle !== 0) onRotateChange(0)
    try {
      transform.setIsProcessing(true)
      const res = await executeFlip(doc.imageSrc, dir)
      onApplyTransform(res)
    } catch (err) {
      console.error('Failed to flip image:', err)
    } finally {
      transform.setIsProcessing(false)
    }
  }

  const handleApplyScale = useCallback(async () => {
    if (
      transform.resizeWidth === doc.currentWidth &&
      transform.resizeHeight === doc.currentHeight
    ) {
      return
    }
    try {
      transform.setIsProcessing(true)
      const res = await executeResize(
        doc.imageSrc,
        transform.resizeWidth,
        transform.resizeHeight
      )
      onApplyTransform(res)
    } catch (err) {
      console.error('Failed to auto-scale canvas:', err)
    } finally {
      transform.setIsProcessing(false)
    }
  }, [
    doc.imageSrc,
    doc.currentWidth,
    doc.currentHeight,
    transform,
    onApplyTransform,
  ])

  // Auto-scale with debounce when dimensions change
  useEffect(() => {
    if (
      transform.resizeWidth === doc.currentWidth &&
      transform.resizeHeight === doc.currentHeight
    ) {
      return
    }

    const timer = setTimeout(() => {
      handleApplyScale()
    }, 700)

    return () => clearTimeout(timer)
  }, [
    transform.resizeWidth,
    transform.resizeHeight,
    doc.currentWidth,
    doc.currentHeight,
    handleApplyScale,
  ])

  const handleApplyStretch = async () => {
    try {
      transform.setIsProcessing(true)
      const res = await executeStretch(
        doc.imageSrc,
        transform.stretchX,
        transform.stretchY
      )
      onApplyTransform(res)
      transform.resetStretch()
    } catch (err) {
      console.error('Failed to stretch image:', err)
    } finally {
      transform.setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 pb-4">
      {/* Section 1: Crop */}
      <CropSection
        isCropActive={cropProps.isCropActive}
        cropRect={cropProps.cropRect}
        aspectRatio={cropProps.aspectRatio}
        onSelectRatio={handleRatioSelect}
        onApplyCrop={cropProps.onApplyCrop}
        onCancelCrop={cropProps.onCancelCrop}
        onResetCrop={cropProps.onResetCrop}
      />

      {/* Bold Separator */}
      <div className="h-[2px] bg-[#323246] w-full rounded-full my-0.5" />

      {/* Section 2: Rotate (0° - 360°) & Flip */}
      <RotateFlipSection
        rotationAngle={rotationAngle}
        onRotateChange={handleRotateChange}
        onApplyRotation={handleApplyRotation}
        onResetRotation={() => onRotateChange(0)}
        onFlip={handleFlip}
        isProcessing={transform.isProcessing}
      />

      {/* Bold Separator */}
      <div className="h-[2px] bg-[#323246] w-full rounded-full my-0.5" />

      {/* Section 3: Scale(px) */}
      <ScaleSection
        width={transform.resizeWidth}
        height={transform.resizeHeight}
        currentWidth={doc.currentWidth}
        currentHeight={doc.currentHeight}
        onWidthChange={(w) => {
          if (cropProps.isCropActive) cropProps.onCancelCrop()
          if (rotationAngle !== 0) onRotateChange(0)
          transform.handleWidthChange(w)
        }}
        onHeightChange={(h) => {
          if (cropProps.isCropActive) cropProps.onCancelCrop()
          if (rotationAngle !== 0) onRotateChange(0)
          transform.handleHeightChange(h)
        }}
        onResetScale={transform.resetResize}
        onCommitScale={handleApplyScale}
        isProcessing={transform.isProcessing}
      />

      {/* Bold Separator */}
      <div className="h-[2px] bg-[#323246] w-full rounded-full my-0.5" />

      {/* Section 4: Stretch */}
      <StretchSection
        scaleX={transform.stretchX}
        scaleY={transform.stretchY}
        currentWidth={doc.currentWidth}
        currentHeight={doc.currentHeight}
        onScaleXChange={(sx) => {
          if (cropProps.isCropActive) cropProps.onCancelCrop()
          if (rotationAngle !== 0) onRotateChange(0)
          transform.setStretchX(sx)
        }}
        onScaleYChange={(sy) => {
          if (cropProps.isCropActive) cropProps.onCancelCrop()
          if (rotationAngle !== 0) onRotateChange(0)
          transform.setStretchY(sy)
        }}
        onApplyStretch={handleApplyStretch}
        onResetStretch={transform.resetStretch}
        isProcessing={transform.isProcessing}
      />
    </div>
  )
}
