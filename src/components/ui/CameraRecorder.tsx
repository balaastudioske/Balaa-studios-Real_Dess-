'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Circle, Square, Download, Video } from 'lucide-react'

interface CameraRecorderProps {
  canvasSelector?: string
}

export const CameraRecorder = ({ canvasSelector = 'canvas' }: CameraRecorderProps) => {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [recordingTime, setRecordingTime] = useState<number>(0)
  const [lastDownloadUrl, setLastDownloadUrl] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const downloadTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = useCallback(() => {
    const canvas = document.querySelector(canvasSelector) as HTMLCanvasElement | null
    if (!canvas) {
      console.warn(`CameraRecorder: Canvas element with selector "${canvasSelector}" not found.`)
      return
    }

    try {
      const stream = (canvas as HTMLCanvasElement & { captureStream?: (fps?: number) => MediaStream }).captureStream
        ? (canvas as HTMLCanvasElement & { captureStream: (fps?: number) => MediaStream }).captureStream(30)
        : (canvas as HTMLCanvasElement).captureStream(30)

      chunksRef.current = []

      let mimeType = 'video/webm;codecs=vp9'
      if (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : ''
      }

      const options: MediaRecorderOptions = mimeType ? { mimeType } : {}
      const recorder = new MediaRecorder(stream, options)

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' })
          const url = URL.createObjectURL(blob)
          const timestamp = Date.now()
          const filename = `midnight-studio-recording-${timestamp}.webm`

          // Automatic download
          const a = document.createElement('a')
          a.href = url
          a.download = filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)

          setLastDownloadUrl(url)

          if (downloadTimeoutRef.current) {
            clearTimeout(downloadTimeoutRef.current)
          }
          downloadTimeoutRef.current = setTimeout(() => {
            setLastDownloadUrl(null)
          }, 10000)
        }

        setIsRecording(false)
        setRecordingTime(0)
      }

      mediaRecorderRef.current = recorder
      recorder.start(100)

      setIsRecording(true)
      setRecordingTime(0)

      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
    }
  }, [canvasSelector])

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    } else {
      setIsRecording(false)
      setRecordingTime(0)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (downloadTimeoutRef.current) clearTimeout(downloadTimeoutRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  return (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-2 p-2 bg-slate-900/80 backdrop-blur rounded-lg border border-slate-700 shadow-xl text-white text-xs font-mono">
      {!isRecording ? (
        <button
          onClick={startRecording}
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors border border-slate-600/50"
        >
          <Video className="w-4 h-4 text-purple-400" />
          <span>Record</span>
        </button>
      ) : (
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex items-center gap-2">
            <Circle className="w-3 h-3 text-red-500 fill-red-500 bg-red-500 rounded-full animate-pulse" />
            <span className="font-semibold text-red-400 tracking-wider">
              {formatTime(recordingTime)}
            </span>
          </div>
          <button
            onClick={stopRecording}
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 hover:text-red-100 transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop</span>
          </button>
        </div>
      )}

      {lastDownloadUrl && !isRecording && (
        <a
          href={lastDownloadUrl}
          download={`midnight-studio-recording-${Date.now()}.webm`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/40 hover:text-emerald-100 transition-colors"
          title="Download last recording"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download</span>
        </a>
      )}
    </div>
  )
}
