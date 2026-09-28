// Downloads Google Fonts woff2 files referenced in fonts.css into public/fonts/
// and writes src/fonts.css with local @font-face rules.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const css = await readFile('fonts.css', 'utf8')
const urls = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(m => m[1]))]

await mkdir('public/fonts', { recursive: true })
const map = {}
for (const url of urls) {
  const name = url.split('/').pop()
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url}: ${res.status}`)
  await writeFile(path.join('public/fonts', name), Buffer.from(await res.arrayBuffer()))
  map[url] = `/fonts/${name}`
}

let local = css.replace(/https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2/g, m => map[`https:${'//'}fonts.gstatic.com/${m.split('gstatic.com/')[1]}`] || m)
// simpler: replace each known url
for (const [url, localPath] of Object.entries(map)) local = local.split(url).join(localPath)
await writeFile('src/fonts.css', local)
console.log(`downloaded ${urls.length} files`)
