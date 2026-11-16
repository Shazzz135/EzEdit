export class AIRateLimitError extends Error {
  public retryAfterSeconds: number

  constructor(message: string, retryAfterSeconds = 15) {
    super(message)
    this.name = 'AIRateLimitError'
    this.retryAfterSeconds = Math.max(1, Math.round(retryAfterSeconds))
  }
}

export interface RateLimitStatus {
  allowed: boolean
  remainingSeconds: number
  isInFlight: boolean
  reason?: 'in_flight' | 'cooldown'
}

type Listener = () => void

class AIRateLimiter {
  private activeController: AbortController | null = null
  private cooldownUntil = 0
  private inFlight = false
  private listeners: Set<Listener> = new Set()
  private defaultCooldownMs = 4000 // 4s cooldown between requests

  public get isInFlight(): boolean {
    return this.inFlight
  }

  public get remainingSeconds(): number {
    const diff = this.cooldownUntil - Date.now()
    return diff > 0 ? Math.ceil(diff / 1000) : 0
  }

  public getStatus(): RateLimitStatus {
    if (this.inFlight) {
      return { allowed: false, remainingSeconds: this.remainingSeconds, isInFlight: true, reason: 'in_flight' }
    }
    const remaining = this.remainingSeconds
    if (remaining > 0) {
      return { allowed: false, remainingSeconds: remaining, isInFlight: false, reason: 'cooldown' }
    }
    return { allowed: true, remainingSeconds: 0, isInFlight: false }
  }

  public recordRequestStart(controller?: AbortController): void {
    this.inFlight = true
    this.activeController = controller ?? null
    this.notify()
  }

  public recordRequestSuccess(customCooldownMs?: number): void {
    this.inFlight = false
    this.activeController = null
    const duration = typeof customCooldownMs === 'number' ? customCooldownMs : this.defaultCooldownMs
    this.cooldownUntil = Date.now() + duration
    this.notify()
  }

  public recordRequestRateLimited(retryAfterSeconds?: number): void {
    this.inFlight = false
    this.activeController = null
    const sec = typeof retryAfterSeconds === 'number' && retryAfterSeconds > 0 ? retryAfterSeconds : 15
    this.cooldownUntil = Date.now() + sec * 1000
    this.notify()
  }

  public recordRequestError(): void {
    this.inFlight = false
    this.activeController = null
    // 2s brief backoff on generic error to prevent rapid spam clicking
    this.cooldownUntil = Math.max(this.cooldownUntil, Date.now() + 2000)
    this.notify()
  }

  public cancelInFlight(): boolean {
    if (this.activeController) {
      this.activeController.abort()
      this.activeController = null
      this.inFlight = false
      this.notify()
      return true
    }
    return false
  }

  public clearCooldown(): void {
    this.cooldownUntil = 0
    this.notify()
  }

  public reset(): void {
    this.cancelInFlight()
    this.cooldownUntil = 0
    this.inFlight = false
    this.notify()
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener()
      } catch {
        // ignore listener errors
      }
    }
  }
}

export const aiRateLimiter = new AIRateLimiter()
