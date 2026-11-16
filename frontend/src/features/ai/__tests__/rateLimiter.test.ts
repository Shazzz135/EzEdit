import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { aiRateLimiter, AIRateLimitError } from '../rateLimiter'
import { parseRetryAfter } from '../pollinationsService'

describe('AI Rate Limiting & Request Throttling (Issue #46)', () => {
  beforeEach(() => {
    aiRateLimiter.reset()
  })

  afterEach(() => {
    aiRateLimiter.reset()
    vi.restoreAllMocks()
  })

  describe('AIRateLimiter Status & Flow', () => {
    it('initially allows requests with 0 remaining seconds', () => {
      const status = aiRateLimiter.getStatus()
      expect(status.allowed).toBe(true)
      expect(status.remainingSeconds).toBe(0)
      expect(status.isInFlight).toBe(false)
    })

    it('blocks subsequent requests while a request is in-flight', () => {
      const controller = new AbortController()
      aiRateLimiter.recordRequestStart(controller)

      const status = aiRateLimiter.getStatus()
      expect(status.allowed).toBe(false)
      expect(status.isInFlight).toBe(true)
      expect(status.reason).toBe('in_flight')
    })

    it('successfully aborts active request via cancelInFlight', () => {
      const controller = new AbortController()
      const abortSpy = vi.spyOn(controller, 'abort')
      aiRateLimiter.recordRequestStart(controller)

      const canceled = aiRateLimiter.cancelInFlight()
      expect(canceled).toBe(true)
      expect(abortSpy).toHaveBeenCalled()
      expect(aiRateLimiter.isInFlight).toBe(false)
    })

    it('applies client-side cooldown window upon request success', () => {
      aiRateLimiter.recordRequestStart()
      aiRateLimiter.recordRequestSuccess(3000)

      const status = aiRateLimiter.getStatus()
      expect(status.allowed).toBe(false)
      expect(status.reason).toBe('cooldown')
      expect(status.remainingSeconds).toBeGreaterThanOrEqual(1)
      expect(status.remainingSeconds).toBeLessThanOrEqual(3)
    })

    it('applies extended cooldown on HTTP 429 rate limit error', () => {
      aiRateLimiter.recordRequestStart()
      aiRateLimiter.recordRequestRateLimited(25)

      const status = aiRateLimiter.getStatus()
      expect(status.allowed).toBe(false)
      expect(status.reason).toBe('cooldown')
      expect(status.remainingSeconds).toBeGreaterThanOrEqual(24)
      expect(status.remainingSeconds).toBeLessThanOrEqual(25)
    })

    it('allows clearing cooldown immediately', () => {
      aiRateLimiter.recordRequestRateLimited(30)
      expect(aiRateLimiter.remainingSeconds).toBeGreaterThan(0)

      aiRateLimiter.clearCooldown()
      expect(aiRateLimiter.remainingSeconds).toBe(0)
      expect(aiRateLimiter.getStatus().allowed).toBe(true)
    })
  })

  describe('AIRateLimitError Class', () => {
    it('creates error with custom retry-after seconds and name', () => {
      const err = new AIRateLimitError('Too many requests', 20)
      expect(err.name).toBe('AIRateLimitError')
      expect(err.message).toBe('Too many requests')
      expect(err.retryAfterSeconds).toBe(20)
    })

    it('enforces minimum 1 second on retry-after', () => {
      const err = new AIRateLimitError('Limit', 0)
      expect(err.retryAfterSeconds).toBe(1)
    })
  })

  describe('parseRetryAfter Header Parsing', () => {
    it('parses numeric seconds from Retry-After header', () => {
      const res = new Response(null, { headers: { 'Retry-After': '45' } })
      expect(parseRetryAfter(res, 10)).toBe(45)
    })

    it('falls back to defaultSeconds when Retry-After is absent', () => {
      const res = new Response(null)
      expect(parseRetryAfter(res, 15)).toBe(15)
    })

    it('parses future HTTP date string in Retry-After header', () => {
      const futureTime = new Date(Date.now() + 60000).toUTCString()
      const res = new Response(null, { headers: { 'Retry-After': futureTime } })
      const parsed = parseRetryAfter(res, 10)
      expect(parsed).toBeGreaterThanOrEqual(58)
      expect(parsed).toBeLessThanOrEqual(62)
    })
  })
})
