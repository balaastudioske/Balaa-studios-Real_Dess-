export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds - Math.floor(seconds)) * 100)
  return `${m}:${s.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}