import { Router } from 'express'
import { prisma } from '../db.js'

const router = Router()
const BASE = 'https://yaruska.ru'

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/catalog', priority: '0.9', changefreq: 'daily' },
  { path: '/fragrances', priority: '0.6', changefreq: 'monthly' },
  { path: '/delivery', priority: '0.4', changefreq: 'monthly' },
  { path: '/returns', priority: '0.3', changefreq: 'monthly' },
  { path: '/contacts', priority: '0.4', changefreq: 'monthly' },
  { path: '/offer', priority: '0.2', changefreq: 'monthly' },
]

function urlEntry({ path, lastmod, changefreq, priority }) {
  return `  <url>\n    <loc>${BASE}${path}</loc>\n    ${lastmod ? `<lastmod>${lastmod}</lastmod>\n    ` : ''}<changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
}

router.get('/sitemap.xml', async (_req, res, next) => {
  try {
    const items = await prisma.candle.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    })
    const urls = [
      ...STATIC_PAGES.map((page) => urlEntry(page)),
      ...items.map((item) => urlEntry({
        path: `/product/${item.slug}`,
        lastmod: item.updatedAt.toISOString().slice(0, 10),
        changefreq: 'weekly',
        priority: '0.8',
      })),
    ]
    res.set('Content-Type', 'application/xml; charset=utf-8')
    res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`)
  } catch (e) { next(e) }
})

export default router
