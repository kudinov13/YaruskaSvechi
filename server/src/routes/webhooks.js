import { Router } from 'express'
import { prisma } from '../db.js'
import { getYooKassaPayment } from '../services/yookassa.js'
import {
  ensureCdekStatusWebhook,
  createShipmentOnce,
  extractCdekOrder,
  getCdekOrder,
} from '../services/cdek.js'
import { prepareStoredShipment } from '../services/checkout.js'

const router = Router()

function amountInKopecks(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return null
  const kopecks = Math.round(amount * 100)
  return Math.abs(amount * 100 - kopecks) < 0.000001 ? kopecks : null
}

async function handleYooKassaNotification(notification) {
  const paymentId = notification?.object?.id
  if (typeof paymentId !== 'string' || !paymentId) return

  const payment = await getYooKassaPayment(paymentId)
  const orderId = payment?.metadata?.orderId
  if (!orderId || payment.id !== paymentId || !['succeeded', 'canceled', 'pending', 'waiting_for_capture'].includes(payment.status)) return

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || order.paymentId !== paymentId) return
  if (payment.amount?.currency !== 'RUB'
    || amountInKopecks(payment.amount?.value) !== order.total * 100) return

  if (payment.status === 'succeeded') {
    if (order.paymentStatus !== 'SUCCEEDED') {
      await prisma.order.updateMany({
        where: { id: order.id, paymentId: paymentId, paymentStatus: { not: 'CANCELED' } },
        data: { paymentStatus: 'SUCCEEDED', status: 'PAID' },
      })
    }
    const paidOrder = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } })
    if (paidOrder?.paymentStatus !== 'SUCCEEDED') return
    if (paidOrder.cdekOrderUuid) return

    await ensureCdekStatusWebhook()
    const packages = await prepareStoredShipment(paidOrder.id)
    const uuid = await createShipmentOnce(paidOrder, packages)
    await prisma.order.updateMany({
      where: { id: paidOrder.id, cdekOrderUuid: null },
      data: { cdekOrderUuid: uuid },
    })
    return
  }

  if (payment.status === 'canceled' && order.paymentStatus !== 'SUCCEEDED') {
    await prisma.order.updateMany({
      where: { id: order.id, paymentId: paymentId, paymentStatus: { not: 'SUCCEEDED' } },
      data: { paymentStatus: 'CANCELED', status: 'CANCELLED' },
    })
  }
}

function notificationNumber(attrs) {
  for (const value of attrs) {
    const number = value?.number || value?.im_number || value?.cdek_number
    if (number !== undefined && number !== null && String(number)) return String(number)
  }
  return null
}

function notificationUuid(attrs, body) {
  for (const value of attrs) {
    if (typeof value?.uuid === 'string' && value.uuid) return value.uuid
    if (typeof value?.order_uuid === 'string' && value.order_uuid) return value.order_uuid
  }
  return typeof body?.uuid === 'string' ? body.uuid : null
}

function localOrderId(number) {
  if (typeof number !== 'string') return null
  return number.startsWith('Y') ? number.slice(1) : number
}

function remoteOrderEntity(response) {
  const entity = extractCdekOrder(response)
  if (entity?.order && !entity.statuses && !entity.cdek_number) return entity.order
  return entity
}

function latestCdekStatus(entity) {
  if (!Array.isArray(entity?.statuses) || !entity.statuses.length) return null
  return [...entity.statuses].sort((a, b) => {
    const dateA = new Date(a.date_time || a.date || 0).getTime()
    const dateB = new Date(b.date_time || b.date || 0).getTime()
    return dateA - dateB
  }).at(-1)
}

function orderStatusForCdek(code) {
  const normalized = String(code || '').toUpperCase()
  if (normalized === 'CREATED'
    || normalized === 'ACCEPTED_AT_SHIPMENT_WAREHOUSE'
    || normalized === 'RECEIVED_AT_SHIPMENT_WAREHOUSE') return 'ASSEMBLED'
  if (normalized === 'DELIVERED') return 'DELIVERED'
  if (normalized === 'NOT_DELIVERED' || normalized === 'REMOVED') return 'CANCELLED'
  if (/^(SENT|RECEIVED|ACCEPTED|READY_FOR_SHIPMENT|IN_TRANSIT|ISSUED)_/.test(normalized)
    && normalized !== 'ACCEPTED_AT_SHIPMENT_WAREHOUSE'
    && normalized !== 'RECEIVED_AT_SHIPMENT_WAREHOUSE') return 'SHIPPED'
  return null
}

async function handleCdekNotification(body) {
  if (body?.type !== 'ORDER_STATUS') return
  const attrs = Array.isArray(body.attributes) ? body.attributes : (body.attributes ? [body.attributes] : [])
  const number = notificationNumber(attrs)
  const eventUuid = notificationUuid(attrs, body)
  let order = null
  if (number) {
    order = await prisma.order.findUnique({ where: { id: localOrderId(number) } }).catch(() => null)
    if (!order) order = await prisma.order.findFirst({ where: { cdekTrack: number } })
  }
  if (!order && eventUuid) order = await prisma.order.findUnique({ where: { cdekOrderUuid: eventUuid } }).catch(() => null)
  if (!order || order.paymentStatus !== 'SUCCEEDED') return

  const remote = remoteOrderEntity(await getCdekOrder({ uuid: order.cdekOrderUuid, number: `Y${order.id}` }))
  if (!remote
    || (order.cdekOrderUuid && remote.uuid && remote.uuid !== order.cdekOrderUuid)
    || (remote.number && remote.number !== `Y${order.id}`)) return
  const status = latestCdekStatus(remote)
  if (!status?.code) return

  const occurredAt = new Date(status.date_time || status.date || body.date_time || Date.now())
  if (Number.isNaN(occurredAt.getTime())) return
  if (order.cdekStatusUpdatedAt && occurredAt < order.cdekStatusUpdatedAt) return
  if (order.cdekStatusCode === String(status.code) && order.cdekStatusUpdatedAt?.getTime() === occurredAt.getTime()) return

  const mappedStatus = orderStatusForCdek(status.code)
  const data = {
    cdekStatusCode: String(status.code),
    cdekStatus: status.name || String(status.code),
    cdekStatusUpdatedAt: occurredAt,
    ...(remote.cdek_number ? { cdekTrack: String(remote.cdek_number) } : {}),
    ...(mappedStatus ? { status: mappedStatus } : {}),
  }
  await prisma.order.updateMany({
    where: { id: order.id, paymentStatus: 'SUCCEEDED' },
    data,
  })
}

export async function syncPendingYooKassaPayments() {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      OR: [
        { paymentStatus: 'PENDING', paymentId: { not: null } },
        { paymentStatus: 'SUCCEEDED', paymentId: { not: null }, cdekOrderUuid: null },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: 20,
    select: { paymentId: true },
  })
  for (const order of orders) {
    try {
      await handleYooKassaNotification({ object: { id: order.paymentId } })
    } catch {}
  }
}

router.post('/yookassa', async (req, res) => {
  try {
    await handleYooKassaNotification(req.body)
    res.sendStatus(200)
  } catch {
    res.sendStatus(500)
  }
})

router.post('/cdek', async (req, res) => {
  if (req.body?.type !== 'ORDER_STATUS') return res.sendStatus(200)
  try {
    await handleCdekNotification(req.body)
    res.sendStatus(200)
  } catch {
    res.sendStatus(500)
  }
})

export default router
