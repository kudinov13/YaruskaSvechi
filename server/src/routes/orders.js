import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()
router.use(authRequired)

const createSchema = z.object({
  items: z.array(z.object({
    candleId: z.string(),
    quantity: z.number().int().min(1),
    variantId: z.string().optional(),
  })),
  address: z.string().optional(),
  offerAccepted: z.literal(true),
  dataProcessingConsent: z.literal(true),
})

router.post('/', async (req, res, next) => {
  try {
    if (req.body?.offerAccepted !== true || req.body?.dataProcessingConsent !== true) {
      return res.status(400).json({ error: 'Необходимы принятие оферты и согласие на обработку персональных данных' })
    }
    const data = createSchema.parse(req.body)
    const candleIds = [...new Set(data.items.map(i => i.candleId))]
    const candles = await prisma.candle.findMany({ where: { id: { in: candleIds } } })
    if (candles.length !== candleIds.length) {
      return res.status(400).json({ error: 'Некоторые товары не найдены' })
    }
    const candleById = new Map(candles.map(candle => [candle.id, candle]))
    const orderItems = []
    for (const item of data.items) {
      const candle = candleById.get(item.candleId)
      const variants = Array.isArray(candle.variants) ? candle.variants : []
      const variant = variants.find(option => option.id === item.variantId)
      if ((variants.length && !variant) || (!variants.length && item.variantId)) {
        return res.status(400).json({ error: 'Выбран недоступный вариант товара' })
      }
      orderItems.push({ candleId: item.candleId, title: variant ? `${candle.title} — ${variant.name}` : candle.title, price: candle.price, quantity: item.quantity })
    }
    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const consentAt = new Date()
    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        total,
        address: data.address,
        offerAcceptedAt: consentAt,
        offerVersion: '2026-09-24',
        dataProcessingConsentAt: consentAt,
        dataProcessingConsentVersion: '2026-09-24',
        items: { create: orderItems },
      },
      include: { items: true },
    })
    res.json({ order })
  } catch (e) {
    next(e)
  }
})

router.get('/', async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ orders })
  } catch (e) {
    next(e)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    })
    if (!order || order.userId !== req.user.id) {
      return res.status(404).json({ error: 'Заказ не найден' })
    }
    res.json({ order })
  } catch (e) {
    next(e)
  }
})

export default router
