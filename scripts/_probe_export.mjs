import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

const boneRoot = new THREE.Bone()
boneRoot.position.y = -5
const bone1 = new THREE.Bone()
bone1.position.y = 10
boneRoot.add(bone1)
const bone2 = new THREE.Bone()
bone2.position.y = 10
bone1.add(bone2)
const skeleton = new THREE.Skeleton([boneRoot, bone1, bone2])

const geo = new THREE.SphereGeometry(1, 16, 16)
const n = geo.attributes.position.count
const skinIndex = new Uint16Array(n * 4)
const skinWeight = new Float32Array(n * 4)
for (let i = 0; i < n; i++) { skinIndex[i * 4] = 0; skinWeight[i * 4] = 1 }
geo.setAttribute('skinIndex', new THREE.BufferAttribute(skinIndex, 4))
geo.setAttribute('skinWeight', new THREE.BufferAttribute(skinWeight, 4))
const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 })
const mesh = new THREE.SkinnedMesh(geo, mat)
mesh.bind(skeleton)

const exporter = new GLTFExporter()
console.log('parseAsync start')
try {
  const out = await exporter.parseAsync(mesh, { binary: true })
  console.log('parseAsync resolved, bytes=', out.byteLength)
  const fs = await import('node:fs')
  fs.writeFileSync('public/library/wardrobe/_exporter_probe.glb', Buffer.from(out))
  console.log('wrote probe glb')
} catch (e) {
  console.error('parseAsync ERROR:', e)
}
process.exit(0)
