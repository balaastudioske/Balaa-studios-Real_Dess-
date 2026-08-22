import fs from 'node:fs'
import path from 'node:path'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { decimate } from './decimate.mjs'

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
for (const f of ['shirt']) {
  const g = await new Promise((res, rej) => loader.load(`public/library/garments/${f}.glb`, res, undefined, rej))
  let m = null
  g.scene.traverse((c) => { if (c.isMesh && !m) m = c })
  const before = m.geometry
  const bt0 = Date.now()
  const out = decimate(before, 8000)
  const bt = Date.now() - bt0
  const beforeT = before.index ? before.index.count / 3 : before.attributes.position.count / 3
  const afterT = out.index ? out.index.count / 3 : out.attributes.position.count / 3
  // manifold check
  const idx = out.index.array
  const counts = new Map()
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i], b = idx[i + 1], c = idx[i + 2]
    for (const e of [ek(a, b), ek(b, c), ek(a, c)]) counts.set(e, (counts.get(e) ?? 0) + 1)
  }
  let boundary = 0, nonmanifold = 0
  for (const c of counts.values()) { if (c === 1) boundary++; if (c > 2) nonmanifold++ }
  console.log(`${f}: ${Math.round(beforeT)} tris -> ${Math.round(afterT)} tris, ${out.attributes.position.count} verts | ${bt}ms | boundary=${boundary} nonmanifold=${nonmanifold}`)
}
process.exit(0)
function ek(a, b) { return a < b ? `${a},${b}` : `${b},${a}` }
