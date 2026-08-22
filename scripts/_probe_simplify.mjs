import fs from 'node:fs'
import path from 'node:path'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier.js'

globalThis.self = globalThis
globalThis.FileReader = class { readAsArrayBuffer() { if (this.onload) this.onload({ target: { result: new ArrayBuffer(0) } }) } }
THREE.FileLoader.prototype.load = (url, onLoad, _, onError) => {
  try { const b = fs.readFileSync(path.isAbsolute(url) ? url : path.join(process.cwd(), url)); onLoad(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)) } catch (e) { if (onError) onError(e) }
}

const loader = new GLTFLoader()
const g = await new Promise((res, rej) => loader.load('public/library/garments/shirt.glb', res, undefined, rej))
let m = null
g.scene.traverse((c) => { if (c.isMesh && !m) m = c })
const geo = m.geometry
const beforeV = geo.attributes.position.count
const beforeT = geo.index ? geo.index.count / 3 : beforeV / 3
console.log(`before: verts=${beforeV} tris=${beforeT}`)
const mod = new SimplifyModifier()
const remove = 50000
const t0 = Date.now()
const out = mod.modify(geo, remove)
const dt = Date.now() - t0
console.log(`after remove=${remove}: verts=${out.attributes.position.count} tris=${out.index ? out.index.count/3 : out.attributes.position.count/3} time=${dt}ms`)
process.exit(0)
