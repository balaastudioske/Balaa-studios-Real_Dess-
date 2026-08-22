/** Converts an intake BVH into a portable skeleton/animation GLB reference. */
import fs from 'node:fs'
import path from 'node:path'
import * as THREE from 'three'
import { BVHLoader } from 'three/examples/jsm/loaders/BVHLoader.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

class NodeFileReader {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((result) => { this.result = result; this.onload?.({ target: this }); this.onloadend?.({ target: this }) }) }
  readAsDataURL(blob) { blob.arrayBuffer().then((result) => { this.result = `data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(result).toString('base64')}`; this.onload?.({ target: this }); this.onloadend?.({ target: this }) }) }
}
globalThis.FileReader = NodeFileReader

const [source, destination] = process.argv.slice(2)
if (!source || !destination) {
  console.error('Usage: node scripts/convert-bvh-reference.mjs <source.bvh> <destination.glb>')
  process.exit(1)
}

const { skeleton, clip } = new BVHLoader().parse(fs.readFileSync(source, 'utf8'))
const root = skeleton.bones[0]
const scene = new THREE.Group()
scene.name = path.basename(source, '.bvh')
scene.add(root)

const result = await new Promise((resolve, reject) => new GLTFExporter().parse(
  scene,
  resolve,
  reject,
  { binary: true, animations: [clip] },
))
fs.mkdirSync(path.dirname(destination), { recursive: true })
fs.writeFileSync(destination, Buffer.from(result))
console.log(`Converted ${source} -> ${destination} (${skeleton.bones.length} joints, ${clip.duration.toFixed(3)}s)`)
