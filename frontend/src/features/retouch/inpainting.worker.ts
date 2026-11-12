import { runInpaintingMath } from './inpaintingMath'

export interface InpaintingWorkerRequest {
  imageBuffer: Uint8ClampedArray
  maskBuffer: Uint8ClampedArray
  width: number
  height: number
}

export type InpaintingWorkerMessage =
  | { type: 'progress'; progress: number }
  | { type: 'complete'; result: Uint8ClampedArray }
  | { type: 'error'; error: string }

addEventListener('message', (e: MessageEvent<InpaintingWorkerRequest>) => {
  try {
    const { imageBuffer, maskBuffer, width, height } = e.data
    const result = runInpaintingMath(imageBuffer, maskBuffer, width, height, (progress) => {
      postMessage({ type: 'progress', progress })
    })
    postMessage({ type: 'complete', result })
  } catch (err) {
    postMessage({ type: 'error', error: err instanceof Error ? err.message : String(err) })
  }
})
