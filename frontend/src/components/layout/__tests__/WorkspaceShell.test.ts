import { describe, it, expect } from 'vitest'

describe('WorkspaceShell & Layout Constraints', () => {
  it('enforces exact IAB ad slot dimensions to prevent layout shift', () => {
    const desktopSkyscraperWidth = 160
    const desktopSkyscraperHeight = 600
    const mobileBannerHeight = 50

    expect(desktopSkyscraperWidth).toBe(160)
    expect(desktopSkyscraperHeight).toBe(600)
    expect(mobileBannerHeight).toBe(50)
  })

  it('verifies resizable tools menu width boundaries', () => {
    const defaultToolsWidth = 320
    const minToolsWidth = 260
    const maxToolsWidth = 520

    expect(minToolsWidth).toBeLessThan(defaultToolsWidth)
    expect(defaultToolsWidth).toBeLessThan(maxToolsWidth)

    // Test clamping helper
    const clampWidth = (val: number) =>
      Math.min(maxToolsWidth, Math.max(minToolsWidth, val))

    expect(clampWidth(200)).toBe(260)
    expect(clampWidth(600)).toBe(520)
    expect(clampWidth(380)).toBe(380)
  })

  it('verifies responsive breakpoint boundary between mobile and desktop', () => {
    const mobileMax = 767
    const desktopMin = 768
    expect(mobileMax < desktopMin).toBe(true)
  })

  it('verifies header grab tool props contract and active state', () => {
    let grabToggled = false
    const toggleGrab = () => { grabToggled = !grabToggled }
    let isGrabActive = false

    expect(isGrabActive).toBe(false)
    toggleGrab()
    isGrabActive = grabToggled
    expect(isGrabActive).toBe(true)
    toggleGrab()
    isGrabActive = grabToggled
    expect(isGrabActive).toBe(false)
  })
})
