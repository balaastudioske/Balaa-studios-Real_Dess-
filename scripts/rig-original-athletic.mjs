/**
 * Build the production artist from the original 4K athletic source.
 *
 * This deliberately does not read any legacy rigged-athlete export.  It keeps
 * the source athlete's geometry, material, and embedded textures, then binds
 * it to the original DESS Mixamo skeleton using the skeleton's real rest-pose
 * inverse bind matrices.  That prevents the folded/collapsed pose caused by
 * synthetic bind matrices and a second axis conversion.
 */
import fs from 'fs'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

globalThis.self = globalThis
globalThis.document = { createElementNS: () => ({ style: {} }), createElement: () => ({ style: {} }) }
globalThis.createImageBitmap = async () => ({ width: 1, height: 1, close: () => {} })
globalThis.URL = { createObjectURL: () => '', revokeObjectURL: () => {} }
globalThis.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer
      this.onload?.({ target: this })
      this.onloadend?.({ target: this })
    })
  }
}

const SOURCE_PATH = 'new dess avatar to be rigged and re modeled with 4k texture/athletic+male+3d+model+4k+texture.glb'
const SKELETON_PATH = 'newmodel dess.glb'
const OUTPUT_PATHS = [
  'public/assets/models/dess-athletic-rig-v2.glb',
  'public/assets/models/dess.glb',
]

function parseGlb(buffer) {
  if (buffer.readUInt32LE(0) !== 0x46546c67) throw new Error('Expected a GLB file')
  const jsonLength = buffer.readUInt32LE(12)
  const json = JSON.parse(buffer.toString('utf8', 20, 20 + jsonLength))
  const binHeaderOffset = 20 + jsonLength
  const binLength = buffer.readUInt32LE(binHeaderOffset)
  return { json, bin: buffer.subarray(binHeaderOffset + 8, binHeaderOffset + 8 + binLength) }
}

function buildGlb(json, bin) {
  const jsonBytes = Buffer.from(JSON.stringify(json), 'utf8')
  const jsonPadding = (4 - (jsonBytes.length % 4)) % 4
  const binPadding = (4 - (bin.length % 4)) % 4
  const paddedJson = Buffer.concat([jsonBytes, Buffer.alloc(jsonPadding, 0x20)])
  const paddedBin = Buffer.concat([bin, Buffer.alloc(binPadding)])
  const totalLength = 12 + 8 + paddedJson.length + 8 + paddedBin.length
  const header = Buffer.alloc(12)
  header.writeUInt32LE(0x46546c67, 0)
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(totalLength, 8)
  const jsonHeader = Buffer.alloc(8)
  jsonHeader.writeUInt32LE(paddedJson.length, 0)
  jsonHeader.writeUInt32LE(0x4e4f534a, 4)
  const binHeader = Buffer.alloc(8)
  binHeader.writeUInt32LE(paddedBin.length, 0)
  binHeader.writeUInt32LE(0x004e4942, 4)
  return Buffer.concat([header, jsonHeader, paddedJson, binHeader, paddedBin])
}

function accessorArray(glb, accessorIndex, Type) {
  const accessor = glb.json.accessors[accessorIndex]
  const view = glb.json.bufferViews[accessor.bufferView]
  const offset = (view.byteOffset || 0) + (accessor.byteOffset || 0)
  return new Type(glb.bin.buffer, glb.bin.byteOffset + offset, accessor.count * ({ SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[accessor.type] || 1))
}

function appendChunk(chunks, bufferViews, bytes, target) {
  const offset = chunks.reduce((total, chunk) => total + chunk.length, 0)
  const padding = (4 - (bytes.length % 4)) % 4
  chunks.push(bytes, Buffer.alloc(padding))
  bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length, ...(target ? { target } : {}) })
  return bufferViews.length - 1
}

const load = async (filePath) => {
  const file = fs.readFileSync(filePath)
  return new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength), '')
}

const source = parseGlb(fs.readFileSync(SOURCE_PATH))
const canonical = parseGlb(fs.readFileSync(SKELETON_PATH))
const canonicalRuntime = await load(SKELETON_PATH)
canonicalRuntime.scene.updateMatrixWorld(true)

const sourcePrimitive = source.json.meshes?.[0]?.primitives?.[0]
const canonicalSkin = canonical.json.skins?.[0]
if (!sourcePrimitive || !canonicalSkin) throw new Error('The source mesh or authoritative skeleton is missing')

let canonicalSkinnedMesh = null
const bonesByName = new Map()
canonicalRuntime.scene.traverse((object) => {
  if (object.isSkinnedMesh && !canonicalSkinnedMesh) canonicalSkinnedMesh = object
  if (object.isBone) bonesByName.set(object.name, object)
})
if (!canonicalSkinnedMesh || canonicalSkinnedMesh.skeleton.bones.length !== canonicalSkin.joints.length) {
  throw new Error('The authoritative DESS skeleton could not be resolved')
}

