import { describe, it, expect, vi, afterEach } from 'vitest'
import { MAX_PROMPT_LENGTH } from '../types'
import {
  ASPECT_RATIO_DIMENSIONS,
  STYLE_MODIFIER_PROMPTS,
  generateRandomSeed,
  buildPollinationsPrompt,
  buildPollinationsUrl,
  generatePollinationsImage,
} from '../pollinationsService'

describe('Pollinations.ai Generative & Image Editing Service', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('generates a 6-digit random seed', () => {
    const seed = generateRandomSeed()
    expect(seed).toBeGreaterThanOrEqual(100000)
    expect(seed).toBeLessThan(1000000)
  })

  it('appends style modifier suffix and enforces 300-character max prompt length', () => {
    const raw = buildPollinationsPrompt('a mountain cabin', 'none')
    expect(raw).toBe('a mountain cabin')

    const longInput = 'x'.repeat(450)
    const clamped = buildPollinationsPrompt(longInput, 'none')
    expect(clamped.length).toBe(MAX_PROMPT_LENGTH)
    expect(MAX_PROMPT_LENGTH).toBe(300)

    const cinematic = buildPollinationsPrompt('  a mountain cabin  ', 'cinematic')
    expect(cinematic).toContain('a mountain cabin')
    expect(cinematic).toContain(STYLE_MODIFIER_PROMPTS.cinematic.suffix)
  })

  it('builds a valid Pollinations URL with model=flux, dimensions, seed, and enhance parameters', () => {
    const url = buildPollinationsUrl({
      prompt: 'neon city skyline',
      aspectRatio: '16:9',
      style: 'cyberpunk',
      seed: 424242,
      enhance: true,
    })

    expect(url).toMatch(/^https:\/\/(gen|image)\.pollinations\.ai\/(image|prompt)\//)
    expect(url).toContain('model=flux')
    expect(url).toContain(`width=${ASPECT_RATIO_DIMENSIONS['16:9'].width}`)
    expect(url).toContain(`height=${ASPECT_RATIO_DIMENSIONS['16:9'].height}`)
    expect(url).toContain('seed=424242')
    expect(url).toContain('nologo=true')
    expect(url).toContain('enhance=true')
  })

  it('rejects empty prompts immediately', async () => {
    await expect(
      generatePollinationsImage({
        prompt: '   ',
        aspectRatio: '1:1',
        style: 'none',
        seed: 123,
        enhance: false,
      })
    ).rejects.toThrow(/enter a descriptive prompt/i)
  })

  it('handles HTTP 429 rate limit responses with a clear error message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 429 })
    )

    await expect(
      generatePollinationsImage({
        prompt: 'test sunset',
        aspectRatio: '1:1',
        style: 'photorealistic',
        seed: 100,
        enhance: true,
      })
    ).rejects.toThrow(/rate limit/i)
  })

  it('resolves image blob and metadata when Pollinations responds with 200 OK', async () => {
    const fakeBlob = new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' })
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(fakeBlob, { status: 200, headers: { 'Content-Type': 'image/png' } })
    )

    const res = await generatePollinationsImage({
      prompt: 'aurora borealis over fjord',
      aspectRatio: '4:3',
      style: 'photorealistic',
      seed: 777777,
      enhance: true,
    })

    expect(res.width).toBe(1024)
    expect(res.height).toBe(768)
    expect(res.seed).toBe(777777)
    expect(res.prompt).toBe('aurora borealis over fjord')
    expect(res.blob.size).toBeGreaterThan(0)
  })

  it('edits an existing image via POST /v1/images/edits preserving exact source scale and aspect ratio', async () => {
    const fakeB64 = btoa('fake-jpeg-bytes')
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [{ b64_json: fakeB64 }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const res = await generatePollinationsImage({
      prompt: 'make the sky golden hour sunset',
      aspectRatio: '1:1',
      style: 'cinematic',
      seed: 555555,
      enhance: true,
      mode: 'edit',
      sourceImageSrc: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      sourceWidth: 1920,
      sourceHeight: 1080,
    })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [calledUrl, calledInit] = fetchSpy.mock.calls[0]
    expect(String(calledUrl)).toContain('https://gen.pollinations.ai/v1/images/edits')
    expect(calledInit?.method).toBe('POST')
    const sentBody = JSON.parse(String(calledInit?.body))
    expect(sentBody.size).toBe('1024x576')
    expect(res.width).toBe(1920)
    expect(res.height).toBe(1080)
    expect(res.aspectRatio).toBe('16:9')
    expect(res.blob.size).toBeGreaterThan(0)
  })
})
