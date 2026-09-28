// Recompresses public/Photos/*.{jpg,jpeg,png} in place (mozjpeg / png->webp kept)
// and produces the smallest variant per file.
// Usage: node scripts/optimize-images.mjs
import { readdir, unlink } from 'node:fs/promises'
import { statSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const dir = path.resolve('public/Photos')
const files = (await readdir(dir)).filter(f => /\.(jpe?g|png)$/i.test(f))

let before = 0, after = 0
for (const file of files) {
  const src = path.join(dir, file)
  const a = statSync(src).size
  const tmp = src + '.tmp'
  const img = sharp(src).rotate()
  const meta = await img.metadata()
  if (meta.width > 1920) img.resize({ width: 1920, withoutEnlargement: true })
  if (/\.png$/i.test(file)) {
    await img.png({ compressionLevel: 9, palette: true }).toFile(tmp)
  } else {
    await img.jpeg({ quality: 78, mozjpeg: true, progressive: true }).toFile(tmp)
  }
  const b = statSync(tmp).size
  if (b < a) {
    // replace original
    const { rename } = await import('node:fs/promises')
    await rename(tmp, src)
    after += b
    console.log(`${file}: ${(a / 1024).toFixed(0)}KB -> ${(b / 1024).toFixed(0)}KB`)
  } else {
    await unlink(tmp)
    after += a
    console.log(`${file}: ${(a / 1024).toFixed(0)}KB (kept, recompress was bigger)`)
  }
}
console.log(`TOTAL: ${(before += 0, '')}${(after / 1024 / 1024).toFixed(2)}MB`)
