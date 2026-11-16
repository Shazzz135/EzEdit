import { getPollinationsApiKey, parseRetryAfter } from '@/features/ai/pollinationsService'
import { computeEditDimensions, base64ToBlob } from '@/features/ai/pollinationsEditUtils'
import { aiRateLimiter } from '@/features/ai/rateLimiter'

export interface PollinationsInpaintOptions {
  prompt?: string
  seed?: number
  width: number
  height: number
}

export async function executePollinationsInpainting(
  imageSrc: string,
  options: PollinationsInpaintOptions
): Promise<Blob | null> {
  const status = aiRateLimiter.getStatus()
  if (!status.allowed) {
    console.warn(`AI inpainting throttled (${status.reason}): wait ${status.remainingSeconds}s`)
    return null
  }

  const userPrompt = options.prompt?.trim()
  const promptText = userPrompt
    ? `Inpaint and seamlessly replace the masked region with ${userPrompt}, matching surrounding photo lighting, colors, and perspective`
    : 'Remove the masked object and seamlessly reconstruct the natural background texture, lighting, and perspective'
  const seed = options.seed ?? Math.floor(100000 + Math.random() * 900000)
  const { editW, editH } = computeEditDimensions(options.width, options.height, 1024)
  const key = getPollinationsApiKey()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  aiRateLimiter.recordRequestStart(controller)

  try {
    const endpoint = key
      ? `https://gen.pollinations.ai/v1/images/edits?key=${encodeURIComponent(key)}`
      : 'https://gen.pollinations.ai/v1/images/edits'
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (key) headers.Authorization = `Bearer ${key}`

    const res = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers,
      body: JSON.stringify({
        prompt: promptText,
        model: 'klein',
        image: [{ image_url: imageSrc }],
        size: `${editW}x${editH}`,
        seed,
        response_format: 'b64_json',
      }),
    })
    clearTimeout(timeout)

    if (res.status === 429) {
      const waitSec = parseRetryAfter(res, 15)
      aiRateLimiter.recordRequestRateLimited(waitSec)
      return null
    }

    if (!res.ok) {
      aiRateLimiter.recordRequestError()
      return null
    }

    const contentType = res.headers.get('content-type') || ''
    let resultBlob: Blob | null = null
    if (contentType.includes('application/json')) {
      const json = (await res.json()) as { data?: Array<{ b64_json?: string }> }
      const b64 = json.data?.[0]?.b64_json
      resultBlob = b64 ? base64ToBlob(b64, 'image/jpeg') : null
    } else {
      resultBlob = await res.blob()
    }

    if (resultBlob) {
      aiRateLimiter.recordRequestSuccess()
    } else {
      aiRateLimiter.recordRequestError()
    }
    return resultBlob
  } catch (err) {
    clearTimeout(timeout)
    aiRateLimiter.recordRequestError()
    console.warn('Pollinations.ai inpainting request failed:', err)
    return null
  }
}
