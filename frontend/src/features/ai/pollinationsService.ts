import {
  MAX_PROMPT_LENGTH,
  type AIAspectRatio,
  type AIStyleModifier,
  type AIGenerateRequest,
  type AIGeneratedResult,
} from './types'
import {
  computeEditDimensions,
  inferAspectRatio,
  imageSrcToDataUri,
  scaleBase64ImageToExactDimensions,
} from './pollinationsEditUtils'

export { computeEditDimensions, inferAspectRatio }

export const ASPECT_RATIO_DIMENSIONS: Record<AIAspectRatio, { width: number; height: number; label: string }> = {
  '1:1': { width: 1024, height: 1024, label: '1:1 Square' },
  '16:9': { width: 1280, height: 720, label: '16:9 Wide' },
  '9:16': { width: 720, height: 1280, label: '9:16 Tall' },
  '4:3': { width: 1024, height: 768, label: '4:3 Landscape' },
  '3:4': { width: 768, height: 1024, label: '3:4 Portrait' },
}

export const STYLE_MODIFIER_PROMPTS: Record<AIStyleModifier, { label: string; suffix: string }> = {
  none: { label: 'None (Raw)', suffix: '' },
  photorealistic: { label: 'Photorealistic', suffix: ', photorealistic, 8k DSLR photography, natural lighting, sharp focus' },
  cinematic: { label: 'Cinematic', suffix: ', cinematic lighting, film grain, dramatic atmosphere, anamorphic lens, 4k' },
  'digital-art': { label: 'Digital Art', suffix: ', concept art, highly detailed digital illustration, artstation' },
  anime: { label: 'Anime', suffix: ', anime style, studio ghibli and makoto shinkai inspired, vibrant colors' },
  watercolor: { label: 'Watercolor', suffix: ', delicate watercolor painting on textured paper, soft artistic brush strokes' },
  cyberpunk: { label: 'Cyberpunk', suffix: ', cyberpunk neon aesthetic, futuristic rain reflections, high contrast' },
  'oil-painting': { label: 'Oil Painting', suffix: ', classical oil painting on canvas, rich impasto brushwork, fine art' },
}

export function getPollinationsApiKey(): string {
  return (import.meta.env?.VITE_POLLINATIONS_API_KEY as string | undefined)?.trim() ?? ''
}

export function generateRandomSeed(): number {
  return Math.floor(100000 + Math.random() * 900000)
}

export function buildPollinationsPrompt(prompt: string, style: AIStyleModifier): string {
  const base = prompt.trim().slice(0, MAX_PROMPT_LENGTH)
  if (!base) return ''
  const suffix = STYLE_MODIFIER_PROMPTS[style]?.suffix ?? ''
  return `${base}${suffix}`
}

export function buildPollinationsUrl(req: AIGenerateRequest): string {
  const finalPrompt = buildPollinationsPrompt(req.prompt, req.style)
  const dims = ASPECT_RATIO_DIMENSIONS[req.aspectRatio] ?? ASPECT_RATIO_DIMENSIONS['1:1']
  const seed = Number.isFinite(req.seed) ? Math.abs(Math.floor(req.seed)) : 123456
  const encoded = encodeURIComponent(finalPrompt)
  const key = getPollinationsApiKey()
  if (key) {
    return `https://gen.pollinations.ai/image/${encoded}?model=flux&width=${dims.width}&height=${dims.height}&seed=${seed}&nologo=true&enhance=${req.enhance ? 'true' : 'false'}&key=${encodeURIComponent(key)}`
  }
  return `https://image.pollinations.ai/prompt/${encoded}?model=flux&width=${dims.width}&height=${dims.height}&seed=${seed}&nologo=true&enhance=${req.enhance ? 'true' : 'false'}`
}

