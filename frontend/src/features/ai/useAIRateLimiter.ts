import { useState, useEffect, useCallback } from 'react'
import { aiRateLimiter } from './rateLimiter'

export function useAIRateLimiter() {
  const [status, setStatus] = useState(() => aiRateLimiter.getStatus())

  useEffect(() => {
    const unsubscribe = aiRateLimiter.subscribe(() => {
      setStatus(aiRateLimiter.getStatus())
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (status.remainingSeconds <= 0) return

    const interval = setInterval(() => {
      const nextStatus = aiRateLimiter.getStatus()
      setStatus(nextStatus)
      if (nextStatus.remainingSeconds <= 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [status.remainingSeconds])

  const cancelActiveRequest = useCallback(() => {
    aiRateLimiter.cancelInFlight()
  }, [])

  const clearCooldown = useCallback(() => {
    aiRateLimiter.clearCooldown()
  }, [])

  return {
    isRateLimited: status.remainingSeconds > 0,
    cooldownSeconds: status.remainingSeconds,
    isInFlight: status.isInFlight,
    status,
    cancelActiveRequest,
    clearCooldown,
  }
}
