import { Router } from 'express'
import { z } from 'zod'
import { authRequired } from '../middleware/auth.js'
import {
  CheckoutError,
  getDeliveryCities,
  getCityPickupPoints,
  quoteCartDelivery,
} from '../services/checkout.js'

const router = Router()
const itemSchema = z.object({
  candleId: z.string().min(1),
  quantity: z.number().int().min(1).max(999),
  variantId: z.string().optional(),
})

function reportError(error, res, next) {
  if (error instanceof CheckoutError) return res.status(error.status).json({ error: error.message })
  return next(error)
}

router.get('/cities', async (req, res, next) => {
  const query = z.string().trim().min(2).max(100).safeParse(req.query.q)
  if (!query.success) return res.status(400).json({ error: 'Введите не менее двух символов названия города' })
  try {
    const cities = await getDeliveryCities(query.data)
    const suggestions = Array.isArray(cities) ? cities : cities?.cities || cities?.items || cities?.entity || (cities?.code ? [cities] : [])
    res.json({ cities: suggestions })
  } catch (error) {
    reportError(error, res, next)
  }
})

router.get('/pickup-points', async (req, res, next) => {
  const code = z.coerce.number().int().positive().safeParse(req.query.cityCode)
  if (!code.success) return res.status(400).json({ error: 'Укажите корректный cityCode' })
  try {
    const points = await getCityPickupPoints(code.data)
    res.json({ pickupPoints: points })
  } catch (error) {
    reportError(error, res, next)
  }
})

router.post('/quote', authRequired, async (req, res, next) => {
  const schema = z.object({
    items: z.array(itemSchema).min(1).max(255),
    cityCode: z.coerce.number().int().positive(),
    cityName: z.string().trim().max(255).optional(),
    pickupPointCode: z.string().trim().min(1).max(255).optional(),
    deliveryPointCode: z.string().trim().min(1).max(255).optional(),
    pvzCode: z.string().trim().min(1).max(255).optional(),
  }).refine(data => Boolean(data.pickupPointCode || data.deliveryPointCode || data.pvzCode))
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Некорректные данные для расчёта доставки' })
  const pointCode = parsed.data.pickupPointCode || parsed.data.deliveryPointCode || parsed.data.pvzCode
  try {
    const quote = await quoteCartDelivery(parsed.data.items, parsed.data.cityCode, pointCode)
    res.json({
      goodsTotal: quote.goodsTotal,
      deliveryPrice: quote.deliveryPrice,
      grandTotal: quote.total,
      tariff: {
        code: Number(quote.tariff.tariff_code),
        name: quote.tariff.tariff_name,
        deliveryMode: Number(quote.tariff.delivery_mode),
        periodMin: Number(quote.tariff.period_min),
        periodMax: Number(quote.tariff.period_max),
        calendarMin: quote.tariff.calendar_min == null ? null : Number(quote.tariff.calendar_min),
        calendarMax: quote.tariff.calendar_max == null ? null : Number(quote.tariff.calendar_max),
      },
      city: { code: quote.city.code, name: quote.city.city },
      pickupPoint: {
        code: quote.point.code,
        address: quote.point.location?.address || quote.point.address || null,
      },
    })
  } catch (error) {
    reportError(error, res, next)
  }
})

export default router
