import { describe, it, expect } from 'vitest'

describe('PrecisionSlider Step & Rounding Logic', () => {
  const roundToStep = (val: number, step = 0.1) => {
    const factor = 1 / step
    return Math.round(val * factor) / factor
  }

  const clamp = (val: number, min = -100, max = 100, step = 0.1) => {
    const rounded = roundToStep(val, step)
    return Math.min(max, Math.max(min, rounded))
  }

  it('accurately rounds floating point values to 0.1 step', () => {
    expect(roundToStep(12.345)).toBe(12.3)
    expect(roundToStep(12.355)).toBe(12.4)
    expect(roundToStep(-5.76)).toBe(-5.8)
    expect(roundToStep(0.04)).toBe(0.0)
    expect(roundToStep(0.06)).toBe(0.1)
  })

  it('clamps values within min and max boundaries', () => {
    expect(clamp(150, -100, 100)).toBe(100)
    expect(clamp(-150, -100, 100)).toBe(-100)
    expect(clamp(42.12, -100, 100)).toBe(42.1)
  })

  it('calculates bipolar range percentages accurately', () => {
    const min = -100
    const max = 100
    const calcPercent = (val: number) => ((val - min) / (max - min)) * 100

    expect(calcPercent(0)).toBe(50)
    expect(calcPercent(-100)).toBe(0)
    expect(calcPercent(100)).toBe(100)
    expect(calcPercent(50)).toBe(75)
    expect(calcPercent(-50)).toBe(25)
  })
})
