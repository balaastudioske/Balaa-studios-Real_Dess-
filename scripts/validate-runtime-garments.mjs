/**
 * Verifies that every shipped wearable is bound to the live Dess skeleton and
 * that at least one weighted vertex deforms when the shoulder is posed.
 *
 * Usage: node scripts/validate-runtime-garments.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'

globalThis.self = globalThis
THREE.FileLoader.prototype.load = function loadLocal(url, onLoad, _onProgress, onError) {
  try {
    const file = path.isAbsolute(url) ? url : path.join(process.cwd(), url)
    const source = fs.readFileSync(file)
    onLoad(source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength))
  } catch (error) {
    onError?.(error)
  }
}

function load(url) {
  return new Promise((resolve, reject) => new GLTFLoader().load(url, resolve, undefined, reject))
}

function firstSkinnedMesh(scene) {
  let result = null
  scene.traverse((node) => {
    if (!result && node.isSkinnedMesh) result = node
  })
  return result
}

function maxPoseDisplacement(mesh) {
  const position = mesh.geometry.getAttribute('position')
  const before = new THREE.Vector3()
  const after = new THREE.Vector3()
  const sampleCount = Math.min(position.count, 1024)
  const step = Math.max(1, Math.floor(position.count / sampleCount))
  const pose = []
  const sampleIndices = []
  for (let sample = 0; sample < sampleCount; sample += 1) {
    const index = Math.min(sample * step, position.count - 1)
    sampleIndices.push(index)
    before.fromBufferAttribute(position, index)
    mesh.applyBoneTransform(index, before)
    pose.push(before.clone())
  }
  const shoulder = mesh.skeleton.bones.find((bone) => bone.name === 'LeftShoulder')
  if (!shoulder) throw new Error('Live Dess skeleton is missing LeftShoulder')
  shoulder.rotation.z += 0.65
  mesh.skeleton.bones[0].updateWorldMatrix(true, true)
  mesh.skeleton.update()
  let max = 0
  for (let sample = 0; sample < sampleCount; sample += 1) {
    const index = sampleIndices[sample]
    after.fromBufferAttribute(position, index)
    mesh.applyBoneTransform(index, after)
    max = Math.max(max, after.distanceTo(pose[sample]))
  }
  return max
}

const avatarGltf = await load('public/assets/models/dess.glb')
const avatar = clone(avatarGltf.scene)
avatar.updateMatrixWorld(true)
const avatarMesh = firstSkinnedMesh(avatar)
if (!avatarMesh?.skeleton) throw new Error('Dess has no master skeleton')

const garmentPaths = Array.from({ length: 10 }, (_, index) => (
  `public/library/merch/${String(index + 1).padStart(2, '0')}/garment.glb`
))
const failures = []
for (const garmentPath of garmentPaths) {
  const garmentGltf = await load(garmentPath)
  const garment = clone(garmentGltf.scene)
  garment.updateMatrixWorld(true)
  const mesh = firstSkinnedMesh(garment)
  if (!mesh?.geometry.getAttribute('skinIndex') || !mesh.geometry.getAttribute('skinWeight')) {
    failures.push(`${garmentPath}: missing skin weights`)
    continue
  }
  mesh.bind(avatarMesh.skeleton, mesh.bindMatrix)
  const displacement = maxPoseDisplacement(mesh)
  if (!Number.isFinite(displacement) || displacement < 0.00001) {
    failures.push(`${garmentPath}: did not deform with LeftShoulder (${displacement})`)
    continue
  }
  console.log(`${garmentPath}: joints=${mesh.skeleton.bones.length} shoulderDisplacement=${displacement.toFixed(5)} -> PASS`)
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}
