import React, { useEffect } from 'react'
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

  // Propagate real-time stretch preview scale to canvas
  useEffect(() => {
    onPreviewScaleChange?.(transform.previewScale)
  }, [transform.previewScale, onPreviewScaleChange])

  const handleRatioSelect = (ratio: AspectRatio) => {
    if (!cropProps.isCropActive) {
      cropProps.onStartCrop()
    }
    cropProps.onSelectRatio(ratio)
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

  const handleApplyScale = async () => {
    try {
      transform.setIsProcessing(true)
      const res = await executeResize(
        doc.imageSrc,
        transform.resizeWidth,
        transform.resizeHeight
      )
      onApplyTransform(res)
    } catch (err) {
      console.error('Failed to scale canvas:', err)
    } finally {
      transform.setIsProcessing(false)
    }
  }

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
        onRotateChange={onRotateChange}
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
        onWidthChange={transform.handleWidthChange}
        onHeightChange={transform.handleHeightChange}
        onApplyScale={handleApplyScale}
        onResetScale={transform.resetResize}
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
        onScaleXChange={transform.setStretchX}
        onScaleYChange={transform.setStretchY}
        onApplyStretch={handleApplyStretch}
        onResetStretch={transform.resetStretch}
        isProcessing={transform.isProcessing}
      />
    </div>
  )
}
