import fs from 'fs'

const source = 'newmodel dess.glb'
const destination = 'public/assets/models/dess.glb'

fs.copyFileSync(source, destination)
console.log(`Restored the authoritative 73-bone artist to ${destination}`)
