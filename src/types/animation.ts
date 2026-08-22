export interface AnimationClipMeta {
  id: string
  name: string
  storageUrl: string // Path or URL to the FBX/GLB in Storage
  duration: number
  trimStart: number
  trimEnd: number
  tags: string[]
  createdAt: string
}
