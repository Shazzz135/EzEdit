export interface PollinationsInpaintOptions {
  prompt?: string
  seed?: number
  width: number
  height: number
}

export async function executePollinationsInpainting(
  _imageSrc: string,
  options: PollinationsInpaintOptions
): Promise<Blob | null> {
  const promptText = options.prompt?.trim() || 'seamless background texture inpainting, natural photo scenery'
  const seed = options.seed ?? Math.floor(Math.random() * 1000000)

  // Clamp dimensions to common AI resolutions for fast inference
  const w = Math.min(1024, Math.max(256, Math.round(options.width / 64) * 64))
  const h = Math.min(1024, Math.max(256, Math.round(options.height / 64) * 64))

  const endpoint = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    promptText
  )}?width=${w}&height=${h}&seed=${seed}&nologo=true&enhance=false`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000) // 12s timeout

  try {
    const res = await fetch(endpoint, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return null
    return await res.blob()
  } catch (err) {
    clearTimeout(timeout)
    console.warn('Pollinations.ai inpainting request failed, using local patch fill fallback:', err)
    return null
  }
}
