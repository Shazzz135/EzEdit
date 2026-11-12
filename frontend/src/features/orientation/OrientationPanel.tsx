import React, { useEffect, useCallback } from 'react'
import { type DocumentState } from '@/types/document'
import { type TransformResult } from '@/types/transform'
import { type AspectRatio } from '@/types/crop'
import { type CropPanelProps } from '@/features/crop/CropPanel'
import { useDocumentStore } from '@/features/tabs/useDocumentStore'
import { useTransformState } from './useTransformState'
import { CropSection } from './CropSection'
import { RotateFlipSection } from './RotateFlipSection'
import { ScaleSection } from './ScaleSection'
import { StretchSection } from './StretchSection'
import { executeResize } from './transformService'

export interface OrientationPanelProps {
  document: DocumentState
  cropProps: CropPanelProps
  rotationAngle?: number
  onRotateChange?: (angle: number) => void
  onApplyTransform: (result: TransformResult) => void
  onPreviewScaleChange?: (scale: { x: number; y: number } | undefined) => void
}

export const OrientationPanel: React.FC<OrientationPanelProps> = ({
  document: doc,
  cropProps,
  onRotateChange,
  onApplyTransform,
  onPreviewScaleChange,
}) => {
  const updateOrientation = useDocumentStore((s) => s.updateOrientation)
  const transform = useTransformState({
    currentWidth: doc.currentWidth,
    currentHeight: doc.currentHeight,
  })

  const currentRotation = doc.orientation?.rotation ?? 0
  const currentFlipH = doc.orientation?.flipH ?? false
  const currentFlipV = doc.orientation?.flipV ?? false
  const currentScaleX = Math.round((doc.orientation?.scaleX ?? 1) * 100)
  const currentScaleY = Math.round((doc.orientation?.scaleY ?? 1) * 100)

  // Propagate real-time Scale(px) preview to canvas while typing
  useEffect(() => {
    onPreviewScaleChange?.(transform.previewScale)
  }, [transform.previewScale, onPreviewScaleChange])

  const handleRatioSelect = (ratio: AspectRatio) => {
    if (!cropProps.isCropActive) {
      cropProps.onStartCrop()
    }
    cropProps.onSelectRatio(ratio)
  }

  const handleRotateChange = (angle: number) => {
    if (cropProps.isCropActive) cropProps.onCancelCrop()
    updateOrientation(doc.id, { rotation: angle })
    onRotateChange?.(angle)
  }

  const handleResetRotationAndFlip = () => {
    updateOrientation(doc.id, { rotation: 0, flipH: false, flipV: false })
    onRotateChange?.(0)
  }

  const handleFlip = (dir: 'horizontal' | 'vertical') => {
    if (cropProps.isCropActive) cropProps.onCancelCrop()
    if (dir === 'horizontal') {
      updateOrientation(doc.id, { flipH: !currentFlipH })
    } else {
      updateOrientation(doc.id, { flipV: !currentFlipV })
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

  const handleResetScaleToOriginal = async () => {
    transform.resetResize()
    if (
      doc.currentWidth !== doc.originalWidth ||
      doc.currentHeight !== doc.originalHeight
    ) {
      try {
        transform.setIsProcessing(true)
        const baseSrc = doc.originalImageSrc || doc.history?.[0]?.imageSrc || doc.imageSrc
        const res = await executeResize(baseSrc, doc.originalWidth, doc.originalHeight)
        onApplyTransform(res)
      } catch (err) {
        console.error('Failed to reset scale:', err)
      } finally {
        transform.setIsProcessing(false)
      }
    }
  }

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

      <div className="h-[2px] bg-[#323246] w-full rounded-full my-0.5" />

      {/* Section 2: Rotate (0° - 360°) & Flip */}
      <RotateFlipSection
        rotationAngle={currentRotation}
        flipH={currentFlipH}
        flipV={currentFlipV}
        onRotateChange={handleRotateChange}
        onResetRotation={handleResetRotationAndFlip}
        onFlip={handleFlip}
        isProcessing={transform.isProcessing}
      />

      <div className="h-[2px] bg-[#323246] w-full rounded-full my-0.5" />

      {/* Section 3: Scale(px) */}
      <ScaleSection
        width={transform.resizeWidth}
        height={transform.resizeHeight}
        currentWidth={doc.currentWidth}
        currentHeight={doc.currentHeight}
        onWidthChange={(w) => {
          if (cropProps.isCropActive) cropProps.onCancelCrop()
          transform.handleWidthChange(w)
        }}
        onHeightChange={(h) => {
          if (cropProps.isCropActive) cropProps.onCancelCrop()
          transform.handleHeightChange(h)
        }}
        onResetScale={handleResetScaleToOriginal}
        onCommitScale={handleApplyScale}
        isProcessing={transform.isProcessing}
      />

      <div className="h-[2px] bg-[#323246] w-full rounded-full my-0.5" />

      {/* Section 4: Stretch */}
      <StretchSection
        scaleX={currentScaleX}
        scaleY={currentScaleY}
        currentWidth={doc.currentWidth}
        currentHeight={doc.currentHeight}
        onScaleXChange={(sx) => {
          if (cropProps.isCropActive) cropProps.onCancelCrop()
          updateOrientation(doc.id, { scaleX: sx / 100 })
        }}
        onScaleYChange={(sy) => {
          if (cropProps.isCropActive) cropProps.onCancelCrop()
          updateOrientation(doc.id, { scaleY: sy / 100 })
        }}
        onResetStretch={() => updateOrientation(doc.id, { scaleX: 1.0, scaleY: 1.0 })}
      />
    </div>
  )
}
