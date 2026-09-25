const DEFAULT_API_URL = 'https://api.yookassa.ru/v3'

function yookassaConfig() {
  const shopId = process.env.YOOKASSA_SHOP_ID
  const secretKey = process.env.YOOKASSA_SECRET_KEY
  if (!shopId || !secretKey) throw new Error('YooKassa is not configured')
  return {
    baseUrl: (process.env.YOOKASSA_API_URL || DEFAULT_API_URL).replace(/\/+$/, ''),
    authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`,
  }
}

async function yookassaRequest(path, { method = 'GET', body, idempotenceKey } = {}) {
  const config = yookassaConfig()
  let response
  try {
    response = await fetch(`${config.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: config.authorization,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(idempotenceKey ? { 'Idempotence-Key': idempotenceKey } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    throw new Error('YooKassa is temporarily unavailable')
  }

  if (!response.ok) throw new Error('YooKassa request failed')
  try {
    return await response.json()
  } catch {
    throw new Error('YooKassa returned an invalid response')
  }
}

export async function createYooKassaPayment({ orderId, amountRubles, description }) {
  if (!Number.isSafeInteger(amountRubles) || amountRubles <= 0) {
    throw new Error('Payment amount must be a positive whole number of rubles')
  }
  const payment = await yookassaRequest('/payments', {
    method: 'POST',
    idempotenceKey: orderId,
    body: {
      amount: { value: `${amountRubles}.00`, currency: 'RUB' },
      capture: true,
      confirmation: { type: 'redirect', return_url: `https://yaruska.ru/payment-return?orderId=${encodeURIComponent(orderId)}` },
      description: String(description || `Оплата заказа ${orderId}`).slice(0, 128),
      metadata: { orderId },
    },
  })
  if (!payment?.id || !payment?.confirmation?.confirmation_url || !payment?.status) {
    throw new Error('YooKassa returned an incomplete payment')
  }
  return payment
}

export async function getYooKassaPayment(paymentId) {
  if (!paymentId || typeof paymentId !== 'string') throw new Error('Invalid YooKassa payment id')
  return yookassaRequest(`/payments/${encodeURIComponent(paymentId)}`)
}