export async function editPollinationsImage(
  req: AIGenerateRequest,
  timeoutMs = 35000
): Promise<AIGeneratedResult> {
  const trimmed = req.prompt.trim().slice(0, MAX_PROMPT_LENGTH)
  if (!trimmed) {
    throw new Error('Please enter an edit instruction for the current image.')
  }
  if (!req.sourceImageSrc) {
    throw new Error('No active image found to edit.')
  }

  const key = getPollinationsApiKey()
  const finalPrompt = buildPollinationsPrompt(trimmed, req.style)
  const seed = Number.isFinite(req.seed) ? Math.abs(Math.floor(req.seed)) : 123456
  const { dataUri, origW, origH, editW, editH } = await imageSrcToDataUri(
    req.sourceImageSrc,
    req.sourceWidth,
    req.sourceHeight
  )
  const outW = req.sourceWidth || origW
  const outH = req.sourceHeight || origH
  const matchedRatio = inferAspectRatio(outW, outH)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const endpoint = key
    ? `https://gen.pollinations.ai/v1/images/edits?key=${encodeURIComponent(key)}`
    : 'https://gen.pollinations.ai/v1/images/edits'

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (key) headers.Authorization = `Bearer ${key}`

    const res = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers,
      body: JSON.stringify({
        prompt: finalPrompt,
        model: 'klein',
        image: [{ image_url: dataUri }],
        size: `${editW}x${editH}`,
        seed,
        response_format: 'b64_json',
      }),
    })
    clearTimeout(timer)

    if (res.status === 401 || res.status === 403) {
      throw new Error('Pollinations.ai returned 403 Forbidden. Check VITE_POLLINATIONS_API_KEY in .env.')
    }
    if (res.status === 429) {
      throw new Error('Pollinations.ai rate limit reached. Please wait a few seconds and try again.')
    }
    if (!res.ok) {
      throw new Error(`Pollinations.ai image edit returned status ${res.status}. Please try again.`)
    }

    const json = (await res.json()) as { data?: Array<{ b64_json?: string }> }
    const b64 = json.data?.[0]?.b64_json
    if (!b64) {
      throw new Error('Pollinations.ai returned an empty edited image response.')
    }

    const blob = await scaleBase64ImageToExactDimensions(b64, outW, outH)
    const objectUrl = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
      ? URL.createObjectURL(blob)
      : `data:image/jpeg;base64,${b64}`

    return {
      url: objectUrl,
      blob,
      width: outW,
      height: outH,
      prompt: trimmed,
      style: req.style,
      aspectRatio: matchedRatio,
      seed,
    }
  } catch (err) {
    clearTimeout(timer)
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Image edit timed out. Pollinations.ai may be busy; please try again.', { cause: err })
    }
    throw err instanceof Error ? err : new Error('Failed to edit image with Pollinations.ai.', { cause: err })
  }
}

export async function generatePollinationsImage(
  req: AIGenerateRequest,
  timeoutMs = 25000
): Promise<AIGeneratedResult> {
  const trimmed = req.prompt.trim().slice(0, MAX_PROMPT_LENGTH)
  if (!trimmed) {
    throw new Error('Please enter a descriptive prompt to generate an image.')
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('You appear to be offline. Check your internet connection and try again.')
  }
  if (req.mode === 'edit' && req.sourceImageSrc) {
    return editPollinationsImage({ ...req, prompt: trimmed }, timeoutMs)
  }

  const url = buildPollinationsUrl({ ...req, prompt: trimmed })
  const dims = ASPECT_RATIO_DIMENSIONS[req.aspectRatio] ?? ASPECT_RATIO_DIMENSIONS['1:1']
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)

    if (res.status === 401 || res.status === 403) {
      throw new Error('Pollinations.ai returned 403 Forbidden. Check VITE_POLLINATIONS_API_KEY in .env.')
    }
    if (res.status === 429) {
      throw new Error('Pollinations.ai rate limit reached. Please wait a few seconds and try again.')
    }
    if (!res.ok) {
      throw new Error(`Pollinations.ai service returned status ${res.status}. Please try again shortly.`)
    }

    const blob = await res.blob()
    if (!blob || blob.size === 0) {
      throw new Error('Pollinations.ai returned an empty image payload.')
    }

    const objectUrl = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
      ? URL.createObjectURL(blob)
      : url

    return {
      url: objectUrl,
      blob,
      width: dims.width,
      height: dims.height,
      prompt: trimmed,
      style: req.style,
      aspectRatio: req.aspectRatio,
      seed: req.seed,
    }
  } catch (err) {
    clearTimeout(timer)
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Generation timed out. Pollinations.ai may be busy; please try again.', { cause: err })
    }
    if (err instanceof TypeError) {
      throw new Error('Unable to reach Pollinations.ai. Check your network connection or try again later.', { cause: err })
    }
    throw err instanceof Error ? err : new Error('Failed to generate image from Pollinations.ai.', { cause: err })
  }
}
