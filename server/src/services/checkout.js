import { prisma } from '../db.js'
import { getCitiesByCode, getDeliveryPoints, quoteTariffs, suggestCities } from './cdek.js'

export const PACKAGE_PRESETS = Object.freeze({
  p25x25x10: { length: 25, width: 25, height: 10, maxWeightGrams: 2000 },
  p50x25x15: { length: 50, width: 25, height: 15, maxWeightGrams: 3000 },
  p40x30x20: { length: 40, width: 30, height: 20, maxWeightGrams: 3000 },
  p50x30x30: { length: 50, width: 30, height: 30, maxWeightGrams: 5000 },
})

export class CheckoutError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

function asArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.entity)) return value.entity
  if (Array.isArray(value?.cities)) return value.cities
  if (value?.code !== undefined) return [value]
  if (value?.entity?.code !== undefined) return [value.entity]
  return []
}

export async function prepareCart(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 255) {
    throw new CheckoutError('Корзина должна содержать от 1 до 255 товарных позиций')
  }
  const ids = [...new Set(items.map(item => item.candleId))]
  const candles = await prisma.candle.findMany({ where: { id: { in: ids } } })
  if (candles.length !== ids.length) throw new CheckoutError('Некоторые товары не найдены')
  const candleById = new Map(candles.map(candle => [candle.id, candle]))
  const lines = []
  const packages = []
  let goodsTotal = 0

  for (const item of items) {
    const candle = candleById.get(item.candleId)
    const variants = Array.isArray(candle.variants) ? candle.variants : []
    const variant = variants.find(option => option.id === item.variantId)
    if ((variants.length && !variant) || (!variants.length && item.variantId)) {
      throw new CheckoutError('Выбран недоступный вариант товара')
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) {
      throw new CheckoutError('Количество товара должно быть от 1 до 999')
    }

    const weight = candle.shippingWeightGrams
    const presetKey = candle.shippingPackagePreset
    const preset = PACKAGE_PRESETS[presetKey]
    if (!Number.isInteger(weight) || weight <= 0 || !preset) {
      throw new CheckoutError(`Для товара «${candle.title}» не настроены вес и допустимый формат упаковки`)
    }
    const packageWeight = weight * item.quantity
    if (!Number.isSafeInteger(packageWeight) || packageWeight > preset.maxWeightGrams) {
      throw new CheckoutError(`Вес позиции «${candle.title}» превышает вместимость упаковки ${presetKey}`)
    }
    const title = variant ? `${candle.title} — ${variant.name}` : candle.title
    const lineTotal = candle.price * item.quantity
    if (!Number.isSafeInteger(lineTotal)) throw new CheckoutError('Сумма заказа превышает допустимое значение')
    goodsTotal += lineTotal
    lines.push({ candleId: candle.id, title, price: candle.price, quantity: item.quantity })
    packages.push({
      ...preset,
      weight: packageWeight,
      items: [{
        title,
        slug: candle.slug,
        quantity: item.quantity,
        price: candle.price,
        weight,
      }],
    })
  }

  if (!Number.isSafeInteger(goodsTotal) || goodsTotal <= 0) throw new CheckoutError('Некорректная сумма товаров')
  return { lines, packages, goodsTotal }
}

export async function getCanonicalCity(cityCode) {
  const numericCode = Number(cityCode)
  if (!Number.isInteger(numericCode) || numericCode <= 0) throw new CheckoutError('Укажите корректный город доставки')
  let response
  try {
    response = await getCitiesByCode(numericCode)
  } catch {
    throw new CheckoutError('Не удалось проверить город доставки в СДЭК', 502)
  }
  const city = asArray(response).find(candidate => Number(candidate.code) === numericCode
    && (!candidate.country_code || candidate.country_code === 'RU'))
  if (!city) throw new CheckoutError('Город доставки не найден в СДЭК')
  return city
}

export async function validatePickupPoint(cityCode, pointCode) {
  if (typeof pointCode !== 'string' || !pointCode.trim()) throw new CheckoutError('Укажите пункт выдачи СДЭК')
  let response
  try {
    response = await getDeliveryPoints({ cityCode, code: pointCode.trim() })
  } catch {
    throw new CheckoutError('Не удалось проверить пункт выдачи в СДЭК', 502)
  }
  const points = asArray(response)
  const point = points.find(candidate => candidate.code === pointCode.trim()
    && Number(candidate.location?.city_code ?? candidate.city_code) === Number(cityCode)
    && candidate.type === 'PVZ'
    && candidate.is_reception !== false
    && candidate.is_handout !== false
    && candidate.is_closed !== true
    && candidate.is_active !== false
    && (!candidate.status || candidate.status === 'ACTIVE'))
  if (!point) throw new CheckoutError('Пункт выдачи недоступен для приёма или выдачи отправлений')
  return point
}

export async function quoteCartDelivery(items, cityCode, pointCode) {
  const cart = await prepareCart(items)
  const city = await getCanonicalCity(cityCode)
  const point = await validatePickupPoint(city.code, pointCode)
  let tariff
  try {
    tariff = await quoteTariffs({ cityCode: city.code, deliveryPointCode: point.code, packages: cart.packages })
  } catch (error) {
    if (error instanceof CheckoutError) throw error
    throw new CheckoutError(error.message || 'Не удалось рассчитать доставку СДЭК', 502)
  }
  const deliveryPrice = Math.ceil(Number(tariff.delivery_sum))
  if (!Number.isSafeInteger(deliveryPrice) || deliveryPrice < 0) {
    throw new CheckoutError('СДЭК вернул некорректную стоимость доставки', 502)
  }
  return {
    ...cart,
    deliveryPrice,
    total: cart.goodsTotal + deliveryPrice,
    city,
    point,
    tariff,
  }
}

export async function getDeliveryCities(query) {
  try {
    return await suggestCities(query)
  } catch {
    throw new CheckoutError('Не удалось получить список городов СДЭК', 502)
  }
}

export async function prepareStoredShipment(orderId) {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    include: { candle: true },
    orderBy: { id: 'asc' },
  })
  if (!items.length) throw new CheckoutError('Заказ не содержит товаров')
  return items.map(item => {
    const candle = item.candle
    const preset = PACKAGE_PRESETS[candle?.shippingPackagePreset]
    const weight = candle?.shippingWeightGrams
    if (!Number.isInteger(weight) || weight <= 0 || !preset) {
      throw new CheckoutError(`Для товара «${item.title}» не настроены вес и допустимый формат упаковки`)
    }
    const packageWeight = weight * item.quantity
    if (!Number.isSafeInteger(packageWeight) || packageWeight > preset.maxWeightGrams) {
      throw new CheckoutError(`Вес позиции «${item.title}» превышает вместимость упаковки ${candle.shippingPackagePreset}`)
    }
    return {
      ...preset,
      weight: packageWeight,
      items: [{
        title: item.title,
        slug: candle.slug,
        quantity: item.quantity,
        price: item.price,
        weight,
      }],
    }
  })
}

export async function getCityPickupPoints(cityCode) {
  const city = await getCanonicalCity(cityCode)
  let response
  try {
    response = await getDeliveryPoints({ cityCode: city.code })
  } catch {
    throw new CheckoutError('Не удалось получить пункты выдачи СДЭК', 502)
  }
  return asArray(response).filter(point => Number(point.location?.city_code ?? point.city_code) === Number(city.code)
    && point.type === 'PVZ'
    && point.is_reception !== false
    && point.is_handout !== false
    && point.is_closed !== true
    && point.is_active !== false)
}
