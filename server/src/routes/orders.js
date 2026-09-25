import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { authRequired } from '../middleware/auth.js'
import { CheckoutError, quoteCartDelivery } from '../services/checkout.js'
import { createYooKassaPayment } from '../services/yookassa.js'

const router = Router()
router.use(authRequired)

const createSchema = z.object({
  items: z.array(z.object({
    candleId: z.string().min(1),
    quantity: z.number().int().min(1).max(999),
    variantId: z.string().optional(),
  })).min(1).max(255),
  offerAccepted: z.literal(true),
  dataProcessingConsent: z.literal(true),
  recipientName: z.string().trim().min(2).max(255),
  recipientPhone: z.string().trim().min(5).max(24),
  recipientEmail: z.string().trim().email().max(255),
  cityCode: z.coerce.number().int().positive(),
  cityName: z.string().trim().max(255).optional(),
  pickupPointCode: z.string().trim().min(1).max(255).optional(),
  deliveryPointCode: z.string().trim().min(1).max(255).optional(),
  pvzCode: z.string().trim().min(1).max(255).optional(),
}).refine(data => Boolean(data.pickupPointCode || data.deliveryPointCode || data.pvzCode), {
  message: 'Укажите пункт выдачи СДЭК',
})

function checkoutError(error, res, next) {
  if (error instanceof CheckoutError) return res.status(error.status).json({ error: error.message })
  return next(error)
}

function pointAddress(point, city) {
  const address = point.location?.address || point.address || point.address_full || null
  return address ? `${city.city}, ${address}` : city.city
}

router.post('/', async (req, res, next) => {
  if (req.body?.offerAccepted !== true || req.body?.dataProcessingConsent !== true) {
    return res.status(400).json({ error: 'Необходимы принятие оферты и согласие на обработку персональных данных' })
  }
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Некорректные данные заказа или получателя' })

  try {
    const data = parsed.data
    const pointCode = data.pickupPointCode || data.deliveryPointCode || data.pvzCode
    const checkout = await quoteCartDelivery(data.items, data.cityCode, pointCode)
    const consentAt = new Date()
    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        total: checkout.total,
        goodsTotal: checkout.goodsTotal,
        deliveryPrice: checkout.deliveryPrice,
        deliveryTariffCode: Number(checkout.tariff.tariff_code),
        deliveryCityCode: Number(checkout.city.code),
        deliveryCity: checkout.city.city,
        deliveryPointCode: checkout.point.code,
        deliveryPointAddress: pointAddress(checkout.point, checkout.city),
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        recipientEmail: data.recipientEmail,
        address: pointAddress(checkout.point, checkout.city),
        offerAcceptedAt: consentAt,
        offerVersion: '2026-09-24',
        dataProcessingConsentAt: consentAt,
        dataProcessingConsentVersion: '2026-09-24',
        paymentStatus: 'PENDING',
        status: 'NEW',
        items: { create: checkout.lines },
      },
      include: { items: true },
    })

    let payment
    try {
      payment = await createYooKassaPayment({
        orderId: order.id,
        amountRubles: order.total,
        description: `Оплата заказа ${order.id}`,
      })
    } catch {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'FAILED', status: 'CANCELLED' },
      })
      return res.status(502).json({ error: 'Не удалось создать платёж. Попробуйте оформить заказ позже.' })
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentId: payment.id,
        paymentConfirmationUrl: payment.confirmation.confirmation_url,
      },
      include: { items: true },
    })
    res.status(201).json({ order: updatedOrder, confirmationUrl: payment.confirmation.confirmation_url })
  } catch (error) {
    checkoutError(error, res, next)
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
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    })
    if (!order || order.userId !== req.user.id) return res.status(404).json({ error: 'Заказ не найден' })
    res.json({ order })
  } catch (error) {
    next(error)
  }
})

export default router
