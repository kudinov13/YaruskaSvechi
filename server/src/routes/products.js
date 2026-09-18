import { Router } from 'express'
import { prisma } from '../db.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { category, season, q } = req.query
    const where = {}
    if (category) where.categoryId = category
    if (season) where.season = season
    if (q) where.title = { contains: q, mode: 'insensitive' }
    const items = await prisma.candle.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ items })
  } catch (e) {
    next(e)
  }
})

router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { order: 'asc' } })
    res.json({ categories })
  } catch (e) {
    next(e)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const item = await prisma.candle.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    })
    if (!item) return res.status(404).json({ error: 'Не найдено' })
    res.json({ item })
  } catch (e) {
    next(e)
  }
})

export default router
