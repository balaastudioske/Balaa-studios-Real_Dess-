import fs from 'node:fs'
import path from 'node:path'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

globalThis.self = globalThis
class NodeFileReader {
  constructor() { this.onload = null; this.onerror = null; this.onloadend = null; this.result = null }
  _complete(result, err) {
    this.result = result
    if (err) { if (this.onerror) this.onerror(err) } else { if (this.onload) this.onload({ target: this }) }
    if (this.onloadend) this.onloadend({ target: this })
  }
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((a) => this._complete(a)).catch((e) => this._complete(null, e)) }
}
globalThis.FileReader = NodeFileReader
THREE.FileLoader.prototype.load = function (url, onLoad, onProgress, onError) {
  const fp = path.isAbsolute(url) ? url : path.join(process.cwd(), url)
  const buf = fs.readFileSync(fp)
  onLoad(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
}

async function check(p) {
  const buf = fs.readFileSync(p)
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  const g = await new GLTFLoader().parseAsync(ab, path.dirname(p))
  const scene = g.scene || (g.scenes && g.scenes[0])
  let skinned = 0, hasBind = 0, hasJoints = 0, total = 0, verts = 0, si = true, sw = true
  scene.traverse((c) => {
    if (c.isSkinnedMesh) {
      skinned++; total++
      if (c.bindMatrix) hasBind++
      if (c.skeleton && c.skeleton.bones.length > 0) hasJoints++
      verts = c.geometry.getAttribute('position').count
      if (!c.geometry.getAttribute('skinIndex')) si = false
      if (!c.geometry.getAttribute('skinWeight')) sw = false
    }
  })
  return { name: path.basename(path.dirname(p)) + '/' + path.basename(p), skinned, hasBind, hasJoints, total, verts, si, sw }
}

const targets = []
for (const k of ['shirt','hoodie','sweater']) targets.push(path.join('public/library/wardrobe', k + '_final.glb'))
for (let i = 1; i <= 10; i++) targets.push(path.join('public/library/merch', String(i).padStart(2,'0'), 'garment.glb'))

;(async () => {
  let ok = true
  for (const t of targets) {
    try {
      const r = await check(t)
      const good = r.skinned === r.total && r.hasBind === r.total && r.hasJoints === r.total && r.skinned >= 1 && r.si && r.sw && r.verts > 100
      console.log(`${good ? 'OK ' : 'BAD'} ${r.name}  skinned=${r.skinned}/${r.total} bind=${r.hasBind} joints=${r.hasJoints} verts=${r.verts} skinIdx/Weight=${r.si}/${r.sw}`)
      if (!good) ok = false
    } catch (e) {
      console.log(`ERR ${t}: ${e.message}`); ok = false
    }
  }
  console.log(ok ? '\nALL_VALID' : '\nHAS_FAILURES')
  process.exit(ok ? 0 : 1)
})()
