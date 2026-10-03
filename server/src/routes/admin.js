import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import sharp from 'sharp'
import { z } from 'zod'
import { prisma } from '../db.js'
import { authRequired, adminRequired } from '../middleware/auth.js'

const router = Router()
router.use(authRequired, adminRequired)

const UPLOAD_DIR = path.resolve('uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } })

const candleSchema = z.object({
  title: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  price: z.number().int().min(0),
  oldPrice: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  shippingWeightGrams: z.number().int().positive().nullable().optional(),
  shippingPackagePreset: z.enum(['p25x25x10', 'p50x25x15', 'p40x30x20', 'p50x30x30']).nullable().optional(),
  categoryId: z.string(),
  images: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
})

router.post('/upload', upload.array('files', 8), async (req, res, next) => {
  try {
    for (const file of req.files || []) {
      const img = sharp(file.path).rotate()
      const meta = await img.metadata()
      if (meta.width > 1920) img.resize({ width: 1920, withoutEnlargement: true })
      const tmp = `${file.path}.tmp`
      if (file.mimetype === 'image/png') await img.png({ compressionLevel: 9, palette: true }).toFile(tmp)
      else if (file.mimetype === 'image/webp') await img.webp({ quality: 82 }).toFile(tmp)
      else await img.jpeg({ quality: 82, mozjpeg: true, progressive: true }).toFile(tmp)
      if (fs.statSync(tmp).size < file.size) fs.renameSync(tmp, file.path)
      else fs.unlinkSync(tmp)
    }
    const files = (req.files || []).map(f => `/uploads/${f.filename}`)
    res.json({ files })
  } catch (e) { next(e) }
})

router.get('/candles', async (_req, res, next) => {
  try {
    const items = await prisma.candle.findMany({ include: { category: true }, orderBy: { createdAt: 'desc' } })
    res.json({ items })
  } catch (e) { next(e) }
})

const TR = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' }
function slugify(title) {
  const s = title.toLowerCase().split('').map((c) => TR[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return s || 'candle'
}

router.post('/candles', async (req, res, next) => {
  try {
    const data = candleSchema.parse(req.body)
    let slug = data.slug || slugify(data.title)
    const exists = await prisma.candle.findUnique({ where: { slug } })
    if (exists) slug = `${slug}-${Date.now().toString(36)}`
    const item = await prisma.candle.create({ data: { ...data, slug, images: data.images || [] } })
    res.json({ item })
  } catch (e) { next(e) }
})

router.put('/candles/:id', async (req, res, next) => {
  try {
    const data = candleSchema.partial().parse(req.body)
    const item = await prisma.candle.update({ where: { id: req.params.id }, data })
    res.json({ item })
  } catch (e) { next(e) }
})

router.delete('/candles/:id', async (req, res, next) => {
  try {
    await prisma.candle.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

const categorySchema = z.object({
  title: z.string().min(2),
  slug: z.string().optional(),
  order: z.number().int().optional(),
})

router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { title: 'asc' }],
      include: { _count: { select: { items: true } } },
    })
    res.json({ categories })
  } catch (e) { next(e) }
})

router.post('/categories', async (req, res, next) => {
  try {
    const data = categorySchema.parse(req.body)
    let slug = data.slug || slugify(data.title)
    const exists = await prisma.category.findUnique({ where: { slug } })
    if (exists) slug = `${slug}-${Date.now().toString(36)}`
    const item = await prisma.category.create({ data: { slug, title: data.title, order: data.order || 0 } })
    res.json({ item })
  } catch (e) { next(e) }
})

router.put('/categories/:id', async (req, res, next) => {
  try {
    const data = categorySchema.partial().parse(req.body)
    const update = {}
    if (data.title !== undefined) update.title = data.title
    if (data.order !== undefined) update.order = data.order
    if (data.slug !== undefined && data.slug.trim()) update.slug = data.slug.trim()
    if (data.title !== undefined && data.slug === undefined) {
      const slug = slugify(data.title)
      if (await prisma.category.findUnique({ where: { slug } })) {
        // keep existing slug to avoid collision
      } else update.slug = slug
    }
    const item = await prisma.category.update({ where: { id: req.params.id }, data: update })
    res.json({ item })
  } catch (e) { next(e) }
})

router.delete('/categories/:id', async (req, res, next) => {
  try {
    const count = await prisma.candle.count({ where: { categoryId: req.params.id } })
    if (count > 0) return res.status(400).json({ error: `В категории есть товары (${count}). Сначала перенесите или удалите их.` })
    await prisma.category.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

const fragranceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.array(z.string().trim().max(2000)).max(20).optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
})

router.get('/fragrances', async (_req, res, next) => {
  try {
    const items = await prisma.fragrance.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] })
    res.json({ items })
  } catch (e) { next(e) }
})

router.post('/fragrances', async (req, res, next) => {
  try {
    const data = fragranceSchema.parse(req.body)
    const nameTaken = await prisma.fragrance.findUnique({ where: { name: data.name } })
    if (nameTaken) return res.status(400).json({ error: 'Аромат с таким названием уже существует' })
    let slug = slugify(data.name)
    const exists = await prisma.fragrance.findUnique({ where: { slug } })
    if (exists) slug = `${slug}-${Date.now().toString(36)}`
    const item = await prisma.fragrance.create({
      data: { slug, name: data.name, description: data.description || [], order: data.order || 0, active: data.active ?? true },
    })
    res.json({ item })
  } catch (e) { next(e) }
})

router.put('/fragrances/:id', async (req, res, next) => {
  try {
    const data = fragranceSchema.partial().parse(req.body)
    if (data.name !== undefined) {
      const nameTaken = await prisma.fragrance.findFirst({ where: { name: data.name, NOT: { id: req.params.id } } })
      if (nameTaken) return res.status(400).json({ error: 'Аромат с таким названием уже существует' })
    }
    const item = await prisma.fragrance.update({ where: { id: req.params.id }, data })
    res.json({ item })
  } catch (e) { next(e) }
})

router.delete('/fragrances/:id', async (req, res, next) => {
  try {
    await prisma.fragrance.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.get('/orders', async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({ include: { items: true, user: { select: { id: true, name: true, email: true, phone: true } } }, orderBy: { createdAt: 'desc' } })
    res.json({ orders })
  } catch (e) { next(e) }
})

router.put('/orders/:id', async (req, res, next) => {
  if (Object.hasOwn(req.body || {}, 'status') || Object.keys(req.body || {}).some(key => key !== 'cdekTrack')) {
    return res.status(400).json({ error: 'Статус заказа обновляется только платёжными и CDEK-вебхуками' })
  }
  const parsed = z.object({ cdekTrack: z.string().max(255).nullable() }).strict().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Некорректные данные заказа' })
  try {
    const order = await prisma.order.update({ where: { id: req.params.id }, data: parsed.data })
    res.json({ order })
  } catch (e) { next(e) }
})

export default router
