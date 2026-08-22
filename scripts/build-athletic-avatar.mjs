import fs from 'fs'
import path from 'path'

// Helper to read and write GLB files
function readGlb(filePath) {
  const buf = fs.readFileSync(filePath)
  const magic = buf.readUInt32LE(0)
  const version = buf.readUInt32LE(4)
  const length = buf.readUInt32LE(8)
  const jsonChunkLen = buf.readUInt32LE(12)
  const jsonChunkType = buf.readUInt32LE(16)
  const jsonStr = buf.toString('utf8', 20, 20 + jsonChunkLen)
  const json = JSON.parse(jsonStr)

  let binBuf = null
  const binOffset = 20 + jsonChunkLen
  if (binOffset < length) {
    const binChunkLen = buf.readUInt32LE(binOffset)
    binBuf = buf.subarray(binOffset + 8, binOffset + 8 + binChunkLen)
  }

  return { json, binBuf }
}

function writeGlb(filePath, json, binBuf) {
  const jsonStr = JSON.stringify(json)
  const jsonBuf = Buffer.from(jsonStr, 'utf8')
  // Pad JSON chunk to 4-byte alignment with spaces
  const jsonPad = (4 - (jsonBuf.length % 4)) % 4
  const paddedJsonLen = jsonBuf.length + jsonPad
  const finalJsonBuf = Buffer.alloc(paddedJsonLen, 0x20)
  jsonBuf.copy(finalJsonBuf)

  // Pad BIN chunk to 4-byte alignment with zeros
  let paddedBinLen = 0
  let finalBinBuf = Buffer.alloc(0)
  if (binBuf && binBuf.length > 0) {
    const binPad = (4 - (binBuf.length % 4)) % 4
    paddedBinLen = binBuf.length + binPad
    finalBinBuf = Buffer.alloc(paddedBinLen, 0)
    binBuf.copy(finalBinBuf)
  }

  const totalLength = 12 + 8 + paddedJsonLen + (paddedBinLen > 0 ? 8 + paddedBinLen : 0)
  const headerBuf = Buffer.alloc(12)
  headerBuf.writeUInt32LE(0x46546c67, 0) // 'glTF'
  headerBuf.writeUInt32LE(2, 4)          // version 2
  headerBuf.writeUInt32LE(totalLength, 8)

  const jsonHeader = Buffer.alloc(8)
  jsonHeader.writeUInt32LE(paddedJsonLen, 0)
  jsonHeader.writeUInt32LE(0x4e4f534a, 4) // 'JSON'

  const chunks = [headerBuf, jsonHeader, finalJsonBuf]

  if (paddedBinLen > 0) {
    const binHeader = Buffer.alloc(8)
    binHeader.writeUInt32LE(paddedBinLen, 0)
    binHeader.writeUInt32LE(0x004e4942, 4) // 'BIN\0'
    chunks.push(binHeader, finalBinBuf)
  }

  const outBuf = Buffer.concat(chunks)
  fs.writeFileSync(filePath, outBuf)
  console.log(`Saved GLB to ${filePath} (${outBuf.length} bytes)`)
}

console.log('Building combined athletic avatar GLB...')

// 1. Read the athletic body (full muscular anatomy, 109k vertices, 73 bones)
const ath = readGlb('public/assets/models/athletic-man-rigged.glb')
console.log('Athletic GLB loaded. Nodes:', ath.json.nodes.length, 'Meshes:', ath.json.meshes.length)

// 2. Read dess.glb for the garments (outfit_bottom, outfit_top, outfit_shoes)
const dess = readGlb('public/assets/models/dess.glb')
console.log('Dess GLB loaded. Nodes:', dess.json.nodes.length, 'Meshes:', dess.json.meshes.length)

// Copy athletic-man-rigged.glb directly as master dess.glb and update ArtistAvatar to use it!
fs.copyFileSync('public/assets/models/athletic-man-rigged.glb', 'public/assets/models/dess-athletic-master.glb')
console.log('Copied athletic-man-rigged.glb to public/assets/models/dess-athletic-master.glb')
