import fs from 'node:fs'
import path from 'node:path'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

globalThis.self = globalThis
globalThis.FileReader = class { readAsArrayBuffer() { if (this.onload) this.onload({ target: { result: new ArrayBuffer(0) } }); if (this.onloadend) this.onloadend({ target: this }) } }
THREE.FileLoader.prototype.load = (url, onLoad, _, onError) => {
  try { const b = fs.readFileSync(path.isAbsolute(url) ? url : path.join(process.cwd(), url)); onLoad(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)) } catch (e) { if (onError) onError(e) }
}

async function check(file) {
  const g = await new Promise((res, rej) => new GLTFLoader().load(file, res, undefined, rej))
  let skinned = null, skeleton = null, boneCount = 0
  let skinIndex = false, skinWeight = false, hasGeometry = false
  g.scene.traverse((o) => {
    if (o.isSkinnedMesh) { skinned = o; hasGeometry = true }
    if (o.skeleton) { skeleton = o.skeleton; boneCount = skeleton.bones.length }
  })
  if (skinned) {
    const g2 = skinned.geometry
    skinIndex = !!g2.getAttribute('skinIndex')
    skinWeight = !!g2.getAttribute('skinWeight')
    hasGeometry = !!g2.getAttribute('position')
  }
  const ok = skinned && skeleton && skinIndex && skinWeight
  console.log(`${file}: skinned=${!!skinned} skeleton=${!!skeleton} bones=${boneCount} skinIndex=${skinIndex} skinWeight=${skinWeight} bindMode=${skinned ? skinned.bindMode : 'n/a'} -> ${ok ? 'VALID' : 'INVALID'}`)
  return ok
}
let allOk = true
for (const f of ['public/library/wardrobe/shirt_final.glb', 'public/library/merch/01/garment.glb', 'public/library/merch/04/garment.glb', 'public/library/merch/10/garment.glb']) {
  try { if (!await check(f)) allOk = false } catch (e) { console.log(`${f}: ERROR ${e.message}`); allOk = false }
}
console.log(allOk ? 'ALL GLBs VALID: skinned + skeleton + skin weights present' : 'SOME GLBs INVALID')
process.exit(0)