const sourcePositions = accessorArray(source, sourcePrimitive.attributes.POSITION, Float32Array)
const sourceNormals = accessorArray(source, sourcePrimitive.attributes.NORMAL, Float32Array)
const vertexCount = sourcePositions.length / 3
const sourceBounds = new THREE.Box3()
for (let i = 0; i < sourcePositions.length; i += 3) sourceBounds.expandByPoint(new THREE.Vector3(sourcePositions[i], sourcePositions[i + 1], sourcePositions[i + 2]))

const skeletonBounds = new THREE.Box3()
for (const name of ['HeadTop_End', 'LeftToe_End', 'RightToe_End']) {
  const point = new THREE.Vector3()
  bonesByName.get(name)?.getWorldPosition(point)
  skeletonBounds.expandByPoint(point)
}
const scale = skeletonBounds.getSize(new THREE.Vector3()).y / sourceBounds.getSize(new THREE.Vector3()).y
const targetFloor = skeletonBounds.min.y
const outputPositions = new Float32Array(sourcePositions.length)
const outputNormals = new Float32Array(sourceNormals.length)
for (let i = 0; i < sourcePositions.length; i += 3) {
  outputPositions[i] = sourcePositions[i] * scale
  outputPositions[i + 1] = (sourcePositions[i + 1] - sourceBounds.min.y) * scale + targetFloor
  outputPositions[i + 2] = sourcePositions[i + 2] * scale
  const normal = new THREE.Vector3(sourceNormals[i], sourceNormals[i + 1], sourceNormals[i + 2]).normalize()
  outputNormals[i] = normal.x
  outputNormals[i + 1] = normal.y
  outputNormals[i + 2] = normal.z
}

// The source athlete is intentionally retained, but its scanned/generated face
// has a visible left/right drift.  Pair the high-resolution facial surface in
// model space, average each pair's measurements, then mirror it around the
// anatomical centreline.  A spatial grid keeps this deterministic pass fast
// enough for the 108K-vertex source without relying on a legacy character.
const faceTop = skeletonBounds.max.y
const faceBottom = faceTop - 0.34
const faceIndices = []
const faceGrid = new Map()
const cellSize = 0.012
const cellKey = (x, y, z) => `${Math.round(x / cellSize)}:${Math.round(y / cellSize)}:${Math.round(z / cellSize)}`
for (let vertex = 0; vertex < vertexCount; vertex++) {
  const offset = vertex * 3
  const x = outputPositions[offset]
  const y = outputPositions[offset + 1]
  const z = outputPositions[offset + 2]
  if (y < faceBottom || y > faceTop + 0.01 || Math.abs(x) > 0.24 || z < -0.22 || z > 0.26) continue
  faceIndices.push(vertex)
  const key = cellKey(x, y, z)
  const values = faceGrid.get(key) || []
  values.push(vertex)
  faceGrid.set(key, values)
}

const pairedFaces = new Set()
let symmetricPairs = 0
for (const vertex of faceIndices) {
  if (pairedFaces.has(vertex)) continue
  const offset = vertex * 3
  const x = outputPositions[offset]
  if (Math.abs(x) < 0.003) {
    outputPositions[offset] = 0
    pairedFaces.add(vertex)
    continue
  }
  const y = outputPositions[offset + 1]
  const z = outputPositions[offset + 2]
  let match = -1
  let bestDistance = 0.0007
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
    const base = cellKey(-x + dx * cellSize, y + dy * cellSize, z + dz * cellSize)
    for (const candidate of faceGrid.get(base) || []) {
      if (candidate === vertex || pairedFaces.has(candidate)) continue
      const candidateOffset = candidate * 3
      if (outputPositions[candidateOffset] * x >= 0) continue
      const mirrorDistance =
        (outputPositions[candidateOffset] + x) ** 2 +
        (outputPositions[candidateOffset + 1] - y) ** 2 +
        (outputPositions[candidateOffset + 2] - z) ** 2
      if (mirrorDistance < bestDistance) {
        bestDistance = mirrorDistance
        match = candidate
      }
    }
  }
  if (match < 0) continue
  const candidateOffset = match * 3
  const halfWidth = (Math.abs(x) + Math.abs(outputPositions[candidateOffset])) / 2
  const averageY = (y + outputPositions[candidateOffset + 1]) / 2
  const averageZ = (z + outputPositions[candidateOffset + 2]) / 2
  const sign = Math.sign(x)
  outputPositions[offset] = sign * halfWidth
  outputPositions[offset + 1] = averageY
  outputPositions[offset + 2] = averageZ
  outputPositions[candidateOffset] = -sign * halfWidth
  outputPositions[candidateOffset + 1] = averageY
  outputPositions[candidateOffset + 2] = averageZ
  pairedFaces.add(vertex)
  pairedFaces.add(match)
  symmetricPairs++
}

