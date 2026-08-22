/**
 * Scene Studio — Scene Recorder
 *
 * Captures the live 3D canvas as short video clips (~10s) with
 * synchronized audio baked in. Exported clips include any playing
 * audio track so they can be cut together on the beat in an
 * external editor without manual re-syncing.
 */

export interface RecordingConfig {
  /** CSS selector for the canvas element */
  canvasSelector: string
  /** Target FPS for the capture */
  fps: number
  /** Video MIME type preference */
  mimeType: string
}

const DEFAULT_CONFIG: RecordingConfig = {
  canvasSelector: 'canvas',
  fps: 30,
  mimeType: 'video/webm;codecs=vp9',
}

/**
 * Starts recording the canvas, merging any active audio streams.
 *
 * @returns A controller object with stop() to end recording and get the blob.
 */
export function startSceneRecording(
  config: Partial<RecordingConfig> = {},
  audioElement?: HTMLAudioElement | null
): {
  stop: () => Promise<Blob>
  cancel: () => void
  isRecording: boolean
} {
  const { canvasSelector, fps, mimeType } = { ...DEFAULT_CONFIG, ...config }
  const canvas = document.querySelector(canvasSelector) as HTMLCanvasElement | null

  if (!canvas) {
    throw new Error(`Canvas element "${canvasSelector}" not found`)
  }

  // Capture the canvas video stream
  const canvasStream = canvas.captureStream(fps)

  // If audio is playing, capture and merge it into the recording
  let combinedStream: MediaStream
  if (audioElement && !audioElement.paused) {
    try {
      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaElementSource(audioElement)
      const dest = audioCtx.createMediaStreamDestination()
      source.connect(dest)
      source.connect(audioCtx.destination) // Keep audio audible

      // Merge video + audio tracks into one stream
      combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ])
    } catch {
      // If audio capture fails (e.g. CORS), fall back to video-only
      console.warn('[SceneRecorder] Audio capture failed, recording video only')
      combinedStream = canvasStream
    }
  } else {
    combinedStream = canvasStream
  }

  // Resolve MIME type
  let resolvedMime = mimeType
  if (!MediaRecorder.isTypeSupported(resolvedMime)) {
    resolvedMime = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : ''
  }

  const chunks: Blob[] = []
  const recorder = new MediaRecorder(
    combinedStream,
    resolvedMime ? { mimeType: resolvedMime } : {}
  )

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data)
  }

  let resolveStop: ((blob: Blob) => void) | null = null
  let cancelled = false

  recorder.onstop = () => {
    if (!cancelled && resolveStop) {
      const blob = new Blob(chunks, { type: resolvedMime || 'video/webm' })
      resolveStop(blob)
    }
  }

  recorder.start(100)

  return {
    get isRecording() {
      return recorder.state === 'recording'
    },

    stop: () =>
      new Promise<Blob>((resolve) => {
        resolveStop = resolve
        if (recorder.state !== 'inactive') {
          recorder.stop()
        } else {
          resolve(new Blob(chunks, { type: resolvedMime || 'video/webm' }))
        }
      }),

    cancel: () => {
      cancelled = true
      if (recorder.state !== 'inactive') recorder.stop()
    },
  }
}

/**
 * Downloads a recorded blob as a file.
 */
export function downloadRecording(blob: Blob, filename?: string): void {
  const url = URL.createObjectURL(blob)
  const name = filename || `balaa-scene-${Date.now()}.webm`
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
