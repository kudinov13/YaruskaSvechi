// Боевой прогон уведомления: создаёт настоящий заказ через API
// (тестовый товар за 1 ₽). Запускать на сервере: cd /opt/yaruska-api && node test-order.mjs
const API = 'http://127.0.0.1:4000/api'

async function call(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${options.method || 'GET'} ${path} → ${res.status}: ${JSON.stringify(data).slice(0, 300)}`)
  return data
}

const email = `tg-test-${Date.now()}@yaruska.test`
const password = 'TestPass1234'
const reg = await call('/auth/register', {
  method: 'POST',
  body: JSON.stringify({ email, name: 'Тест Уведомлений', password, phone: '+79990001122', dataProcessingConsent: true }),
})
const token = reg.token
console.log('user registered:', email)

const { items: products } = await call('/products')
const test = products.find((p) => Number(p.price) <= 1) || products[0]
console.log('product:', test.id, test.title, test.price)

const { cities } = await call(`/delivery/cities?q=${encodeURIComponent('Москва')}`)
const city = cities[0]
console.log('city:', city.city, city.code)

const { pickupPoints } = await call(`/delivery/pickup-points?cityCode=${city.code}`)
const point = pickupPoints[0]
console.log('point:', point.code, point.name || point.address)

const created = await call('/orders', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    items: [{ candleId: test.id, quantity: 1 }],
    recipientName: 'Тестов Уведомлений',
    recipientPhone: '+79990001122',
    recipientEmail: email,
    cityCode: city.code,
    cityName: city.city,
    deliveryPointCode: point.code,
    comment: 'Ароматы: тестовая свеча — «Таёжные дали»\n\nТЕСТОВЫЙ ЗАКАЗ — проверка уведомлений в Telegram, оплачивать не нужно',
    offerAccepted: true,
    dataProcessingConsent: true,
  }),
})
console.log('order created:', created.order?.id, 'total:', created.order?.total)
console.log('payment url:', created.confirmationUrl)
