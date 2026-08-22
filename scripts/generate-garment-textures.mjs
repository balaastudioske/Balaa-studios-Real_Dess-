import fs from 'fs'
import path from 'path'

// Ensure target directory exists
const outDir = path.resolve('public/textures')
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

// Copy the authoritative BALAA white logo into public/textures
const srcLogo = path.resolve('BALAA_Logo_Master_Package_v3/png/BALAA_WHITE_1024.png')
const destLogo = path.join(outDir, 'balaa_logo_white.png')
fs.copyFileSync(srcLogo, destLogo)
console.log('✅ Copied BALAA logo to public/textures/balaa_logo_white.png')

// Also copy black and charcoal logos
fs.copyFileSync(
  path.resolve('BALAA_Logo_Master_Package_v3/png/BALAA_BLACK_1024.png'),
  path.join(outDir, 'balaa_logo_black.png')
)
fs.copyFileSync(
  path.resolve('BALAA_Logo_Master_Package_v3/png/BALAA_CHARCOAL_1024.png'),
  path.join(outDir, 'balaa_logo_charcoal.png')
)

console.log('✅ Texture assets prepared in public/textures/')
