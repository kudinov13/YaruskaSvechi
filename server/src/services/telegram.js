// Уведомления админу в Telegram через Bot API.
// api.telegram.org может быть недоступен с сервера — поэтому запросы идут через TELEGRAM_PROXY.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || ''
const PROXY_URL = process.env.TELEGRAM_PROXY || ''

let dispatcher
async function getDispatcher() {
  if (!PROXY_URL) return undefined
  if (!dispatcher) {
    const { ProxyAgent } = await import('undici')
    dispatcher = new ProxyAgent(PROXY_URL)
  }
  return dispatcher
}

export async function sendTelegramMessage(text) {
  if (!BOT_TOKEN || !CHAT_ID) return
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, disable_web_page_preview: true }),
      dispatcher: await getDispatcher(),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[telegram] sendMessage ${res.status}: ${body.slice(0, 300)}`)
    }
  } catch (error) {
    console.error('[telegram] send failed:', error?.message || error)
  }
}

const fmt = (n) => `${Number(n || 0).toLocaleString('ru-RU')} ₽`
const orderNum = (order) => `#${String(order.id).slice(-8).toUpperCase()}`

function orderBody(order) {
  const lines = [`Заказ ${orderNum(order)}`, '']
  if (order.items?.length) {
    lines.push('Товары:')
    for (const item of order.items) {
      lines.push(`• ${item.title} × ${item.quantity} — ${fmt(item.price * item.quantity)}`)
    }
    lines.push('')
  }
  if (typeof order.goodsTotal === 'number') lines.push(`Товары: ${fmt(order.goodsTotal)}`)
  if (typeof order.deliveryPrice === 'number') lines.push(`Доставка СДЭК: ${fmt(order.deliveryPrice)}`)
  if (typeof order.total === 'number') lines.push(`Итого: ${fmt(order.total)}`)
  if (order.recipientName || order.recipientPhone || order.recipientEmail) {
    lines.push('')
    lines.push(`Получатель: ${order.recipientName || '—'}`)
    if (order.recipientPhone) lines.push(`Телефон: ${order.recipientPhone}`)
    if (order.recipientEmail) lines.push(`Email: ${order.recipientEmail}`)
  }
  if (order.deliveryPointAddress || order.deliveryCity) {
    lines.push(`Пункт выдачи: ${order.deliveryPointAddress || order.deliveryCity}`)
  }
  if (order.comment) {
    lines.push('')
    lines.push(`Комментарий: ${order.comment}`)
  }
  return lines.join('\n')
}

export function notifyNewOrder(order) {
  const message = `НОВЫЙ ЗАКАЗ (ожидает оплаты)\n\n${orderBody(order)}`
  void sendTelegramMessage(message)
}

export function notifyOrderPaid(order) {
  const message = `ЗАКАЗ ОПЛАЧЕН\n\n${orderBody(order)}`
  void sendTelegramMessage(message)
}

export function notifyOrderCanceled(order) {
  const message = `ОПЛАТА ОТМЕНЕНА\n\n${orderBody(order)}`
  void sendTelegramMessage(message)
}

export function notifyOrderShipped(order) {
  const lines = [`ЗАКАЗ ОТПРАВЛЕН ${orderNum(order)}`]
  if (order.cdekTrack) lines.push(`Трек СДЭК: ${order.cdekTrack}`)
  if (order.cdekStatus) lines.push(`Статус: ${order.cdekStatus}`)
  void sendTelegramMessage(lines.join('\n'))
}
