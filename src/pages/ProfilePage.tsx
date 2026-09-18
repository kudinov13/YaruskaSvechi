import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import '../App.css'

type Order = {
  id: string; total: number; status: string; cdekTrack?: string; address?: string; createdAt: string;
  items: { id: string; title: string; price: number; quantity: number }[]
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Новый', PAID: 'Оплачен', ASSEMBLED: 'Собирается', SHIPPED: 'Отправлен', DELIVERED: 'Доставлен', CANCELLED: 'Отменён',
}

const STATUS_STEPS = ['NEW', 'PAID', 'ASSEMBLED', 'SHIPPED', 'DELIVERED']

export default function ProfilePage() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    api.orders()
      .then(({ orders }) => setOrders(orders))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, navigate])

  if (!user) return null

  const fmtPrice = (n: number) => n.toLocaleString('ru-RU') + ' ₽'
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  const statusIndex = (status: string) => STATUS_STEPS.indexOf(status)

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
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 400, fontSize: '1.5rem', marginBottom: '24px' }}>Мои заказы</h3>
          {loading && <p>Загрузка…</p>}
          {!loading && orders.length === 0 && <p style={{ opacity: .6 }}>Заказов пока нет. <Link to="/catalog">Перейти в каталог</Link></p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {orders.map((order) => {
              const idx = statusIndex(order.status)
              const isCancelled = order.status === 'CANCELLED'
              return (
                <div key={order.id} style={{ border: '1px solid rgba(91,45,35,.15)', padding: '24px', background: 'rgba(255,255,255,.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    <div>
                      <strong>Заказ от {fmtDate(order.createdAt)}</strong>
                      <p style={{ opacity: .6, fontSize: '.85rem', marginTop: '4px' }}>№ {order.id.slice(-8).toUpperCase()}</p>
                    </div>
                    <strong>{fmtPrice(order.total)}</strong>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                    {order.items.map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.9rem' }}>
                        <span>{item.title} × {item.quantity}</span>
                        <span>{fmtPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {!isCancelled ? (
                    <div style={{ borderTop: '1px solid rgba(91,45,35,.1)', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        {STATUS_STEPS.map((step) => (
                          <span key={step} style={{ fontSize: '.75rem', opacity: STATUS_STEPS.indexOf(step) <= idx ? 1 : .4, fontWeight: STATUS_STEPS.indexOf(step) === idx ? 600 : 400 }}>
                            {STATUS_LABELS[step]}
                          </span>
                        ))}
                      </div>
                      <div style={{ height: '4px', background: 'rgba(91,45,35,.1)', position: 'relative' }}>
                        <div style={{ height: '100%', width: `${(idx / (STATUS_STEPS.length - 1)) * 100}%`, background: '#5b2d23', transition: 'width .6s ease' }}/>
                      </div>
                      {order.cdekTrack && (
                        <p style={{ marginTop: '12px', fontSize: '.85rem' }}>
                          Трек-номер СДЭК: <strong>{order.cdekTrack}</strong>
                          <a href={`https://www.cdek.ru/ru/tracking?order_id=${order.cdekTrack}`} target="_blank" rel="noreferrer" style={{ marginLeft: '8px', textDecoration: 'underline' }}>Отследить</a>
                        </p>
                      )}
                    </div>
                  ) : (
                    <p style={{ borderTop: '1px solid rgba(91,45,35,.1)', paddingTop: '16px', color: '#8b2a2a', fontSize: '.9rem' }}>Заказ отменён</p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </main>
    </>
  )
}
