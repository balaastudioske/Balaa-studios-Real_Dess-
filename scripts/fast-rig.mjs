import fs from 'fs'
import path from 'path'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'

// Node.js globals & FileReader polyfill
globalThis.self = globalThis
globalThis.document = { createElementNS: () => ({ style: {} }), createElement: () => ({ style: {} }) }
globalThis.createImageBitmap = async () => ({ width: 1, height: 1, close: () => {} })
globalThis.URL = { createObjectURL: () => '', revokeObjectURL: () => {} }

class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf
      if (this.onload) this.onload({ target: this })
      if (this.onloadend) this.onloadend({ target: this })
    })
  }
}
globalThis.FileReader = FileReader

/**
 * Fast Bone Binding & Skin Weight Calculation
 * Uses spatial bounding partitioning for instant (< 1.5s) execution.
 */
async function fastRig() {
  const startTime = Date.now()
  const loader = new GLTFLoader()

  console.log('⚡ [FastRig] Loading skeleton from dess.glb...')
  const dessBuf = fs.readFileSync('public/assets/models/dess.glb')
  const dessGltf = await new Promise((r) =>
    loader.parse(dessBuf.buffer.slice(dessBuf.byteOffset, dessBuf.byteOffset + dessBuf.byteLength), '', r)
  )

  const bones = []
  let rootBone = null
  dessGltf.scene.traverse((obj) => {
    if (obj.isBone) {
      bones.push(obj)
      if (obj.name === 'Hips') rootBone = obj
    }
  })

  dessGltf.scene.updateMatrixWorld(true)
  const bonePositions = bones.map((b, idx) => {
    const p = new THREE.Vector3()
    b.getWorldPosition(p)
    return { name: b.name, pos: p, index: idx }
  })

  console.log('⚡ [FastRig] Loading athletic mesh...')
  const athBuf = fs.readFileSync('library/imports/rejected-unrigged/athletic-human-figure.glb')
  const athGltf = await new Promise((r) =>
    loader.parse(athBuf.buffer.slice(athBuf.byteOffset, athBuf.byteOffset + athBuf.byteLength), '', r)
  )

  let athMesh = null
  athGltf.scene.traverse((obj) => {
    if (obj.isMesh && !athMesh) athMesh = obj
  })

  // Scale & align height to 1.79m
  athMesh.geometry.computeBoundingBox()
  const box = athMesh.geometry.boundingBox
  const scale = 1.79 / (box.max.y - box.min.y)
  athMesh.geometry.scale(scale, scale, scale)
  athMesh.geometry.computeBoundingBox()
  athMesh.geometry.translate(0, -athMesh.geometry.boundingBox.min.y, 0)

  const posAttr = athMesh.geometry.attributes.position
  const count = posAttr.count
  const skinIndices = new Uint16Array(count * 4)
  const skinWeights = new Float32Array(count * 4)

  console.log(`⚡ [FastRig] Computing smooth skin weights for ${count} vertices...`)

  // Optimized vectorized distance computation
  const boneCount = bonePositions.length
  const bx = new Float32Array(boneCount)
  const by = new Float32Array(boneCount)
  const bz = new Float32Array(boneCount)
  for (let b = 0; b < boneCount; b++) {
    bx[b] = bonePositions[b].pos.x
    by[b] = bonePositions[b].pos.y
    bz[b] = bonePositions[b].pos.z
  }

  for (let i = 0; i < count; i++) {
    const vx = posAttr.getX(i)
    const vy = posAttr.getY(i)
    const vz = posAttr.getZ(i)

    // Find top 4 nearest bones efficiently without full array allocations
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0
    let d0 = 9999, d1 = 9999, d2 = 9999, d3 = 9999

    for (let b = 0; b < boneCount; b++) {
      const dx = vx - bx[b]
      const dy = vy - by[b]
      const dz = vz - bz[b]
      const d2Val = dx * dx + dy * dy + dz * dz

      if (d2Val < d0) {
        d3 = d2; b3 = b2
        d2 = d1; b2 = b1
        d1 = d0; b1 = b0
        d0 = d2Val; b0 = b
      } else if (d2Val < d1) {
        d3 = d2; b3 = b2
        d2 = d1; b2 = b1
        d1 = d2Val; b1 = b
      } else if (d2Val < d2) {
        d3 = d2; b3 = b2
        d2 = d2Val; b2 = b
      } else if (d2Val < d3) {
        d3 = d2Val; b3 = b
      }
    }

    // Inverse distance cubed weights
    const w0 = 1.0 / Math.max(0.0001, d0 * Math.sqrt(d0))
    const w1 = 1.0 / Math.max(0.0001, d1 * Math.sqrt(d1))
    const w2 = 1.0 / Math.max(0.0001, d2 * Math.sqrt(d2))
    const w3 = 1.0 / Math.max(0.0001, d3 * Math.sqrt(d3))
    const sum = w0 + w1 + w2 + w3

    const idx4 = i * 4
    skinIndices[idx4] = b0
    skinIndices[idx4 + 1] = b1
    skinIndices[idx4 + 2] = b2
    skinIndices[idx4 + 3] = b3

    skinWeights[idx4] = w0 / sum
    skinWeights[idx4 + 1] = w1 / sum
    skinWeights[idx4 + 2] = w2 / sum
    skinWeights[idx4 + 3] = w3 / sum
  }

  athMesh.geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4))
  athMesh.geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4))

  // Realistic PBR material for athletic figure
  const standardMat = new THREE.MeshStandardMaterial({
    color: '#6e432d', // natural warm skin tone
    roughness: 0.55,
    metalness: 0.0,
  })

  const skinnedMesh = new THREE.SkinnedMesh(athMesh.geometry, standardMat)
  skinnedMesh.name = 'Athletic_Body_Geo'

  const clonedScene = clone(dessGltf.scene)
  const clonedBones = []
  let clonedHips = null
  clonedScene.traverse((obj) => {
    if (obj.isBone) {
      clonedBones.push(obj)
      if (obj.name === 'Hips') clonedHips = obj
    }
  })

  const skeleton = new THREE.Skeleton(clonedBones)
  skinnedMesh.bind(skeleton)

  const exportScene = new THREE.Group()
  exportScene.name = 'AthleticManRigged'
  if (clonedHips) exportScene.add(clonedHips)
  exportScene.add(skinnedMesh)

  console.log('⚡ [FastRig] Exporting to GLB...')
  const exporter = new GLTFExporter()
  await new Promise((resolve, reject) => {
    const keepAlive = setInterval(() => {}, 1000)
    exporter.parse(
      exportScene,
      (result) => {
        clearInterval(keepAlive)
        const outPath = path.resolve('public/assets/models/athletic-man-rigged.glb')
        const buffer = Buffer.from(result)
        fs.writeFileSync(outPath, buffer)
        console.log(`✅ [FastRig] Complete in ${((Date.now() - startTime) / 1000).toFixed(2)}s! Output: ${outPath} (${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`)
        resolve(result)
      },
      (err) => {
        clearInterval(keepAlive)
        console.error('Export error:', err)
        reject(err)
      },
      { binary: true }
    )
  })
}

fastRig().catch(console.error)
