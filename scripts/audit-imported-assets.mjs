/**
 * Read-only GLB/BVH intake audit for assets dropped into the project.
 *
 * Usage:
 *   node scripts/audit-imported-assets.mjs <file> [...files]
 *
 * This reports structure only; it never modifies an imported asset.  The
 * resulting report is intended to make promotion into public/ explicit.
 */
import fs from 'node:fs'
import path from 'node:path'

function readGlb(file) {
  const source = fs.readFileSync(file)
  if (source.readUInt32LE(0) !== 0x46546c67) throw new Error('Not a binary glTF (missing glTF magic)')
  const jsonLength = source.readUInt32LE(12)
  return JSON.parse(source.subarray(20, 20 + jsonLength).toString('utf8').trim())
}

function summarizeGlb(file) {
  const gltf = readGlb(file)
  const nodes = gltf.nodes || []
  const meshes = gltf.meshes || []
  const animations = gltf.animations || []
  const skins = gltf.skins || []
  const morphs = meshes.reduce((count, mesh) => count + (mesh.primitives || []).reduce(
    (sum, primitive) => sum + (primitive.targets?.length || 0), 0,
  ), 0)
  const skinnedNodes = nodes.filter((node) => node.skin !== undefined).length
  const skinJointCounts = skins.map((skin) => skin.joints?.length || 0)
  const skinJointNames = skins.map((skin) => (skin.joints || []).map((joint) => nodes[joint]?.name || `node_${joint}`))
  const animationNames = animations.map((animation, index) => animation.name || `animation_${index}`)
  const animationTargets = animations.map((animation) => [...new Set((animation.channels || []).map(
    (channel) => nodes[channel.target?.node]?.name || `node_${channel.target?.node}`,
  ))])
  const meshNames = meshes.map((mesh, index) => mesh.name || `mesh_${index}`)
  const bounds = meshes.flatMap((mesh) => (mesh.primitives || []).map((primitive) => {
    const accessor = gltf.accessors?.[primitive.attributes?.POSITION]
    return accessor?.min && accessor?.max ? { min: accessor.min, max: accessor.max } : null
  })).filter(Boolean)

  return {
    file: path.normalize(file),
    kind: 'glb',
    bytes: fs.statSync(file).size,
    scene: gltf.scene ?? 0,
    nodes: nodes.length,
    meshes: meshes.length,
    meshNames,
    materials: gltf.materials?.length || 0,
    images: gltf.images?.length || 0,
    textures: gltf.textures?.length || 0,
    skins: skins.length,
    skinJointCounts,
    skinJointNames,
    skinnedNodes,
    animations: animations.length,
    animationNames,
    animationTargets,
    morphTargets: morphs,
    bounds,
  }
}

function summarizeBvh(file) {
  const text = fs.readFileSync(file, 'utf8')
  const header = text.slice(0, text.indexOf('MOTION'))
  const frames = /Frames:\s*(\d+)/.exec(text)?.[1] || '0'
  const frameTime = /Frame Time:\s*([\d.]+)/.exec(text)?.[1] || '0'
  const joints = [...header.matchAll(/^\s*(?:ROOT|JOINT)\s+(.+)$/gm)].map((match) => match[1].trim())
  const fingers = joints.filter((joint) => /finger|thumb/i.test(joint))
  return {
    file: path.normalize(file),
    kind: 'bvh',
    bytes: fs.statSync(file).size,
    root: joints[0] || null,
    joints: joints.length,
    fingerJoints: fingers.length,
    frames: Number(frames),
    frameTime: Number(frameTime),
    durationSeconds: Number(frames) * Number(frameTime),
    jointNames: joints,
  }
}

const files = process.argv.slice(2)
if (!files.length) {
  console.error('Pass one or more .glb or .bvh files to audit.')
  process.exit(1)
}

const report = files.map((file) => {
  try {
    const ext = path.extname(file).toLowerCase()
    if (ext === '.glb') return summarizeGlb(file)
    if (ext === '.bvh') return summarizeBvh(file)
    throw new Error(`Unsupported extension: ${ext}`)
  } catch (error) {
    return { file: path.normalize(file), error: error instanceof Error ? error.message : String(error) }
  }
})

console.log(JSON.stringify(report, null, 2))
