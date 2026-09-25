import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, type Order } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import '../App.css'

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: 'Ожидает оплаты', WAITING_FOR_CAPTURE: 'Ожидает подтверждения оплаты', SUCCEEDED: 'Оплачен', PAID: 'Оплачен',
  CANCELED: 'Оплата отменена', CANCELLED: 'Оплата отменена', FAILED: 'Ошибка оплаты', REFUNDED: 'Возврат выполнен',
}

export default function ProfilePage() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [ordersError, setOrdersError] = useState('')

  const loadOrders = useCallback(async (background = false) => {
    if (background) setRefreshing(true)
    else setLoading(true)
    try {
      const result = await api.orders()
      setOrders(result.orders as Order[])
      setOrdersError('')
    } catch (error) {
      setOrdersError(error instanceof Error ? error.message : 'Не удалось загрузить заказы')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    void loadOrders()
    const interval = window.setInterval(() => { void loadOrders(true) }, 30000)
    return () => window.clearInterval(interval)
  }, [user, navigate, loadOrders])

  if (!user) return null

  const fmtPrice = (n?: number) => typeof n === 'number' ? n.toLocaleString('ru-RU') + ' ₽' : '—'
  const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

  return (
    <><PageHeader />
    <main className="profile-page section-light" style={{ minHeight: '100svh', paddingTop: '120px', paddingBottom: '60px' }}>
      <div className="shell" style={{ maxWidth: '900px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '48px' }}>
          <div>
            <p className="eyebrow">Личный кабинет</p>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3rem)' }}>Здравствуйте, {user.name}</h2>
            <p style={{ opacity: .6 }}>{user.email}{user.phone ? ` · ${user.phone}` : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {isAdmin && <Link to="/admin" className="arrow-link"><span>Админ-панель</span></Link>}
            <Link to="/catalog" className="arrow-link"><span>Каталог</span></Link>
            <Link to="/favorites" className="arrow-link"><span>Избранное</span></Link>
            <Link to="/cart" className="arrow-link"><span>Корзина</span></Link>
            <button onClick={() => { logout(); navigate('/') }} className="arrow-link" style={{ cursor: 'pointer', border: 'none' }}><span>Выйти</span></button>
          </div>
        </header>

        <section>
          <div className="orders-heading">
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 400, fontSize: '1.5rem' }}>Мои заказы</h3>
            <button type="button" className="orders-refresh" onClick={() => void loadOrders(true)} disabled={refreshing}>{refreshing ? 'Обновление…' : 'Обновить статусы'}</button>
          </div>
          {loading && <p>Загрузка…</p>}
          {ordersError && <p className="checkout-error" role="alert">{ordersError}</p>}
          {!loading && !ordersError && orders.length === 0 && <p style={{ opacity: .6 }}>Заказов пока нет. <Link to="/catalog">Перейти в каталог</Link></p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {orders.map((order) => {
              const paymentStatus = order.paymentStatus?.toUpperCase() || ''
              const total = order.total ?? ((order.goodsTotal || 0) + (order.deliveryPrice || 0))
              return (
                <article key={order.id} style={{ border: '1px solid rgba(91,45,35,.15)', padding: '24px', background: 'rgba(255,255,255,.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    <div>
                      <strong>Заказ от {fmtDate(order.createdAt)}</strong>
                      <p style={{ opacity: .6, fontSize: '.85rem', marginTop: '4px' }}>№ {order.id.slice(-8).toUpperCase()}</p>
                    </div>
                    <strong>{fmtPrice(total)}</strong>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                    {(order.items || []).map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.9rem', gap: '12px' }}>
                        <span>{item.title} × {item.quantity}</span>
                        <span>{fmtPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <dl className="order-status-details">
                    <div><dt>Оплата</dt><dd>{PAYMENT_LABELS[paymentStatus] || order.paymentStatus || 'Статус пока не получен'}</dd></div>
                    {typeof order.goodsTotal === 'number' && <div><dt>Товары</dt><dd>{fmtPrice(order.goodsTotal)}</dd></div>}
                    {typeof order.deliveryPrice === 'number' && <div><dt>Доставка</dt><dd>{fmtPrice(order.deliveryPrice)}</dd></div>}
                    <div><dt>СДЭК</dt><dd>{order.cdekStatus || 'Информация о доставке пока не обновлена'}{order.cdekStatusCode !== undefined && order.cdekStatusCode !== null ? ` · код ${order.cdekStatusCode}` : ''}</dd></div>
                  </dl>
                  {order.cdekTrack && (
                    <p style={{ marginTop: '14px', fontSize: '.9rem' }}>
                      Трек-номер СДЭК: <strong>{order.cdekTrack}</strong>
                      <a href={`https://www.cdek.ru/ru/tracking?order_id=${encodeURIComponent(order.cdekTrack)}`} target="_blank" rel="noreferrer" style={{ marginLeft: '8px', textDecoration: 'underline' }}>Отследить на сайте СДЭК</a>
                    </p>
                  )}
                  {paymentStatus && ['PENDING', 'WAITING_FOR_CAPTURE'].includes(paymentStatus) && (
                    <p className="checkout-help" style={{ marginTop: '12px' }}>Заказ ожидает оплаты и пока не считается оплаченным.</p>
                  )}
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </main>
    </>
  )
}
