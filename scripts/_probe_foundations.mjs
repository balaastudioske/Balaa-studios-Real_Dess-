import fs from 'node:fs'
import path from 'node:path'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

globalThis.self = globalThis
globalThis.FileReader = class { readAsArrayBuffer() { if (this.onload) this.onload({ target: { result: new ArrayBuffer(0) } }) } }
THREE.FileLoader.prototype.load = (url, onLoad, _, onError) => {
  try {
    const fp = path.isAbsolute(url) ? url : path.join(process.cwd(), url)
    const b = fs.readFileSync(fp)
    const ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
    onLoad(ab)
  } catch (e) { if (onError) onError(e) }
}

const loader = new GLTFLoader()
for (const f of ['shirt', 'hoodie', 'sweater']) {
  const g = await new Promise((res, rej) => loader.load(`public/library/garments/${f}.glb`, res, undefined, rej))
  let m = null
  g.scene.traverse((c) => { if (c.isMesh && !m) m = c })
  const raw = m.geometry.attributes.position.count
  const indexed = m.geometry.index ? m.geometry.index.count : 'none'
  const merged = mergeVertices(m.geometry)
  console.log(`${f}: raw verts=${raw} indexCount=${indexed} merged verts=${merged.attributes.position.count}`)
}
process.exit(0)
