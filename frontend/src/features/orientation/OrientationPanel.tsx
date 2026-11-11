import React, { useEffect } from 'react'
import {
  RotateCcw,
  RotateCw,
  RefreshCw,
  FlipHorizontal,
  FlipVertical,
} from 'lucide-react'
import { type DocumentState } from '@/types/document'
import { type TransformResult } from '@/types/transform'
import { type AspectRatio } from '@/types/crop'
import { type CropPanelProps } from '@/features/crop/CropPanel'
import { useTransformState } from './useTransformState'
import { CropSection } from './CropSection'
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
  onApplyTransform: (result: TransformResult) => void
  onPreviewScaleChange?: (scale: { x: number; y: number } | undefined) => void
}

export const OrientationPanel: React.FC<OrientationPanelProps> = ({
  document: doc,
  cropProps,
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

  const handleRotate = async (degrees: 90 | 180 | 270) => {
    try {
      transform.setIsProcessing(true)
      const res = await executeRotate(doc.imageSrc, degrees)
      onApplyTransform(res)
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
      {/* Block 1: Crop */}
      <CropSection
        isCropActive={cropProps.isCropActive}
        cropRect={cropProps.cropRect}
        aspectRatio={cropProps.aspectRatio}
        onSelectRatio={handleRatioSelect}
        onApplyCrop={cropProps.onApplyCrop}
        onCancelCrop={cropProps.onCancelCrop}
        onResetCrop={cropProps.onResetCrop}
      />

      {/* Block 2: Rotate & Flip */}
      <div className="flex flex-col gap-2.5 p-3 bg-[#171722] rounded-xl border border-[#242434]">
        <div className="flex items-center gap-1.5">
          <RotateCw className="w-3.5 h-3.5 text-[#60A5FA]" />
          <span className="text-xs font-semibold text-[#A0A0B2] uppercase tracking-wider">
            Rotate & Flip
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => handleRotate(270)}
            disabled={transform.isProcessing}
            title="Rotate 90° Counter-Clockwise"
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#12121A] hover:bg-[#1C1C28] border border-[#242434] hover:border-[#3A3A4E] text-[#D0D0DC] text-[11px] gap-1 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#60A5FA]" />
            <span>90° CCW</span>
          </button>
          <button
            type="button"
            onClick={() => handleRotate(90)}
            disabled={transform.isProcessing}
            title="Rotate 90° Clockwise"
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#12121A] hover:bg-[#1C1C28] border border-[#242434] hover:border-[#3A3A4E] text-[#D0D0DC] text-[11px] gap-1 transition-all cursor-pointer"
          >
            <RotateCw className="w-4 h-4 text-[#60A5FA]" />
            <span>90° CW</span>
          </button>
          <button
            type="button"
            onClick={() => handleRotate(180)}
            disabled={transform.isProcessing}
            title="Rotate 180°"
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#12121A] hover:bg-[#1C1C28] border border-[#242434] hover:border-[#3A3A4E] text-[#D0D0DC] text-[11px] gap-1 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#60A5FA]" />
            <span>180°</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 mt-0.5">
          <button
            type="button"
            onClick={() => handleFlip('horizontal')}
            disabled={transform.isProcessing}
            title="Flip Horizontal (Mirror)"
            className="flex items-center justify-center p-2 rounded-lg bg-[#12121A] hover:bg-[#1C1C28] border border-[#242434] hover:border-[#3A3A4E] text-[#D0D0DC] text-[11px] gap-1.5 transition-all cursor-pointer"
          >
            <FlipHorizontal className="w-4 h-4 text-[#60A5FA]" />
            <span>Flip H</span>
          </button>
          <button
            type="button"
            onClick={() => handleFlip('vertical')}
            disabled={transform.isProcessing}
            title="Flip Vertical"
            className="flex items-center justify-center p-2 rounded-lg bg-[#12121A] hover:bg-[#1C1C28] border border-[#242434] hover:border-[#3A3A4E] text-[#D0D0DC] text-[11px] gap-1.5 transition-all cursor-pointer"
          >
            <FlipVertical className="w-4 h-4 text-[#60A5FA]" />
            <span>Flip V</span>
          </button>
        </div>
      </div>

      {/* Block 3: Scale(px) */}
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

      {/* Block 4: Stretch */}
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
