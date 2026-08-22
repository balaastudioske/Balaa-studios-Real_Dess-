/**
 * BALAA STUDIOS — Production Garment Bake Pipeline
 *
 * Deterministic asset producer. Reads the ACTIVE master avatar
 * (`public/assets/models/dess.glb`) and the three foundation meshes, then
 * produces:
 *
 *   public/library/wardrobe/{shirt,hoodie,sweater}_final.glb  (fitted + skinned)
 *   public/library/merch/{01..10}/garment.glb                  (color/fit variants)
 *   public/library/outfits/outfit_{01..10}.json                 (assemblies)
 *   public/library/merch/catalog.json                         (catalog data)
 *
 * The 10 designs are deterministic material/scale variants of the 3 foundations
 * (see `library/outfit-mapping.md`): same silhouette, black/white/cream colorways
 * and oversized fit variants. Where geometry differs (e.g. the bomber cut #10),
 * this script still emits a real bound GLB but the silhouette match must be
 * confirmed by human visual review against the reference images.
 *
 * Run:  node scripts/generate-production-assets.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { decimate } from './decimate.mjs'

globalThis.self = globalThis

class NodeFileReader {
  constructor() { this.onload = null; this.onerror = null; this.onloadend = null; this.result = null }
  _complete(result, err) {
    this.result = result
    if (err) { if (this.onerror) this.onerror(err) }
    else { if (this.onload) this.onload({ target: this }) }
    if (this.onloadend) this.onloadend({ target: this })
  }
  readAsArrayBuffer(blob) {
    if (blob && typeof blob.arrayBuffer === 'function') {
      blob.arrayBuffer().then((arrayBuf) => this._complete(arrayBuf)).catch((err) => this._complete(null, err))
    } else { this._complete(new ArrayBuffer(0)) }
  }
  readAsDataURL(blob) {
    const prefix = `data:${blob.type || 'application/octet-stream'};base64,`
    if (blob && typeof blob.arrayBuffer === 'function') {
      blob.arrayBuffer().then((a) => this._complete(prefix + Buffer.from(a).toString('base64'))).catch((err) => this._complete(null, err))
    } else { this._complete(prefix) }
  }
}
globalThis.FileReader = NodeFileReader

THREE.FileLoader.prototype.load = function (url, onLoad, onProgress, onError) {
  try {
    const filePath = path.isAbsolute(url) ? url : path.join(process.cwd(), url)
    const buffer = fs.readFileSync(filePath)
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    onLoad(arrayBuffer)
  } catch (e) {
    if (onError) onError(e)
  }
}

const AVATAR_PATH = 'public/assets/models/dess.glb'
const WARDROBE_DIR = 'public/library/wardrobe'
const MERCH_DIR = 'public/library/merch'
const OUTFITS_DIR = 'public/library/outfits'
const FOUNDATION_DIR = 'public/library/garments'

const FOUNDATIONS = {
  shirt:   { base: 'shirt.glb',   fit: { scale: [0.70, 0.38, 0.65], pos: [0, 1.28, 0.02] } },
  hoodie:  { base: 'hoodie.glb',  fit: { scale: [0.70, 0.37, 0.65], pos: [0, 1.29, 0.02] } },
  sweater: { base: 'sweater.glb', fit: { scale: [0.71, 0.38, 0.66], pos: [0, 1.28, 0.01] } },
}

const DESIGNS = [
  { id: '01', name: 'BALAA Oversized Tee — Charcoal',    foundation: 'shirt',   color: '#2B2B2B', scale: [0.72, 0.38, 0.66], pos: [0, 1.28, 0.02], preset: 'tee_charcoal' },
  { id: '02', name: 'BALAA Classic Hoodie — Jet Black',  foundation: 'hoodie',  color: '#0A0A0A', scale: [0.70, 0.37, 0.65], pos: [0, 1.29, 0.02], preset: 'hoodie_black' },
  { id: '03', name: 'BALAA Crew Sweater — Charcoal',     foundation: 'sweater', color: '#2B2B2B', scale: [0.71, 0.38, 0.66], pos: [0, 1.28, 0.01], preset: 'sweater_charcoal' },
  { id: '04', name: 'BALAA Logo Tee — Pure White',       foundation: 'shirt',   color: '#FFFFFF', scale: [0.70, 0.38, 0.65], pos: [0, 1.28, 0.02], preset: 'tee_white' },
  { id: '05', name: 'BALAA Oversized Hoodie — Charcoal', foundation: 'hoodie',  color: '#2B2B2B', scale: [0.74, 0.39, 0.68], pos: [0, 1.29, 0.02], preset: 'hoodie_charcoal' },
  { id: '06', name: 'BALAA Crew Sweater — Cream',        foundation: 'sweater', color: '#F5F0E8', scale: [0.71, 0.38, 0.66], pos: [0, 1.28, 0.01], preset: 'sweater_cream' },
  { id: '07', name: 'BALAA Logo Tee — Jet Black',        foundation: 'shirt',   color: '#0A0A0A', scale: [0.70, 0.38, 0.65], pos: [0, 1.28, 0.02], preset: 'tee_black' },
  { id: '08', name: 'BALAA Classic Hoodie — Pure White', foundation: 'hoodie',  color: '#FFFFFF', scale: [0.70, 0.37, 0.65], pos: [0, 1.29, 0.02], preset: 'hoodie_white' },
  { id: '09', name: 'BALAA Crew Sweater — Jet Black',    foundation: 'sweater', color: '#0A0A0A', scale: [0.71, 0.38, 0.66], pos: [0, 1.28, 0.01], preset: 'sweater_black' },
  { id: '10', name: 'BALAA Street Bomber — Charcoal',    foundation: 'sweater', color: '#1E1E1E', scale: [0.73, 0.38, 0.67], pos: [0, 1.28, 0.02], preset: 'sweater_bomber' },
]

const FOUNDATION_CATEGORY = { shirt: 'tshirt', hoodie: 'hoodie', sweater: 'sweater' }
const FOUNDATION_COLOR = '#4B5563'
const STRIDE = 4

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }) }
function loadGltf(url) {
  const loader = new GLTFLoader()
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => resolve(gltf), undefined, (e) => reject(e))
  })
}
function exportBinary(object) {
  const exporter = new GLTFExporter()
  return new Promise((resolve, reject) => {
    exporter.parse(object, (result) => resolve(result), (err) => reject(err), { binary: true })
  })
}
function firstMesh(scene) { let m = null; scene.traverse((c) => { if (c.isMesh && !m) m = c }); return m }

function resolveAvatar(scene) {
  let bodyMesh = null, skeleton = null, bindMatrix = null
  scene.traverse((child) => {
    if (child.isSkinnedMesh) {
      if (!bodyMesh && (child.name === 'Body_Geo' || child.name === 'AvatarBody')) bodyMesh = child
      if (!skeleton && child.skeleton) { skeleton = child.skeleton; bindMatrix = child.bindMatrix }
    }
  })
  if (!bodyMesh) scene.traverse((child) => { if (child.isSkinnedMesh && !bodyMesh) bodyMesh = child })
  if (!bodyMesh) throw new Error('No SkinnedMesh found on avatar (expected Body_Geo)')
  if (!skeleton) throw new Error('No skeleton found on avatar')
  return { bodyMesh, skeleton, bindMatrix: bindMatrix || new THREE.Matrix4() }
}

// Pre-compute avatar body verts in WORLD space + bone influences (flat arrays).
function buildAvatarCache(bodyMesh) {
  const geo = bodyMesh.geometry
  const pos = geo.getAttribute('position')
  const si = geo.getAttribute('skinIndex')
  const sw = geo.getAttribute('skinWeight')
  if (!si || !sw) throw new Error('Avatar body mesh has no skinIndex/skinWeight')
  const n = pos.count
  const worldPos = new Float32Array(n * 3)
  const joints = new Uint16Array(n * 4)
  const weights = new Float32Array(n * 4)
  const m = bodyMesh.matrixWorld
  const v = new THREE.Vector3()
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(m)
    worldPos[i * 3] = v.x; worldPos[i * 3 + 1] = v.y; worldPos[i * 3 + 2] = v.z
    for (let k = 0; k < 4; k++) { joints[i * 4 + k] = si.array[i * 4 + k]; weights[i * 4 + k] = sw.array[i * 4 + k] }
  }
  return { worldPos, joints, weights, count: n }
}

// For each garment vertex, copy the 4-bone influence set of the nearest avatar
// body vertex (world space). Allocation-free top-1 nearest search.
function transferWeightsCount(garmentGeo, avatar) {
  const pos = garmentGeo.getAttribute('position')
  const vCount = pos.count
  const skinIndices = new Uint16Array(vCount * 4)
  const skinWeights = new Float32Array(vCount * 4)
  const ap = avatar.worldPos, aj = avatar.joints, aw = avatar.weights, ac = avatar.count
  for (let i = 0; i < vCount; i++) {
    const gx = pos.getX(i), gy = pos.getY(i), gz = pos.getZ(i)
    let best = Infinity, bestJ = 0
    for (let j = 0; j < ac; j += STRIDE) {
      const bx = ap[j * 3], by = ap[j * 3 + 1], bz = ap[j * 3 + 2]
      const dx = gx - bx, dy = gy - by, dz = gz - bz
      const d = dx * dx + dy * dy + dz * dz
      if (d < best) { best = d; bestJ = j }
    }
    const b = bestJ * 4
    skinIndices[i * 4] = aj[b]; skinIndices[i * 4 + 1] = aj[b + 1]; skinIndices[i * 4 + 2] = aj[b + 2]; skinIndices[i * 4 + 3] = aj[b + 3]
    skinWeights[i * 4] = aw[b]; skinWeights[i * 4 + 1] = aw[b + 1]; skinWeights[i * 4 + 2] = aw[b + 2]; skinWeights[i * 4 + 3] = aw[b + 3]
  }
  garmentGeo.setAttribute('skinIndex', new THREE.BufferAttribute(skinIndices, 4))
  garmentGeo.setAttribute('skinWeight', new THREE.BufferAttribute(skinWeights, 4))
  return vCount
}

function fitGarment(srcMesh, avatarCache, bodyMesh, fit) {
  const geo = srcMesh.geometry.clone()
  geo.computeBoundingBox()
  const box = geo.boundingBox; const center = new THREE.Vector3(); box.getCenter(center)
  geo.translate(-center.x, -center.y, -center.z)
  const [sX, sY, sZ] = fit.scale
  const p = geo.getAttribute('position').array
  for (let i = 0; i < p.length; i += 3) { p[i] *= sX; p[i + 1] *= sY; p[i + 2] *= sZ }
  geo.translate(fit.pos[0], fit.pos[1], fit.pos[2])
  geo.computeVertexNormals()

  const vCount = transferWeightsCount(geo, avatarCache)

  // garment is in world-ish object space; convert to avatar-local space before binding
  geo.applyMatrix4(new THREE.Matrix4().copy(bodyMesh.matrixWorld).invert())
  return { geo, vCount }
}

function buildSkinnedMesh(geo, skeleton, bindMatrix, color) {
  const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.85, metalness: 0.1 })
  const mesh = new THREE.SkinnedMesh(geo, material)
  mesh.name = 'garment'
  mesh.bind(skeleton, bindMatrix)
  // Attach the skeleton root bone so GLTFExporter traverses the bone hierarchy
  // into nodeMap (otherwise skin.joints serialize as null). Bone local matrices
  // are preserved, composing the same world transforms as the source avatar.
  const rootBone = skeleton.bones[0]
  if (rootBone) mesh.add(rootBone)
  return mesh
}

async function main() {
  console.log('=== BALAA STUDIOS Production Garment Bake ===')
  ensureDir(WARDROBE_DIR); ensureDir(OUTFITS_DIR); ensureDir(MERCH_DIR)

  const avatarGltf = await loadGltf(AVATAR_PATH)
  const { bodyMesh, skeleton, bindMatrix } = resolveAvatar(avatarGltf.scene)
  const avatarCache = buildAvatarCache(bodyMesh)
  console.log(`- Avatar: ${AVATAR_PATH} | bones=${skeleton.bones.length}, body verts=${avatarCache.count}`)

  const foundationSrc = {}
  const TARGET_VERTS = 8000
  for (const [key, cfg] of Object.entries(FOUNDATIONS)) {
    const gltf = await loadGltf(path.join(FOUNDATION_DIR, cfg.base))
    const src = firstMesh(gltf.scene)
    if (!src) throw new Error(`No mesh in ${cfg.base}`)
    const orig = src.geometry.attributes.position.count
    if (orig > TARGET_VERTS) src.geometry = decimate(src.geometry, TARGET_VERTS)
    foundationSrc[key] = src
    console.log(`- Foundation loaded: ${cfg.base} (${orig} -> ${src.geometry.attributes.position.count} verts)`)
  }

  const fittedGeos = {}
  for (const [key, cfg] of Object.entries(FOUNDATIONS)) {
    const { geo, vCount } = fitGarment(foundationSrc[key], avatarCache, bodyMesh, cfg.fit)
    fittedGeos[key] = geo
    const skinned = buildSkinnedMesh(geo, skeleton, bindMatrix, FOUNDATION_COLOR)
    const buf = await exportBinary(skinned)
    fs.writeFileSync(path.join(WARDROBE_DIR, `${key}_final.glb`), Buffer.from(buf))
    console.log(`  [wardrobe] ${key}_final.glb (verts=${vCount}, bound)`)
  }

  const catalog = []
  for (const d of DESIGNS) {
    const src = foundationSrc[d.foundation]
    const { geo, vCount } = fitGarment(src, avatarCache, bodyMesh, { scale: d.scale, pos: d.pos })
    const variant = buildSkinnedMesh(geo, skeleton, bindMatrix, d.color)
    const buf = await exportBinary(variant)
    ensureDir(path.join(MERCH_DIR, d.id))
    fs.writeFileSync(path.join(MERCH_DIR, d.id, 'garment.glb'), Buffer.from(buf))

    const outfit = {
      id: `look_${d.id}`,
      name: d.name,
      avatar: '/assets/models/dess.glb',
      garment: `/library/merch/${d.id}/garment.glb`,
      foundation: d.foundation,
      outfitPresetId: d.preset,
      color: d.color,
      bottom: 'blue denim jeans',
      validationStatus: 'fitted+baked',
      visualReview: [
        'silhouette match vs reference images',
        'logo placement/size/orientation (deferred to visual pass)',
        'deformation on Mixamo walk/dance (VISUAL REVIEW REQUIRED)',
      ],
    }
    fs.writeFileSync(path.join(OUTFITS_DIR, `outfit_${d.id}.json`), JSON.stringify(outfit, null, 2))

    catalog.push({
      id: `balaa-${d.preset}`,
      name: d.name,
      description: `Final BALAA merch design ${d.id} (foundation: ${d.foundation}).`,
      category: FOUNDATION_CATEGORY[d.foundation],
      price: d.foundation === 'hoodie' ? 89 : d.foundation === 'sweater' ? 75 : 45,
      currency: 'USD',
      color: d.color,
      outfitPresetId: d.preset,
      garmentFile: `/library/merch/${d.id}/garment.glb`,
      available: true,
      tags: ['visual-review-required'],
    })
    console.log(`  [merch] ${d.id} (${d.foundation}, ${vCount} verts)  [outfit] outfit_${d.id}.json`)
  }

  fs.writeFileSync(path.join(MERCH_DIR, 'catalog.json'), JSON.stringify({ products: catalog }, null, 2))
  console.log(`\n[done] catalog.json (${catalog.length}) | wardrobe=3 | merch=10 | outfits=10`)
}

main().catch((e) => { console.error(e); process.exit(1) })
