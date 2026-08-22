import fs from 'fs'
import path from 'path'

/**
 * Generates an uncompressed 24-bit RGB BMP/PNG texture for Camo Shorts
 */
function createCamoTexture() {
  const width = 1024
  const height = 1024
  
  // Palette matching Reference Image 3:
  // Olive green, earthy brown, dark woodland green, khaki tan, dark shadow
  const colors = [
    [75, 83, 32],    // Olive drab
    [59, 47, 47],    // Earthy bark brown
    [46, 59, 35],    // Deep forest green
    [139, 131, 104], // Khaki / desert tan
    [25, 28, 22],    // Dark shadow black
  ]

  // Simplex-like multi-frequency procedural noise
  const buffer = Buffer.alloc(width * height * 4)

  // Seeded pseudo-random noise grid
  const gridSize = 64
  const grid = new Float32Array(gridSize * gridSize)
  for (let i = 0; i < grid.length; i++) {
    grid[i] = Math.random()
  }

  function getNoise(x, y) {
    const gx = ((x % width) / width) * (gridSize - 1)
    const gy = ((y % height) / height) * (gridSize - 1)
    const ix = Math.floor(gx)
    const iy = Math.floor(gy)
    const fx = gx - ix
    const fy = gy - iy

    const i00 = iy * gridSize + ix
    const i10 = iy * gridSize + (ix + 1)
    const i01 = (iy + 1) * gridSize + ix
    const i11 = (iy + 1) * gridSize + (ix + 1)

    const n00 = grid[i00]
    const n10 = grid[i10]
    const n01 = grid[i01]
    const n11 = grid[i11]

    const nx0 = n00 * (1 - fx) + n10 * fx
    const nx1 = n01 * (1 - fx) + n11 * fx
    return nx0 * (1 - fy) + nx1 * fy
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Octaves
      const n1 = getNoise(x * 2.5, y * 2.5)
      const n2 = getNoise(x * 5.0 + 100, y * 5.0 + 100) * 0.5
      const n3 = getNoise(x * 10.0 + 200, y * 10.0 + 200) * 0.25
      const total = (n1 + n2 + n3) / 1.75

      // Quantize into organic camo islands
      let colorIdx = 0
      if (total < 0.22) colorIdx = 0
      else if (total < 0.44) colorIdx = 1
      else if (total < 0.65) colorIdx = 2
      else if (total < 0.82) colorIdx = 3
      else colorIdx = 4

      const col = colors[colorIdx]
      const offset = (y * width + x) * 4
      buffer[offset] = col[0]     // R
      buffer[offset + 1] = col[1] // G
      buffer[offset + 2] = col[2] // B
      buffer[offset + 3] = 255    // A
    }
  }

  // Save as RAW RGBA buffer and Data URL for Three.js DataTexture
  const outPath = path.resolve('public/textures/camo_data.json')
  const base64 = buffer.toString('base64')
  fs.writeFileSync(outPath, JSON.stringify({ width, height, data: base64 }))
  console.log('✅ Camouflage texture generated successfully in public/textures/camo_data.json!')
}

createCamoTexture()
