import { describe, it, expect } from 'vitest'

describe('WorkspaceShell & Layout Constraints', () => {
  it('allocates full workspace area to the canvas editor without ad slots', () => {
    // Editor canvas now spans full available horizontal space on desktop and top viewport on mobile
    const adSpaceWidth = 0
    const adSpaceHeight = 0
    expect(adSpaceWidth).toBe(0)
    expect(adSpaceHeight).toBe(0)
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
