import fs from 'fs'
import path from 'path'

const animations = [
  'Walking.fbx',
  'Walking (1).fbx',
  'Start Walking.fbx',
  'Walking Backwards.fbx',
  'Walking Turn 180.fbx',
]
const destinationDirectory = 'public/library/animations/mixamo'

for (const animation of animations) {
  fs.copyFileSync(animation, path.join(destinationDirectory, animation))
}

console.log(`Published ${animations.length} native Mixamo walking clips.`)
