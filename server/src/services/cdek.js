const DEFAULT_API_URL = 'https://api.cdek.ru'
const WEBHOOK_URL = 'https://yaruska.ru/api/webhooks/cdek'

let tokenCache = null
let tokenPromise = null
const shipmentPromises = new Map()

function cdekConfig() {
  const account = process.env.CDEK_ACCOUNT
  const securePassword = process.env.CDEK_SECURE_PASSWORD
  if (!account || !securePassword) throw new Error('CDEK is not configured')
  return {
    account,
    securePassword,
    baseUrl: (process.env.CDEK_API_URL || DEFAULT_API_URL).replace(/\/+$/, ''),
  }
}

async function requestJson(url, options, errorMessage) {
  let response
  try {
    response = await fetch(url, options)
  } catch {
    throw new Error(errorMessage)
  }
  if (!response.ok) {
    const error = new Error(errorMessage)
    error.status = response.status
    throw error
  }
  try {
    return await response.json()
  } catch {
    throw new Error('CDEK returned an invalid response')
  }
}

async function getAccessToken() {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.value
  if (tokenPromise) return tokenPromise

  tokenPromise = (async () => {
    const { account, securePassword, baseUrl } = cdekConfig()
    const url = new URL('/v2/oauth/token', baseUrl)
    url.searchParams.set('grant_type', 'client_credentials')
    url.searchParams.set('client_id', account)
    url.searchParams.set('client_secret', securePassword)
    const token = await requestJson(url, { method: 'POST', headers: { Accept: 'application/json' } }, 'CDEK authorization failed')
    if (!token?.access_token || !Number.isFinite(Number(token.expires_in))) {
      throw new Error('CDEK returned an invalid authorization response')
    }
    const expiresInMs = Math.max(0, Number(token.expires_in) * 1000 - 60_000)
    tokenCache = { value: token.access_token, expiresAt: Date.now() + expiresInMs }
    return tokenCache.value
  })()

  try {
    return await tokenPromise
  } finally {
    tokenPromise = null
  }
}

async function cdekRequest(path, { method = 'GET', query, body } = {}) {
  const { baseUrl } = cdekConfig()
  const token = await getAccessToken()
  const url = new URL(path, baseUrl)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
    }
  }
  return requestJson(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }, 'CDEK request failed')
}

export async function suggestCities(name) {
  return cdekRequest('/v2/location/suggest/cities', { query: { name, country_code: 'RU' } })
}

export async function getCitiesByCode(code) {
  return cdekRequest('/v2/location/cities', { query: { code, country_codes: 'RU', size: 10 } })
}

export async function getDeliveryPoints({ cityCode, code } = {}) {
  return cdekRequest('/v2/deliverypoints', {
    query: {
      ...(cityCode ? { city_code: cityCode } : {}),
      ...(code ? { code } : {}),
      country_code: 'RU',
      type: 'PVZ',
      is_reception: true,
      is_handout: true,
      lang: 'rus',
    },
  })
}

export async function quoteTariffs({ cityCode, deliveryPointCode, packages }) {
  const fromCode = Number(process.env.CDEK_SENDER_CITY_CODE || 467)
  const response = await cdekRequest('/v2/calculator/tarifflist', {
    method: 'POST',
    body: {
      type: 1,
      from_location: { code: fromCode, country_code: 'RU' },
      to_location: { code: Number(cityCode), country_code: 'RU' },
      shipment_point: process.env.CDEK_SHIPMENT_POINT || 'BTV7',
      delivery_point: deliveryPointCode,
      packages: packages.map(({ weight, length, width, height }) => ({ weight, length, width, height })),
    },
  })
  const tariffs = (response?.tariff_codes || []).filter(tariff => Number(tariff.delivery_mode) === 4
    && Number.isFinite(Number(tariff.delivery_sum))
    && Number(tariff.delivery_sum) >= 0)
  if (!tariffs.length) throw new Error('CDEK has no warehouse-to-warehouse tariff for this route')
  tariffs.sort((a, b) => Number(a.delivery_sum) - Number(b.delivery_sum))
  return tariffs[0]
}

export async function getCdekOrder({ uuid, number }) {
  if (uuid) return cdekRequest(`/v2/orders/${encodeURIComponent(uuid)}`)
  if (number) return cdekRequest('/v2/orders', { query: { im_number: number } })
  throw new Error('CDEK order reference is missing')
}

export async function createCdekOrder(payload) {
  return cdekRequest('/v2/orders', { method: 'POST', body: payload })
}

function webhookList(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.entity)) return response.entity
  if (Array.isArray(response?.entities)) return response.entities
  if (Array.isArray(response?.items)) return response.items
  return []
}

export async function ensureCdekStatusWebhook() {
  const current = webhookList(await cdekRequest('/v2/webhooks'))
  if (current.some(webhook => webhook.type === 'ORDER_STATUS' && webhook.url === WEBHOOK_URL)) return
  await cdekRequest('/v2/webhooks', {
    method: 'POST',
    body: { type: 'ORDER_STATUS', url: WEBHOOK_URL },
  })
}

function orderEntity(response) {
  if (response?.entity && !Array.isArray(response.entity)) return response.entity
  if (Array.isArray(response?.entity)) return response.entity[0]
  if (Array.isArray(response?.entities)) return response.entities[0]
  return response
}

export function extractCdekOrder(response) {
  return orderEntity(response)
}

export async function createShipmentOnce(order, packages) {
  if (order.cdekOrderUuid) return order.cdekOrderUuid
  if (shipmentPromises.has(order.id)) return shipmentPromises.get(order.id)

  const pending = (async () => {
    const number = `Y${order.id}`
    let existing
    try {
      existing = orderEntity(await getCdekOrder({ number }))
    } catch (error) {
      if (error.status !== 404 && error.status !== 400) throw error
    }
    if (existing?.uuid) return existing.uuid

    const name = process.env.CDEK_SENDER_NAME
    const email = process.env.CDEK_SENDER_EMAIL
    const phone = process.env.CDEK_SENDER_PHONE
    if (!name || !email || !phone) throw new Error('CDEK sender contact is not configured')

    const payload = {
      type: 1,
      number,
      tariff_code: order.deliveryTariffCode,
      shipment_point: process.env.CDEK_SHIPMENT_POINT || 'BTV7',
      delivery_point: order.deliveryPointCode,
      sender: { name, phones: [{ number: phone }], email },
      recipient: {
        name: order.recipientName,
        email: order.recipientEmail,
        phones: [{ number: order.recipientPhone }],
      },
      packages: packages.map((pkg, index) => ({
        number: `${number}-${index + 1}`,
        weight: pkg.weight,
        length: pkg.length,
        width: pkg.width,
        height: pkg.height,
        items: pkg.items.map(item => ({
          name: item.title,
          ware_key: item.slug,
          amount: item.quantity,
          cost: item.price,
          payment: { value: 0 },
          weight: item.weight,
        })),
      })),
    }
    const created = await createCdekOrder(payload)
    const entity = orderEntity(created)
    if (!entity?.uuid) throw new Error('CDEK accepted the order without returning its UUID')
    return entity.uuid
  })()

  shipmentPromises.set(order.id, pending)
  try {
    return await pending
  } finally {
    shipmentPromises.delete(order.id)
  }
}

export { WEBHOOK_URL }
