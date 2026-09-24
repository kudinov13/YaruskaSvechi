import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { api, imgUrl } from '../lib/api'
import PageHeader from '../components/PageHeader'
import '../App.css'

const fmtPrice = (n: number) => n.toLocaleString('ru-RU') + ' ₽'
const imgSrc = (img?: string) => imgUrl(img)

export default function CartPage() {
  const { items, setQty, remove, total, clear } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [ordered, setOrdered] = useState(false)
  const [ordering, setOrdering] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [offerAccepted, setOfferAccepted] = useState(false)
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false)

  const checkout = async () => {
    if (!user) {
      navigate('/login?redirect=/cart')
      return
    }
    if (!offerAccepted || !dataProcessingConsent) {
      setOrderError('Для оформления заказа примите условия оферты и дайте согласие на обработку персональных данных')
      return
    }
    if (ordering || items.length === 0) return
    setOrdering(true)
    setOrderError('')
    try {
      await api.createOrder({ items: items.map((i) => ({ id: i.id, candleId: i.productId || i.id, variantId: i.variantId, title: i.title, price: i.price, quantity: i.quantity })), total, offerAccepted, dataProcessingConsent })
      clear()
      setOrdered(true)
    } catch (e) {
      setOrderError((e as Error).message)
    } finally {
      setOrdering(false)
    }
  }

  if (ordered) {
    return (
      <>
        <PageHeader/>
        <main className="cart-page section-light" style={{ minHeight: '100svh', paddingTop: '120px', paddingBottom: '60px' }}>
        <div className="shell" style={{ maxWidth: '700px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: '2.5rem', marginBottom: '16px' }}>Заявка на заказ получена</h2>
          <p style={{ opacity: .6, marginBottom: '32px' }}>Оплата на сайте пока недоступна. Мы свяжемся с вами, уточним доставку и согласуем способ оплаты.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/profile" className="arrow-link"><span>Мои заказы</span></Link>
            <Link to="/catalog" className="arrow-link"><span>Продолжить покупки</span></Link>
          </div>
        </div>
        </main>
      </>
    )
  }

  if (items.length === 0) {
    return (
      <>
        <PageHeader/>
        <main className="cart-page section-light" style={{ minHeight: '100svh', paddingTop: '120px', paddingBottom: '60px' }}>
        <div className="shell" style={{ maxWidth: '700px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: '2.5rem', marginBottom: '16px' }}>Корзина пуста</h2>
          <p style={{ opacity: .6, marginBottom: '32px' }}>Добавьте товары из каталога, чтобы оформить заказ.</p>
          <Link to="/catalog" className="arrow-link"><span>В каталог</span></Link>
        </div>
        </main>
      </>
    )
  }

  return (
    <>
      <PageHeader/>
      <main className="cart-page section-light" style={{ minHeight: '100svh', paddingTop: '120px', paddingBottom: '60px' }}>
      <div className="shell" style={{ maxWidth: '900px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p className="eyebrow">Корзина</p>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 'clamp(1.8rem, 3vw, 2.5rem)' }}>Ваш заказ</h2>
          </div>
          <button onClick={clear} style={{ padding: '8px 16px', border: '1px solid rgba(91,45,35,.2)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.85rem' }}>Очистить</button>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto auto', gap: '16px', alignItems: 'center', padding: '16px', border: '1px solid rgba(91,45,35,.15)', background: 'rgba(255,255,255,.4)' }} className="cart-row">
              <Link to={`/product/${item.productId || item.id}`} style={{ width: '80px', height: '80px', display: 'block', position: 'relative', overflow: 'hidden' }}>
                {item.image ? <img src={imgSrc(item.image)} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}/> : <div className="placeholder-frame" style={{ width: '100%', height: '100%' }}><small>Фото</small></div>}
              </Link>
              <div>
                <Link to={`/product/${item.productId || item.id}`} style={{ fontWeight: 600, textDecoration: 'none', color: 'inherit' }}>{item.title}</Link>
                <p style={{ fontSize: '.85rem', opacity: .6, marginTop: '4px' }}>{fmtPrice(item.price)} / шт</p>
              </div>
              <div className="cart-qty">
                <button onClick={() => setQty(item.id, item.quantity - 1)} aria-label={`Уменьшить количество ${item.title}`}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => setQty(item.id, item.quantity + 1)} aria-label={`Увеличить количество ${item.title}`}>+</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <strong>{fmtPrice(item.price * item.quantity)}</strong>
                <button onClick={() => remove(item.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '.8rem', opacity: .5, padding: 0 }}>Удалить</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', border: '1px solid rgba(91,45,35,.2)', background: 'rgba(255,255,255,.5)', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '.9rem' }}>
            <label className="legal-consent">
              <input type="checkbox" checked={offerAccepted} onChange={(e) => setOfferAccepted(e.target.checked)} required/>
              <span>Принимаю условия <Link to="/offer" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>публичной оферты</Link>.</span>
            </label>
            <label className="legal-consent">
              <input type="checkbox" checked={dataProcessingConsent} onChange={(e) => setDataProcessingConsent(e.target.checked)} required/>
              <span>Даю <Link to="/consent" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>согласие на обработку персональных данных</Link> и ознакомлен(а) с <Link to="/privacy" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>политикой конфиденциальности</Link>.</span>
            </label>
          </div>
          <div>
            <p style={{ opacity: .6, fontSize: '.85rem' }}>Итого</p>
            <strong style={{ fontSize: '1.8rem', fontFamily: 'Cormorant Garamond, serif' }}>{fmtPrice(total)}</strong>
            <p style={{ fontSize: '.8rem', opacity: .5, marginTop: '4px' }}>без учёта доставки</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/catalog" className="arrow-link"><span>Продолжить покупки</span></Link>
            <button onClick={checkout} disabled={ordering} className="arrow-link" style={{ background: '#5b2d23', color: '#eee8df', cursor: 'pointer', border: 'none' }}><span style={{ color: '#eee8df' }}>{ordering ? 'Отправка…' : 'Отправить заявку'}</span></button>
          </div>
          {orderError && <p style={{ color: '#8b2a2a', fontSize: '.9rem', width: '100%' }}>{orderError}</p>}
        </div>
      </div>
      </main>
    </>
  )
}
