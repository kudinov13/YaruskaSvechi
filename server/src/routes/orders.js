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
    const candles = await prisma.candle.findMany({
      where: { id: { in: data.items.map(i => i.candleId) } },
    })
    if (candles.length !== data.items.length) {
      return res.status(400).json({ error: 'Некоторые товары не найдены' })
    }
    const total = data.items.reduce((sum, i) => {
      const c = candles.find(x => x.id === i.candleId)
      return sum + c.price * i.quantity
    }, 0)
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
        items: {
          create: data.items.map(i => {
            const c = candles.find(x => x.id === i.candleId)
            return { candleId: i.candleId, title: c.title, price: c.price, quantity: i.quantity }
          }),
        },
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
