import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import { z } from 'zod'
import { prisma } from '../db.js'
import { authRequired, adminRequired } from '../middleware/auth.js'

const router = Router()
router.use(authRequired, adminRequired)

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.resolve('uploads')),
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
  categoryId: z.string(),
  season: z.string().optional(),
  images: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
})

router.post('/upload', upload.array('files', 8), (req, res) => {
  const files = (req.files || []).map(f => `/uploads/${f.filename}`)
  res.json({ files })
})

router.get('/candles', async (_req, res, next) => {
  try {
    const items = await prisma.candle.findMany({ include: { category: true }, orderBy: { createdAt: 'desc' } })
    res.json({ items })
  } catch (e) { next(e) }
})

router.post('/candles', async (req, res, next) => {
  try {
    const data = candleSchema.parse(req.body)
    const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
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

router.post('/categories', async (req, res, next) => {
  try {
    const { slug, title, order } = req.body
    const item = await prisma.category.create({ data: { slug, title, order: order || 0 } })
    res.json({ item })
  } catch (e) { next(e) }
})

router.get('/orders', async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({ include: { items: true, user: { select: { id: true, name: true, email: true, phone: true } } }, orderBy: { createdAt: 'desc' } })
    res.json({ orders })
  } catch (e) { next(e) }
})

router.put('/orders/:id', async (req, res, next) => {
  try {
    const { status, cdekTrack } = req.body
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status, cdekTrack },
    })
    res.json({ order })
  } catch (e) { next(e) }
})

export default router
