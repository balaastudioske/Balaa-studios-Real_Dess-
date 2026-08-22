/**
 * Fast, manifold-safe triangle-mesh decimation.
 *
 * Uses three's proven edge-collapse substitution math, accelerated by a binary
 * min-heap (vs the shipped SimplifyModifier's O(n*n) selection) and hardened
 * with a manifold-only guard: an edge is collapsed only if exactly two alive
 * faces share it, so non-manifold sculpt artifacts and mesh boundaries cannot
 * shred the result.
 *
 * Decimate to ~`targetVerts` vertices, with per-pass adjacency rebuild.
 */
import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

class MinHeap {
  constructor() { this.a = [] }
  push(o) { const a = this.a; a.push(o); let i = a.length - 1
    while (i > 0) { const p = (i - 1) >> 1; if (a[p].c <= o.c) break; a[i] = a[p]; i = p } a[i] = o }
  pop() {
    const a = this.a
    if (a.length === 0) return undefined
    const t = a[0]; const x = a.pop()
    if (a.length > 0) { const n = a.length; let i = 0
      while (true) { let l = 2 * i + 1, r = l + 1, s = i
        if (l < n && a[l].c < x.c) s = l
        if (r < n && a[r].c < a[s].c) s = r
        if (s === i) break; a[i] = a[s]; i = s }
      a[i] = x }
    return t
  }
  get size() { return this.a.length }
}
function ek(a, b) { return a < b ? `${a},${b}` : `${b},${a}` }
function removeFromArray(array, object) { const k = array.indexOf(object); if (k > -1) array.splice(k, 1) }

class Vert {
  constructor(p) { this.position = p; this.id = -1; this.faces = []; this.neighbors = []; this.inMesh = true }
  addUniqueNeighbor(v) { if (this.neighbors.indexOf(v) === -1) this.neighbors.push(v) }
  removeIfNonNeighbor(n) { const o = this.neighbors.indexOf(n); if (o === -1) return; for (let i = 0; i < this.faces.length; i++) { if (this.faces[i].hasVertex(n)) return } this.neighbors.splice(o, 1) }
}
class Face {
  constructor(a, b, c) { this.v1 = a; this.v2 = b; this.v3 = c; a.faces.push(this); b.faces.push(this); c.faces.push(this) }
  hasVertex(x) { return x === this.v1 || x === this.v2 || x === this.v3 }
  replaceVertex(oldv, newv) {
    if (oldv === this.v1) this.v1 = newv; else if (oldv === this.v2) this.v2 = newv; else if (oldv === this.v3) this.v3 = newv
    removeFromArray(oldv.faces, this); newv.faces.push(this)
    oldv.removeIfNonNeighbor(this.v1); this.v1.removeIfNonNeighbor(oldv)
    oldv.removeIfNonNeighbor(this.v2); this.v2.removeIfNonNeighbor(oldv)
    oldv.removeIfNonNeighbor(this.v3); this.v3.removeIfNonNeighbor(oldv)
    this.v1.addUniqueNeighbor(this.v2); this.v1.addUniqueNeighbor(this.v3)
    this.v2.addUniqueNeighbor(this.v1); this.v2.addUniqueNeighbor(this.v3)
    this.v3.addUniqueNeighbor(this.v1); this.v3.addUniqueNeighbor(this.v2)
  }
}
function removeFace(f) {
  const v1 = f.v1, v2 = f.v2, v3 = f.v3
  if (v1) removeFromArray(v1.faces, f)
  if (v2) removeFromArray(v2.faces, f)
  if (v3) removeFromArray(v3.faces, f)
  const vs = [v1, v2, v3]
  for (let i = 0; i < 3; i++) { const a = vs[i], b = vs[(i + 1) % 3]; if (a && b) { a.removeIfNonNeighbor(b); b.removeIfNonNeighbor(a) } }
  f.v1 = null; f.v2 = null; f.v3 = null
}

