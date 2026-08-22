/**
 * Creates the single runtime animation library used by the artist.
 * Source folders are deliberately retained as ingest archives; the app reads
 * only public/library/animations after this script has run.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const runtimeRoot = path.join(ROOT, 'public', 'library', 'animations')
const sources = [
  { from: path.join(ROOT, 'public', 'animations'), to: path.join(runtimeRoot, 'mixamo'), category: 'mixamo' },
  { from: path.join(ROOT, 'library', 'motion-reference'), to: path.join(runtimeRoot, 'reference'), category: 'reference' },
]

const files = []
for (const source of sources) {
  fs.mkdirSync(source.to, { recursive: true })
  for (const entry of fs.readdirSync(source.from, { withFileTypes: true })) {
    if (!entry.isFile() || !/\.(fbx|glb|bvh)$/i.test(entry.name)) continue
    const from = path.join(source.from, entry.name)
    const to = path.join(source.to, entry.name)
    fs.copyFileSync(from, to)
    files.push({
      id: entry.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
      file: `/library/animations/${source.category}/${entry.name}`,
      category: source.category,
      format: path.extname(entry.name).slice(1).toLowerCase(),
    })
  }
}

// This performance asset was already delivered in the runtime folder.
for (const entry of fs.readdirSync(runtimeRoot, { withFileTypes: true })) {
  if (entry.isFile() && /\.(fbx|glb|bvh)$/i.test(entry.name)) {
    files.push({
      id: entry.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
      file: `/library/animations/${entry.name}`,
      category: 'performance',
      format: path.extname(entry.name).slice(1).toLowerCase(),
    })
  }
}

files.sort((a, b) => a.file.localeCompare(b.file))
fs.writeFileSync(path.join(runtimeRoot, 'index.json'), JSON.stringify({
  schemaVersion: 1,
  artist: 'BALAA STUDIOS master Dess',
  animationCount: files.length,
  animations: files,
}, null, 2) + '\n')

console.log(`Consolidated ${files.length} artist motion assets into public/library/animations/`)