// Match the artist face envelope to the reference profile used elsewhere in
// the project: 13.2% of body height tall and 8.8% wide.  This is a gentle
// envelope correction, not a replacement face or a destructive re-topology.
const faceProfile = { height: 0.132 * skeletonBounds.getSize(new THREE.Vector3()).y, width: 0.088 * skeletonBounds.getSize(new THREE.Vector3()).y }
const faceBounds = new THREE.Box3()
for (const vertex of faceIndices) {
  const offset = vertex * 3
  faceBounds.expandByPoint(new THREE.Vector3(outputPositions[offset], outputPositions[offset + 1], outputPositions[offset + 2]))
}
const faceSize = faceBounds.getSize(new THREE.Vector3())
const faceCenter = faceBounds.getCenter(new THREE.Vector3())
const widthScale = THREE.MathUtils.clamp(faceProfile.width / Math.max(faceSize.x, 0.001), 0.92, 1.08)
const heightScale = THREE.MathUtils.clamp(faceProfile.height / Math.max(faceSize.y, 0.001), 0.94, 1.06)
for (const vertex of faceIndices) {
  const offset = vertex * 3
  outputPositions[offset] *= widthScale
  outputPositions[offset + 1] = faceCenter.y + (outputPositions[offset + 1] - faceCenter.y) * heightScale
}
console.log(`Symmetrized ${symmetricPairs.toLocaleString()} face pairs; calibrated face to ${faceProfile.width.toFixed(3)}m wide × ${faceProfile.height.toFixed(3)}m high.`)

const jointBones = canonicalSkin.joints.map((nodeIndex) => {
  const name = canonical.json.nodes[nodeIndex].name
  const bone = bonesByName.get(name)
  if (!bone) throw new Error(`Missing skeleton joint: ${name}`)
  const position = new THREE.Vector3()
  bone.getWorldPosition(position)
  return { name, bone, position }
})
const skinIndices = new Uint16Array(vertexCount * 4)
const skinWeights = new Float32Array(vertexCount * 4)

// Explicit anatomical zones replace all proximity-based auto-weighting.  The
// athlete is a symmetric T-pose, so a vertex can only be influenced by the
// contiguous joints of its own anatomical chain; never by the opposite limb.
const jointIndex = new Map(jointBones.map(({ name }, index) => [name, index]))
const indexFor = (name) => {
  const index = jointIndex.get(name)
  if (index === undefined) throw new Error(`Required DESS joint not found: ${name}`)
  return index
}
const setInfluences = (vertex, influences) => {
  const offset = vertex * 4
  const total = influences.reduce((sum, [, weight]) => sum + weight, 0)
  for (let slot = 0; slot < 4; slot++) {
    const influence = influences[slot]
    skinIndices[offset + slot] = influence ? indexFor(influence[0]) : 0
    skinWeights[offset + slot] = influence && total > 0 ? influence[1] / total : 0
  }
}
const blend = (lower, upper, amount) => [[lower, 1 - amount], [upper, amount]]
const smooth = (value, start, end) => THREE.MathUtils.smoothstep(value, start, end)
for (let vertex = 0; vertex < vertexCount; vertex++) {
  const offset = vertex * 3
  const x = outputPositions[offset]
  const y = outputPositions[offset + 1]
  const side = x >= 0 ? 'Left' : 'Right'
  const armDistance = Math.abs(x)

  if (y >= 1.455) {
    setInfluences(vertex, [['Head', 1]])
  } else if (y >= 1.20 && armDistance > 0.16) {
    if (armDistance < 0.30) setInfluences(vertex, blend('Spine2', `${side}Shoulder`, smooth(armDistance, 0.16, 0.30)))
    else if (armDistance < 0.54) setInfluences(vertex, blend(`${side}Shoulder`, `${side}Arm`, smooth(armDistance, 0.30, 0.54)))
    else if (armDistance < 0.75) setInfluences(vertex, blend(`${side}Arm`, `${side}ForeArm`, smooth(armDistance, 0.54, 0.75)))
    else setInfluences(vertex, blend(`${side}ForeArm`, `${side}Hand`, smooth(armDistance, 0.75, 0.88)))
  } else if (y < 0.92) {
    if (y < 0.13) setInfluences(vertex, blend(`${side}Foot`, `${side}ToeBase`, smooth(y, 0.03, 0.13)))
    else if (y < 0.52) setInfluences(vertex, blend(`${side}Foot`, `${side}Leg`, smooth(y, 0.13, 0.52)))
    else setInfluences(vertex, blend(`${side}Leg`, `${side}UpLeg`, smooth(y, 0.52, 0.90)))
  } else if (y < 1.06) {
    setInfluences(vertex, blend('Hips', 'Spine', smooth(y, 0.92, 1.06)))
  } else if (y < 1.20) {
    setInfluences(vertex, blend('Spine', 'Spine1', smooth(y, 1.06, 1.20)))
  } else if (y < 1.37) {
    setInfluences(vertex, blend('Spine1', 'Spine2', smooth(y, 1.20, 1.37)))
  } else {
    setInfluences(vertex, blend('Spine2', 'Neck', smooth(y, 1.37, 1.455)))
  }
}