export function decimate(geo, targetVerts = 8000) {
  geo = mergeVertices(geo)
  if (!geo.index) geo = geo.toNonIndexed()
  geo = mergeVertices(geo)
  const idx = geo.index.array, pos = geo.attributes.position.array
  const F0 = idx.length / 3
  const verts = []
  for (let i = 0; i < pos.length; i += 3) {     const v = new Vert(new THREE.Vector3(pos[i], pos[i + 1], pos[i + 2])); v.id = verts.length; verts.push(v) }
  const V = verts.length
  const faces = []
  for (let i = 0; i < F0; i++) faces.push(new Face(verts[idx[i * 3]], verts[idx[i * 3 + 1]], verts[idx[i * 3 + 2]]))
  let liveVerts = V

  while (liveVerts > targetVerts) {
    // --- rebuild adjacency for current mesh ---
    const edgeFaces = new Map()
    for (let i = 0; i < faces.length; i++) {
      const f = faces[i]
      if (!f.v1 || !f.v2 || !f.v3) continue
      const a = f.v1.id, b = f.v2.id, c = f.v3.id
      for (const e of [ek(a, b), ek(b, c), ek(a, c)]) { let arr = edgeFaces.get(e); if (!arr) { arr = []; edgeFaces.set(e, arr) } arr.push(i) }
    }
    const heap = new MinHeap()
    for (const [k, fs] of edgeFaces) {
      let alive = 0
      for (const fi of fs) { if (faces[fi].v1) alive++ }
      if (alive !== 2) continue // skip boundary (1) and non-manifold (>=3) edges
      const [a, b] = k.split(',').map(Number)
      const va = verts[a], vb = verts[b]
      const dx = va.position.x - vb.position.x, dy = va.position.y - vb.position.y, dz = va.position.z - vb.position.z
      heap.push({ c: Math.sqrt(dx * dx + dy * dy + dz * dz), a, b, key: k })
    }

    let collapsed = 0
    while (heap.size > 0 && liveVerts > targetVerts) {
      const e = heap.pop(); const { a, b } = e
      const va = verts[a], vb = verts[b]
      if (!va.inMesh || !vb.inMesh) continue
      const fs = edgeFaces.get(e.key); let alive = 0
      for (const fi of fs) { if (faces[fi].v1) alive++ }
      if (alive !== 2) continue // became non-manifold/stale
      // collapse b -> a (remove b)
      va.position.x = (va.position.x + vb.position.x) / 2
      va.position.y = (va.position.y + vb.position.y) / 2
      va.position.z = (va.position.z + vb.position.z) / 2
      const bfaces = vb.faces.slice()
      for (const f of bfaces) {
        if (!f.v1) continue
        let hasA = false, hasB = false
        if (f.v1 === va || f.v2 === va || f.v3 === va) hasA = true
        if (f.v1 === vb || f.v2 === vb || f.v3 === vb) hasB = true
        if (hasA && hasB) removeFace(f)            // edge face
        else { f.replaceVertex(vb, va); if (f.v1.id === f.v2.id || f.v1.id === f.v3.id || f.v2.id === f.v3.id) removeFace(f) }
      }
      vb.inMesh = false; liveVerts--
      while (vb.neighbors.length) { const n = vb.neighbors.pop(); removeFromArray(n.neighbors, vb) }
      collapsed++
    }
    if (collapsed === 0) break
  }

  const remap = new Int32Array(V); let nV = 0, position = [], uv = [], normal = [], color = [], outIndex = []
  for (let i = 0; i < V; i++) {
    const v = verts[i]; if (!v.inMesh) continue
    remap[v.id] = nV; position.push(v.position.x, v.position.y, v.position.z); nV++
  }
  for (let i = 0; i < faces.length; i++) {
    const f = faces[i]; if (!f.v1 || !f.v2 || !f.v3) continue
    if (!f.v1.inMesh || !f.v2.inMesh || !f.v3.inMesh) continue
    outIndex.push(remap[f.v1.id], remap[f.v2.id], remap[f.v3.id])
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(position), 3))
  out.setIndex(outIndex); out.computeVertexNormals()
  return out
}

export default decimate
