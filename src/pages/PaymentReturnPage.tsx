import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { api, type Order } from '../lib/api'
import PageHeader from '../components/PageHeader'
import '../App.css'

type PaymentState = 'checking' | 'pending' | 'success' | 'canceled' | 'error'

const paidStatuses = new Set(['SUCCEEDED', 'PAID'])
const canceledStatuses = new Set(['CANCELED', 'CANCELLED', 'VOIDED', 'EXPIRED'])
const errorStatuses = new Set(['FAILED', 'ERROR'])

export default function PaymentReturnPage() {
  const { user, loading: authLoading } = useAuth()
  const { clear } = useCart()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId') || searchParams.get('id') || ''
  const [state, setState] = useState<PaymentState>('checking')
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!authLoading && !user) navigate(`/login?redirect=${encodeURIComponent(`/payment-return?orderId=${orderId}`)}`)
  }, [authLoading, navigate, orderId, user])

  useEffect(() => {
    if (!user || !orderId) {
      if (!orderId) {
        setState('error')
        setError('В ссылке отсутствует номер заказа. Найдите заказ в личном кабинете.')
      }
      return
    }
    let active = true
    let timer = 0
    setState('checking')
    setError('')

    const checkPayment = async () => {
      try {
        const result = await api.order(orderId)
        if (!active) return
        const currentOrder = result.order
        setOrder(currentOrder)
        const paymentStatus = (currentOrder.paymentStatus || '').toUpperCase()
        if (paidStatuses.has(paymentStatus)) {
          clear()
          setState('success')
          return
        }
        if (canceledStatuses.has(paymentStatus)) {
          setState('canceled')
          return
        }
        if (errorStatuses.has(paymentStatus)) {
          setState('error')
          setError('Платёж не прошёл. Корзина сохранена, заказ можно проверить в личном кабинете.')
          return
        }
        setState('pending')
        timer = window.setTimeout(checkPayment, 3000)
      } catch (requestError) {
        if (!active) return
        setState('error')
        setError(requestError instanceof Error ? requestError.message : 'Не удалось проверить оплату. Попробуйте ещё раз.')
      }
    }

    void checkPayment()
    return () => { active = false; window.clearTimeout(timer) }
  }, [clear, orderId, retry, user])

  const statusText = state === 'checking' ? 'Проверяем оплату…'
    : state === 'pending' ? 'Платёж ожидает подтверждения. Страница проверит статус автоматически.'
      : state === 'success' ? 'Оплата подтверждена. Заказ передан в обработку.'
        : state === 'canceled' ? 'Оплата отменена. Корзина сохранена, заказ не оплачен.'
          : 'Не удалось подтвердить оплату.'

  return (
    <>
      <PageHeader />
      <main className="payment-return-page section-light" style={{ minHeight: '100svh', paddingTop: '120px', paddingBottom: '60px' }}>
        <div className="shell payment-return-card">
          <p className="eyebrow">Статус оплаты</p>
          <h1>{state === 'success' ? 'Спасибо за заказ' : state === 'canceled' ? 'Оплата не завершена' : state === 'error' ? 'Статус заказа не подтверждён' : 'Проверка платежа'}</h1>
          <p role="status">{statusText}</p>
          {orderId && <p className="checkout-help">Заказ № {orderId.slice(-8).toUpperCase()}{order?.paymentStatus ? ` · ${order.paymentStatus}` : ''}</p>}
          {error && <p className="checkout-error" role="alert">{error}</p>}
          {(state === 'error' || state === 'pending') && orderId && user && (
            <button type="button" className="arrow-link" onClick={() => setRetry((value) => value + 1)}><span>Проверить снова</span></button>
          )}
          <div className="payment-return-links">
            {orderId && <Link to={`/profile`} className="arrow-link"><span>Мои заказы</span></Link>}
            <Link to="/catalog" className="arrow-link"><span>В каталог</span></Link>
          </div>
        </div>
      </main>
    </>
  )
}
