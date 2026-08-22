import fs from 'node:fs'
import path from 'node:path'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

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
  console.log(`\n${f}.glb  (animations=${g.animations?.length ?? 0}, scenes=${g.scenes?.length ?? 0})`)
  g.scene.traverse((c) => {
    if (c.isMesh || c.isSkinnedMesh) {
      const geo = c.geometry
      const verts = geo.attributes.position.count
      const tris = geo.index ? (geo.index.count / 3) : (verts / 3)
      console.log(`  ${c.name || '(no name)'} [${c.isSkinnedMesh ? 'Skinned' : 'Static'}] verts=${Math.round(verts)} tris=${Math.round(tris)} indexed=${!!geo.index}`)
    }
  })
}
process.exit(0)
