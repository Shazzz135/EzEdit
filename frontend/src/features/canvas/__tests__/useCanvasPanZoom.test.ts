import { describe, it, expect } from 'vitest'
import { MIN_ZOOM, MAX_ZOOM } from '../useCanvasPanZoom'

describe('useCanvasPanZoom Math & Coordinate Engine', () => {
  it('enforces zoom boundaries between 10% and 3200%', () => {
    expect(MIN_ZOOM).toBe(0.1)
    expect(MAX_ZOOM).toBe(32.0)

    const clampScale = (val: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, val))
    expect(clampScale(0.02)).toBe(0.1)
    expect(clampScale(50.0)).toBe(32.0)
    expect(clampScale(1.5)).toBe(1.5)
  })

  it('correctly calculates fit-to-screen scaling ratio with padding', () => {
    const containerW = 1000
    const containerH = 800
    const padding = 64
    const availableW = containerW - padding
    const availableH = containerH - padding

    // Landscape image larger than container
    const imgW = 2000
    const imgH = 1000
    const fitScale = Math.min(availableW / imgW, availableH / imgH, 1.0)
    // availableW / imgW = 936 / 2000 = 0.468
    // availableH / imgH = 736 / 1000 = 0.736
    expect(fitScale).toBe(0.468)

    // Image smaller than container: preserves 1.0 scale
    const smallW = 400
    const smallH = 300
    const smallFitScale = Math.min(availableW / smallW, availableH / smallH, 1.0)
    expect(smallFitScale).toBe(1.0)
  })

  it('accurately projects screen coordinates to canvas pixels and back', () => {
    const scale = 2.0
    const offset = { x: 50, y: -20 }
    const imageW = 800
    const imageH = 600

    const containerRect = {
      left: 100,
      top: 50,
      width: 1200,
      height: 900,
    }

    const containerCenterX = containerRect.left + containerRect.width / 2 + offset.x
    const containerCenterY = containerRect.top + containerRect.height / 2 + offset.y

    const screenToCanvas = (clientX: number, clientY: number) => {
      const relX = (clientX - containerCenterX) / scale
      const relY = (clientY - containerCenterY) / scale
      return {
        x: Math.round(relX + imageW / 2),
        y: Math.round(relY + imageH / 2),
      }
    }

    const canvasToScreen = (canvasX: number, canvasY: number) => {
      return {
        x: containerCenterX + (canvasX - imageW / 2) * scale,
        y: containerCenterY + (canvasY - imageH / 2) * scale,
      }
    }

    // Center of image should project to containerCenter
    const screenCenter = canvasToScreen(400, 300)
    expect(screenCenter.x).toBe(containerCenterX)
    expect(screenCenter.y).toBe(containerCenterY)

    // And roundtrip back
    const backToCanvas = screenToCanvas(screenCenter.x, screenCenter.y)
    expect(backToCanvas.x).toBe(400)
    expect(backToCanvas.y).toBe(300)
  })
})
