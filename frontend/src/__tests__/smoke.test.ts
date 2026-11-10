import { describe, it, expect } from 'vitest'

describe('EzEdit Environment & Test Suite', () => {
  it('runs vitest properly', () => {
    expect(1 + 1).toBe(2)
  })

  it('validates 0.1 slider precision roundtrip', () => {
    const rawVal = 0.1 + 0.2
    const preciseVal = Math.round(rawVal * 10) / 10
    expect(preciseVal).toBe(0.3)
  })
})
