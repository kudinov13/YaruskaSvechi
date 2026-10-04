import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const svg = readFileSync('public/favicon.svg')
const jobs = [
  ['public/favicon-32.png', 32],
  ['public/favicon-180.png', 180],
  ['public/favicon-192.png', 192],
  ['public/favicon-512.png', 512],
]
for (const [file, size] of jobs) {
  await sharp(svg, { density: 400 }).resize(size, size).png().toFile(file)
  console.log('wrote', file)
}
