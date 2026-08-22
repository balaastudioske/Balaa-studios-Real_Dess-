import fs from 'node:fs'
import path from 'node:path'

// ---------------------------------------------------------------------------
// BALAA STUDIOS — Avatar Remodel via GLB Binary Patching
//
// Modifies bone default scales directly in the GLB JSON chunk.
// This preserves ALL textures, morph targets, animations, and skin weights.
// ---------------------------------------------------------------------------

const workspace = process.cwd()
const sourcePath = path.join(workspace, 'newmodel dess.glb')
const v1Path = path.join(workspace, 'public', 'library', 'avatars', 'MasterAvatar_V1.glb')
const v2Path = path.join(workspace, 'public', 'library', 'avatars', 'MasterAvatar_V2.glb')

// Also copy to the active runtime path
const activePath = path.join(workspace, 'public', 'assets', 'models', 'dess.glb')

console.log('=== BALAA STUDIOS — Avatar Remodel Pipeline ===')

// 1. Read source GLB
const source = fs.readFileSync(sourcePath)
const jsonLength = source.readUInt32LE(12)
const jsonStart = 20
const jsonEnd = jsonStart + jsonLength
const doc = JSON.parse(source.subarray(jsonStart, jsonEnd).toString('utf8').trim())

// 2. Backup original as V1
fs.mkdirSync(path.dirname(v1Path), { recursive: true })
fs.copyFileSync(sourcePath, v1Path)
console.log('✔ Backed up original avatar → MasterAvatar_V1.glb')

// 3. Apply reference-matched bone scales
// Derived from front/back/left/right orthographic reference views:
// - Athletic V-taper: wide shoulders, broad chest, narrow waist
// - Muscular arms and legs with defined musculature
// - Slightly narrow elongated head, strong jawline, thick neck

const BONE_SCALES = {
  // Torso — V-taper silhouette
  'LeftShoulder':  [1.20, 1.0, 1.0],   // Wide prominent shoulders
  'RightShoulder': [1.20, 1.0, 1.0],
  'Spine2':        [1.15, 1.0, 1.12],   // Broad chest, deeper torso
  'Spine1':        [1.02, 1.0, 1.02],   // Slight transition
  'Spine':         [0.92, 1.0, 0.92],   // Tight waist for V-taper

  // Head & Neck
  'Neck':          [1.12, 1.0, 1.12],   // Thick muscular neck
  'Head':          [0.95, 1.02, 1.0],   // Narrower, slightly taller head

  // Arms — muscular definition
  'LeftArm':       [1.25, 1.0, 1.25],   // Muscular upper arms
  'RightArm':      [1.25, 1.0, 1.25],
  'LeftForeArm':   [1.15, 1.0, 1.15],   // Athletic forearms
  'RightForeArm':  [1.15, 1.0, 1.15],

  // Legs — athletic build
  'LeftUpLeg':     [1.15, 1.0, 1.15],   // Muscular thighs
  'RightUpLeg':    [1.15, 1.0, 1.15],
  'LeftLeg':       [1.10, 1.0, 1.10],   // Defined calves
  'RightLeg':      [1.10, 1.0, 1.10],
}

let modCount = 0
for (const node of doc.nodes) {
  if (node.name && BONE_SCALES[node.name]) {
    node.scale = BONE_SCALES[node.name]
    console.log(`  ✔ ${node.name} → scale [${node.scale.join(', ')}]`)
    modCount++
  }
}
console.log(`\nModified ${modCount} bones`)

// 4. Re-pack GLB binary
const json = Buffer.from(JSON.stringify(doc))
const paddedJsonLength = Math.ceil(json.length / 4) * 4
const binChunkStart = jsonEnd
const binChunkSize = source.length - binChunkStart

const output = Buffer.alloc(12 + 8 + paddedJsonLength + binChunkSize)

// GLB header
output.writeUInt32LE(0x46546c67, 0)  // magic "glTF"
output.writeUInt32LE(2, 4)            // version 2
output.writeUInt32LE(output.length, 8) // total length

// JSON chunk header
output.writeUInt32LE(paddedJsonLength, 12)
output.writeUInt32LE(0x4e4f534a, 16)  // "JSON"

// JSON chunk data (padded with spaces)
json.copy(output, 20)
output.fill(0x20, 20 + json.length, 20 + paddedJsonLength)

// BIN chunk (copied verbatim — all textures, geometry, animations preserved)
source.copy(output, 20 + paddedJsonLength, binChunkStart)

// 5. Write outputs
fs.writeFileSync(v2Path, output)
console.log(`\n✔ MasterAvatar_V2.glb written (${(output.length / 1024 / 1024).toFixed(1)} MB)`)

// Also update the active runtime model
fs.mkdirSync(path.dirname(activePath), { recursive: true })
fs.copyFileSync(v2Path, activePath)
console.log(`✔ Active runtime model updated → public/assets/models/dess.glb`)

console.log('\n=== Avatar Remodel Complete ===')
