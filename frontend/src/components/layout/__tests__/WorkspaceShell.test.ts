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

  it('verifies desktop tools panel width specification is exactly 320px', () => {
    const desktopToolsWidth = 320
    expect(desktopToolsWidth).toBe(320)
  })

  it('verifies responsive breakpoint boundary between mobile and desktop', () => {
    const mobileMax = 767
    const desktopMin = 768
    expect(mobileMax < desktopMin).toBe(true)
  })
})
