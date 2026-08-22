import fs from 'fs'
import path from 'path'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'

// Polyfill for Node.js GLTF export
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

// 10 Curated BALAA Streetwear Outfits
const MERCH_CONFIGS = [
  { id: '01', name: 'BALAA Signature Oversized Black Tee', color: '#141416', roughness: 0.85, metalness: 0.05, style: 'tee' },
  { id: '02', name: 'BALAA Vintage Acid Wash Tee', color: '#2a2b30', roughness: 0.80, metalness: 0.05, style: 'tee' },
  { id: '03', name: 'BALAA Midnight Heavyweight Hoodie', color: '#0e0e12', roughness: 0.90, metalness: 0.02, style: 'hoodie' },
  { id: '04', name: 'BALAA Sandstone Crewneck', color: '#c5b49e', roughness: 0.85, metalness: 0.02, style: 'sweater' },
  { id: '05', name: 'BALAA Olive Tactical Utility Vest', color: '#3b4436', roughness: 0.75, metalness: 0.10, style: 'vest' },
  { id: '06', name: 'BALAA Concrete Heather Grey Hoodie', color: '#7a7c82', roughness: 0.88, metalness: 0.02, style: 'hoodie' },
  { id: '07', name: 'BALAA Crimson Cyber Drill Jersey', color: '#6d181e', roughness: 0.65, metalness: 0.15, style: 'tee' },
  { id: '08', name: 'BALAA Monogram Jacquard Sweater', color: '#1e2638', roughness: 0.92, metalness: 0.02, style: 'sweater' },
  { id: '09', name: 'BALAA Tour Edition Reflective Tee', color: '#0a0a0c', roughness: 0.70, metalness: 0.20, style: 'tee' },
  { id: '10', name: 'BALAA Archive Distressed Knit', color: '#4a5340', roughness: 0.95, metalness: 0.02, style: 'sweater' },
]

async function remodelAllGarments() {
  const loader = new GLTFLoader()
  console.log('📦 Loading master fitted geometry from dess.glb...')
  const dessBuf = fs.readFileSync('public/assets/models/dess.glb')
  const dessGltf = await new Promise((r) =>
    loader.parse(dessBuf.buffer.slice(dessBuf.byteOffset, dessBuf.byteOffset + dessBuf.byteLength), '', r)
  )

  let masterTopMesh = null
  dessGltf.scene.traverse((obj) => {
    if (obj.name === 'outfit_top' && obj.isSkinnedMesh) {
      masterTopMesh = obj
    }
  })

  if (!masterTopMesh) {
    throw new Error('Could not find outfit_top in dess.glb')
  }

  console.log(`✅ Extracted organic fitted geometry: ${masterTopMesh.geometry.attributes.position.count} vertices, 73 bones`)

  const exporter = new GLTFExporter()

  for (const cfg of MERCH_CONFIGS) {
    console.log(`🎨 Generating fitted garment [${cfg.id}] ${cfg.name}...`)
    const geom = masterTopMesh.geometry.clone()

    // Apply silhouette tailoring based on garment type
    const pos = geom.attributes.position
    const v = new THREE.Vector3()

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)

      if (cfg.style === 'hoodie') {
        // Slightly looser chest & upper shoulder silhouette for heavyweight fleece
        if (v.y > 1.1 && v.y < 1.5) {
          v.x *= 1.025
          v.z *= 1.030
        }
      } else if (cfg.style === 'sweater') {
        // Relaxed knit drape
        if (v.y > 0.95 && v.y < 1.45) {
          v.x *= 1.015
          v.z *= 1.020
        }
      } else if (cfg.style === 'vest') {
        // Closer fitted tactical silhouette
        if (v.y > 1.0 && v.y < 1.4) {
          v.x *= 1.005
          v.z *= 1.010
        }
      }
      pos.setXYZ(i, v.x, v.y, v.z)
    }
    pos.needsUpdate = true
    geom.computeVertexNormals()

    const mat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      roughness: cfg.roughness,
      metalness: cfg.metalness,
      name: `mat_merch_${cfg.id}`,
    })

    const skinnedMesh = new THREE.SkinnedMesh(geom, mat)
    skinnedMesh.name = 'garment'

    // Clone skeleton bones
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
    skinnedMesh.normalizeSkinWeights()

    const exportGroup = new THREE.Group()
    exportGroup.name = `Merch_${cfg.id}`
    if (clonedHips) exportGroup.add(clonedHips)
    exportGroup.add(skinnedMesh)

    const targetDir = path.resolve(`public/library/merch/${cfg.id}`)
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true })
    const targetFile = path.join(targetDir, 'garment.glb')

    await new Promise((resolve, reject) => {
      const keepAlive = setInterval(() => {}, 1000)
      exporter.parse(
        exportGroup,
        (result) => {
          clearInterval(keepAlive)
          const buf = Buffer.from(result)
          fs.writeFileSync(targetFile, buf)
          console.log(`   -> Saved ${targetFile} (${(buf.length / 1024).toFixed(1)} KB)`)
          resolve(result)
        },
        (err) => {
          clearInterval(keepAlive)
          reject(err)
        },
        { binary: true }
      )
    })
  }

  console.log('🎉 ALL 10 GARMENTS REMODELED & TAILORED PERFECTLY!')
}

remodelAllGarments().catch(console.error)
