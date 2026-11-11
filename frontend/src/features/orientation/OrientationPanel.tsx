import React, { useEffect } from 'react'
import {
  RotateCcw,
  RotateCw,
  RefreshCw,
  FlipHorizontal,
  FlipVertical,
  Crop as CropIcon,
} from 'lucide-react'
import { type DocumentState } from '@/types/document'
import { type TransformResult } from '@/types/transform'
import { CropPanel, type CropPanelProps } from '@/features/crop/CropPanel'
import { useTransformState } from './useTransformState'
import { ResizeSection } from './ResizeSection'
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

  // If interactive crop mode is active, render crop interface
  if (cropProps.isCropActive) {
    return <CropPanel {...cropProps} />
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

  const handleApplyResize = async () => {
    try {
      transform.setIsProcessing(true)
      const res = await executeResize(
        doc.imageSrc,
        transform.resizeWidth,
        transform.resizeHeight
      )
      onApplyTransform(res)
    } catch (err) {
      console.error('Failed to resize canvas:', err)
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
      {/* Interactive Crop Mode Launcher */}
      <button
        type="button"
        onClick={cropProps.onStartCrop}
        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#2563EB]/20 to-[#3B82F6]/10 border border-[#3B82F6]/40 hover:border-[#3B82F6] text-[#E0E0EC] hover:text-white flex items-center justify-center gap-2 font-medium text-xs transition-all cursor-pointer shadow-md"
      >
        <CropIcon className="w-4 h-4 text-[#60A5FA]" />
        <span>Open Interactive Crop</span>
      </button>

      {/* Rotation & Flipping Controls */}
      <div className="flex flex-col gap-2 p-3 bg-[#171722] rounded-xl border border-[#242434]">
        <span className="text-xs font-semibold text-[#A0A0B2] uppercase tracking-wider">
          Rotate & Flip
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => handleRotate(270)}
            disabled={transform.isProcessing}
            title="Rotate 90° Counter-Clockwise"
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#14141E] hover:bg-[#20202E] border border-[#2A2A3A] hover:border-[#3A3A4E] text-[#D0D0DC] text-[11px] gap-1 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#60A5FA]" />
            <span>90° CCW</span>
          </button>
          <button
            type="button"
            onClick={() => handleRotate(90)}
            disabled={transform.isProcessing}
            title="Rotate 90° Clockwise"
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#14141E] hover:bg-[#20202E] border border-[#2A2A3A] hover:border-[#3A3A4E] text-[#D0D0DC] text-[11px] gap-1 transition-all cursor-pointer"
          >
            <RotateCw className="w-4 h-4 text-[#60A5FA]" />
            <span>90° CW</span>
          </button>
          <button
            type="button"
            onClick={() => handleRotate(180)}
            disabled={transform.isProcessing}
            title="Rotate 180°"
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#14141E] hover:bg-[#20202E] border border-[#2A2A3A] hover:border-[#3A3A4E] text-[#D0D0DC] text-[11px] gap-1 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#A78BFA]" />
            <span>180°</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 mt-0.5">
          <button
            type="button"
            onClick={() => handleFlip('horizontal')}
            disabled={transform.isProcessing}
            title="Flip Horizontal (Mirror)"
            className="flex items-center justify-center p-2 rounded-lg bg-[#14141E] hover:bg-[#20202E] border border-[#2A2A3A] hover:border-[#3A3A4E] text-[#D0D0DC] text-[11px] gap-1.5 transition-all cursor-pointer"
          >
            <FlipHorizontal className="w-4 h-4 text-[#34D399]" />
            <span>Flip H</span>
          </button>
          <button
            type="button"
            onClick={() => handleFlip('vertical')}
            disabled={transform.isProcessing}
            title="Flip Vertical"
            className="flex items-center justify-center p-2 rounded-lg bg-[#14141E] hover:bg-[#20202E] border border-[#2A2A3A] hover:border-[#3A3A4E] text-[#D0D0DC] text-[11px] gap-1.5 transition-all cursor-pointer"
          >
            <FlipVertical className="w-4 h-4 text-[#34D399]" />
            <span>Flip V</span>
          </button>
        </div>
      </div>

      {/* Canvas Resize */}
      <ResizeSection
        width={transform.resizeWidth}
        height={transform.resizeHeight}
        lockAspectRatio={transform.lockAspectRatio}
        currentWidth={doc.currentWidth}
        currentHeight={doc.currentHeight}
        onWidthChange={transform.handleWidthChange}
        onHeightChange={transform.handleHeightChange}
        onToggleLock={transform.toggleLockAspectRatio}
        onApplyResize={handleApplyResize}
        onResetResize={transform.resetResize}
        isProcessing={transform.isProcessing}
      />

      {/* Bilinear Stretch */}
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
