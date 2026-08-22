import fs from 'fs'
import path from 'path'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'

// Node.js globals
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

async function rig() {
  const loader = new GLTFLoader()

  console.log('1. Loading authoritative skeleton from dess.glb...')
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
  console.log('   Found', bones.length, 'bones in dess.glb skeleton')

  console.log('2. Loading athletic figure mesh...')
  const athBuf = fs.readFileSync('library/imports/rejected-unrigged/athletic-human-figure.glb')
  const athGltf = await new Promise((r) =>
    loader.parse(athBuf.buffer.slice(athBuf.byteOffset, athBuf.byteOffset + athBuf.byteLength), '', r)
  )

  let athMesh = null
  athGltf.scene.traverse((obj) => {
    if (obj.isMesh && !athMesh) athMesh = obj
  })

  athMesh.geometry.computeBoundingBox()
  const athBox = athMesh.geometry.boundingBox
  const athHeight = athBox.max.y - athBox.min.y
  const targetHeight = 1.79
  const scaleFactor = targetHeight / athHeight

  athMesh.geometry.scale(scaleFactor, scaleFactor, scaleFactor)
  athMesh.geometry.computeBoundingBox()
  const yOffset = -athMesh.geometry.boundingBox.min.y
  athMesh.geometry.translate(0, yOffset, 0)
  athMesh.geometry.computeBoundingBox()

  dessGltf.scene.updateMatrixWorld(true)
  const boneWorldPositions = bones.map((b, idx) => {
    const p = new THREE.Vector3()
    b.getWorldPosition(p)
    return { name: b.name, bone: b, pos: p, index: idx }
  })

  const posAttr = athMesh.geometry.attributes.position
  const vertCount = posAttr.count
  const skinIndices = new Uint16Array(vertCount * 4)
  const skinWeights = new Float32Array(vertCount * 4)

  console.log('3. Calculating skin weights for', vertCount, 'vertices...')

  for (let i = 0; i < vertCount; i++) {
    const vx = posAttr.getX(i)
    const vy = posAttr.getY(i)
    const vz = posAttr.getZ(i)
    const vPos = new THREE.Vector3(vx, vy, vz)

    const distances = boneWorldPositions.map((b) => ({
      index: b.index,
      dist: vPos.distanceTo(b.pos),
      name: b.name,
    }))

    distances.sort((a, b) => a.dist - b.dist)
    const nearest = distances.slice(0, 4)

    const power = 3.0
    const invDists = nearest.map((n) => 1.0 / Math.pow(Math.max(0.03, n.dist), power))
    const totalInv = invDists.reduce((acc, v) => acc + v, 0)

    for (let k = 0; k < 4; k++) {
      skinIndices[i * 4 + k] = nearest[k].index
      skinWeights[i * 4 + k] = invDists[k] / totalInv
    }
  }

  athMesh.geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4))
  athMesh.geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4))

  const standardMat = new THREE.MeshStandardMaterial({
    color: '#cbd5e1',
    roughness: 0.4,
    metalness: 0.1,
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

  console.log('4. Exporting rigged athletic figure to GLB...')
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
        console.log('5. Successfully saved rigged GLB to:', outPath, 'Size:', (buffer.length / (1024 * 1024)).toFixed(2), 'MB')
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

rig().catch(console.error)
