import fs from 'fs'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

// Polyfill browser globals for node GLTFExporter
globalThis.FileReader = class FileReader {
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buf) => {
      const base64 = Buffer.from(buf).toString('base64')
      this.result = `data:${blob.type || 'application/octet-stream'};base64,${base64}`
      if (this.onload) this.onload({ target: this })
    })
  }
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf
      if (this.onload) this.onload({ target: this })
    })
  }
}
globalThis.self = globalThis



function createFlatFourPillarStage() {
  const stageGroup = new THREE.Group()
  stageGroup.name = 'real_des_four_pillar_flat_stage'

  const floorMat = new THREE.MeshStandardMaterial({
    name: 'stage_floor_mat',
    color: '#18181b',
    roughness: 0.65,
    metalness: 0.15,
  })

  const roofMat = new THREE.MeshStandardMaterial({
    name: 'stage_roof_mat',
    color: '#09090b',
    roughness: 0.5,
    metalness: 0.4,
  })

  const pillarMat = new THREE.MeshStandardMaterial({
    name: 'stage_pillar_mat',
    color: '#71717a',
    roughness: 0.35,
    metalness: 0.85,
  })

  const lightHousingMat = new THREE.MeshStandardMaterial({
    name: 'stage_light_mat',
    color: '#27272a',
    roughness: 0.4,
    metalness: 0.7,
  })

  // 1. Flat Performance Floor (deck top at Y = 0)
  const floorThickness = 0.4
  const floorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(16.5, floorThickness, 7.0),
    floorMat
  )
  floorMesh.name = 'stage_floor_deck'
  floorMesh.position.set(0, -floorThickness / 2, 0)
  floorMesh.receiveShadow = true
  stageGroup.add(floorMesh)

  // 2. Flat Roof (bottom at Y = 6.45)
  const roofThickness = 0.35
  const roofMesh = new THREE.Mesh(
    new THREE.BoxGeometry(16.5, roofThickness, 7.0),
    roofMat
  )
  roofMesh.name = 'stage_roof'
  roofMesh.position.set(0, 6.45 + roofThickness / 2, 0)
  roofMesh.castShadow = true
  stageGroup.add(roofMesh)

  // 3. Four Supporting Corner Pillars
  const pillarHeight = 6.45
  const pillarRadius = 0.14
  const pillarPositions = [
    [-7.8, pillarHeight / 2, -3.1],
    [7.8, pillarHeight / 2, -3.1],
    [-7.8, pillarHeight / 2, 3.1],
    [7.8, pillarHeight / 2, 3.1],
  ]

  pillarPositions.forEach((pos, idx) => {
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(pillarRadius, pillarRadius, pillarHeight, 16),
      pillarMat
    )
    pillar.name = `stage_corner_pillar_0${idx + 1}`
    pillar.position.set(pos[0], pos[1], pos[2])
    pillar.castShadow = true
    pillar.receiveShadow = true
    stageGroup.add(pillar)
  })

  // 4. Overhead Stage Lights
  const lightXPositions = [-6.0, -3.6, -1.2, 1.2, 3.6, 6.0]
  const lightZPositions = [-2.2, 0, 2.2]

  lightXPositions.forEach((x, xi) => {
    lightZPositions.forEach((z, zi) => {
      const fixture = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.18, 0.22, 12),
        lightHousingMat
      )
      fixture.name = `overhead_light_fixture_${xi}_${zi}`
      fixture.position.set(x, 6.34, z)
      fixture.castShadow = true
      stageGroup.add(fixture)
    })
  })

  return stageGroup
}

const stageScene = createFlatFourPillarStage()

// Export to JSON glTF
const exporter = new GLTFExporter()
exporter.parse(
  stageScene,
  (gltf) => {
    const jsonStr = JSON.stringify(gltf, null, 2)
    const outGltfPath = 'public/library/stages/real_des_four_pillar_flat_stage_v2.gltf'
    fs.writeFileSync(outGltfPath, jsonStr)
    console.log('[Build] Successfully saved:', outGltfPath, '(', (jsonStr.length / 1024).toFixed(1), 'KB)')

    // Also write .glb if binary buffers are packed
    // In Three.js gltf format, .gltf is natively supported by useGLTF!
  },
  (err) => {
    console.error('[Build] Export error:', err)
  },
  { binary: false }
)