const inverseBindMatrices = new Float32Array(canonicalSkinnedMesh.skeleton.boneInverses.length * 16)
canonicalSkinnedMesh.skeleton.boneInverses.forEach((matrix, index) => matrix.toArray(inverseBindMatrices, index * 16))

// Preserve source texture/image buffer views, and append only the rig-specific data.
const chunks = [source.bin]
const bufferViews = structuredClone(source.json.bufferViews)
const positionView = appendChunk(chunks, bufferViews, Buffer.from(outputPositions.buffer), 34962)
const normalView = appendChunk(chunks, bufferViews, Buffer.from(outputNormals.buffer), 34962)
const jointsView = appendChunk(chunks, bufferViews, Buffer.from(skinIndices.buffer), 34962)
const weightsView = appendChunk(chunks, bufferViews, Buffer.from(skinWeights.buffer), 34962)
const inverseBindView = appendChunk(chunks, bufferViews, Buffer.from(inverseBindMatrices.buffer), 34962)
const accessors = structuredClone(source.json.accessors)
const positionAccessor = accessors.push({ bufferView: positionView, componentType: 5126, count: vertexCount, type: 'VEC3' }) - 1
const normalAccessor = accessors.push({ bufferView: normalView, componentType: 5126, count: vertexCount, type: 'VEC3' }) - 1
const jointsAccessor = accessors.push({ bufferView: jointsView, componentType: 5123, count: vertexCount, type: 'VEC4' }) - 1
const weightsAccessor = accessors.push({ bufferView: weightsView, componentType: 5126, count: vertexCount, type: 'VEC4' }) - 1
const inverseBindAccessor = accessors.push({ bufferView: inverseBindView, componentType: 5126, count: canonicalSkin.joints.length, type: 'MAT4' }) - 1

const nodes = structuredClone(canonical.json.nodes.slice(0, 74))
nodes[0].children = (nodes[0].children || []).filter((nodeIndex) => nodeIndex < 74)
const meshNodeIndex = nodes.length
nodes[0].children.push(meshNodeIndex)
nodes.push({ name: 'DessAthleticBody4K', mesh: 0, skin: 0 })
const primitive = structuredClone(sourcePrimitive)
primitive.attributes = {
  ...primitive.attributes,
  POSITION: positionAccessor,
  NORMAL: normalAccessor,
  JOINTS_0: jointsAccessor,
  WEIGHTS_0: weightsAccessor,
}

const output = {
  asset: { version: '2.0', generator: 'BALAA original-athletic rig pipeline v2' },
  scene: 0,
  scenes: [{ name: 'BALAA Artist', nodes: [0] }],
  nodes,
  skins: [{ joints: canonicalSkin.joints, skeleton: canonicalSkin.skeleton, inverseBindMatrices: inverseBindAccessor }],
  meshes: [{ name: 'DessAthleticBody4K', primitives: [primitive] }],
  materials: structuredClone(source.json.materials || []),
  textures: structuredClone(source.json.textures || []),
  images: structuredClone(source.json.images || []),
  samplers: structuredClone(source.json.samplers || []),
  accessors,
  bufferViews,
  buffers: [{ byteLength: chunks.reduce((total, chunk) => total + chunk.length, 0) }],
  extras: {
    source: SOURCE_PATH,
    skeleton: SKELETON_PATH,
    legacyRiggedAthleteUsed: false,
    rigMethod: 'original inverse bind matrices with explicit same-side anatomical weights',
    face: 'left-right paired symmetry and reference-envelope calibration',
  },
}
const finalGlb = buildGlb(output, Buffer.concat(chunks))
for (const outputPath of OUTPUT_PATHS) fs.writeFileSync(outputPath, finalGlb)
console.log(`Rigged ${vertexCount.toLocaleString()} original-athlete vertices to ${jointBones.length} original DESS joints.`)
console.log(`Wrote ${OUTPUT_PATHS.join(' and ')}`)
