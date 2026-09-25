import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { api, imgUrl, type DeliveryCity, type DeliveryQuote, type PickupPoint } from '../lib/api'
import PageHeader from '../components/PageHeader'
import '../App.css'

const fmtPrice = (n: number) => n.toLocaleString('ru-RU') + ' ₽'
const imgSrc = (img?: string) => imgUrl(img)

export default function CartPage() {
  const { items, setQty, remove, total, clear } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [ordering, setOrdering] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [offerAccepted, setOfferAccepted] = useState(false)
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false)
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [cityQuery, setCityQuery] = useState('')
  const [cities, setCities] = useState<DeliveryCity[]>([])
  const [selectedCity, setSelectedCity] = useState<DeliveryCity | null>(null)
  const [cityLoading, setCityLoading] = useState(false)
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([])
  const [pickupLoading, setPickupLoading] = useState(false)
  const [deliveryPointCode, setDeliveryPointCode] = useState('')
  const [quote, setQuote] = useState<DeliveryQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteRetry, setQuoteRetry] = useState(0)
  const cartSignature = useMemo(() => JSON.stringify(items.map((item) => ({ candleId: item.productId || item.id, quantity: item.quantity, variantId: item.variantId }))), [items])

  useEffect(() => {
    if (!user) return
    setRecipientName((value) => value || user.name || '')
    setRecipientPhone((value) => value || user.phone || '')
    setRecipientEmail((value) => value || user.email || '')
  }, [user])

  useEffect(() => {
    const query = cityQuery.trim()
    if (query.length < 2 || selectedCity) {
      setCities([])
      setCityLoading(false)
      return
    }
    let active = true
    const timer = window.setTimeout(() => {
      setCityLoading(true)
      api.deliveryCities(query)
        .then(({ items: cityItems }) => { if (active) setCities(cityItems) })
        .catch((error: Error) => { if (active) setOrderError(error.message) })
        .finally(() => { if (active) setCityLoading(false) })
    }, 300)
    return () => { active = false; window.clearTimeout(timer) }
  }, [cityQuery, selectedCity])

  useEffect(() => {
    if (!selectedCity) {
      setPickupPoints([])
      setDeliveryPointCode('')
      return
    }
    let active = true
    setPickupLoading(true)
    setPickupPoints([])
    setDeliveryPointCode('')
    api.pickupPoints(selectedCity.code)
      .then(({ items: points }) => { if (active) setPickupPoints(points) })
      .catch((error: Error) => { if (active) setOrderError(error.message) })
      .finally(() => { if (active) setPickupLoading(false) })
    return () => { active = false }
  }, [selectedCity])

  useEffect(() => {
    if (!user || !selectedCity || !deliveryPointCode || items.length === 0) {
      setQuote(null)
      setQuoteLoading(false)
      return
    }
    let active = true
    setQuote(null)
    setQuoteLoading(true)
    setOrderError('')
    api.deliveryQuote({
      items: JSON.parse(cartSignature),
      cityCode: selectedCity.code,
      cityName: selectedCity.city,
      deliveryPointCode,
    })
      .then((result) => { if (active) setQuote(result) })
      .catch((error: Error) => { if (active) setOrderError(error.message) })
      .finally(() => { if (active) setQuoteLoading(false) })
    return () => { active = false }
  }, [cartSignature, deliveryPointCode, items.length, quoteRetry, selectedCity, user])

  const chooseCity = (city: DeliveryCity) => {
    setSelectedCity(city)
    setCityQuery(city.fullName)
    setCities([])
    setOrderError('')
  }

  const checkout = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) {
      navigate('/login?redirect=/cart')
      return
    }
    if (!selectedCity || !deliveryPointCode || !quote || quoteLoading) {
      setOrderError('Выберите город и пункт выдачи и дождитесь расчёта доставки')
      return
    }
    if (!recipientName.trim() || !recipientPhone.trim() || !recipientEmail.trim()) {
      setOrderError('Заполните имя, телефон и email получателя')
      return
    }
    if (!/^[+()\d\s-]{7,24}$/.test(recipientPhone.trim())) {
      setOrderError('Проверьте формат телефона получателя')
      return
    }
    if (!offerAccepted || !dataProcessingConsent) {
      setOrderError('Для оформления заказа отдельно примите оферту и дайте согласие на обработку персональных данных')
      return
    }
    if (ordering || items.length === 0) return
    setOrdering(true)
    setOrderError('')
    try {
      const { order, confirmationUrl } = await api.createOrder({
        items: JSON.parse(cartSignature),
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        recipientEmail: recipientEmail.trim(),
        cityCode: selectedCity.code,
        cityName: selectedCity.city,
        deliveryPointCode,
        offerAccepted: true,
        dataProcessingConsent: true,
      })
      if (!order?.id || !confirmationUrl) throw new Error('Заказ создан, но платёжная ссылка не получена. Проверьте заказ в личном кабинете.')
      window.location.assign(confirmationUrl)
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'Не удалось создать заказ')
      setOrdering(false)
    }
  }

  if (items.length === 0) {
    return (
      <>
        <PageHeader />
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
      <PageHeader />
      <main className="cart-page section-light" style={{ minHeight: '100svh', paddingTop: '120px', paddingBottom: '60px' }}>
        <div className="shell" style={{ maxWidth: '900px' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p className="eyebrow">Корзина</p>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 'clamp(1.8rem, 3vw, 2.5rem)' }}>Оформление заказа</h2>
            </div>
            <button type="button" onClick={clear} style={{ padding: '8px 16px', border: '1px solid rgba(91,45,35,.2)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.85rem' }}>Очистить корзину</button>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            {items.map((item) => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto auto', gap: '16px', alignItems: 'center', padding: '16px', border: '1px solid rgba(91,45,35,.15)', background: 'rgba(255,255,255,.4)' }} className="cart-row">
                <Link to={`/product/${item.productId || item.id}`} style={{ width: '80px', height: '80px', display: 'block', position: 'relative', overflow: 'hidden' }}>
                  {item.image ? <img src={imgSrc(item.image)} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} /> : <div className="placeholder-frame" style={{ width: '100%', height: '100%' }}><small>Фото</small></div>}
                </Link>
                <div>
                  <Link to={`/product/${item.productId || item.id}`} style={{ fontWeight: 600, textDecoration: 'none', color: 'inherit' }}>{item.title}</Link>
                  <p style={{ fontSize: '.85rem', opacity: .6, marginTop: '4px' }}>{fmtPrice(item.price)} / шт</p>
                </div>
                <div className="cart-qty">
                  <button type="button" onClick={() => setQty(item.id, item.quantity - 1)} aria-label={`Уменьшить количество ${item.title}`}>−</button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => setQty(item.id, item.quantity + 1)} aria-label={`Увеличить количество ${item.title}`}>+</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <strong>{fmtPrice(item.price * item.quantity)}</strong>
                  <button type="button" onClick={() => remove(item.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '.8rem', opacity: .5, padding: 0 }}>Удалить</button>
                </div>
              </div>
            ))}
          </div>

          <form className="checkout-form" onSubmit={checkout}>
            <section className="checkout-section" aria-labelledby="recipient-heading">
              <h3 id="recipient-heading">Получатель</h3>
              <div className="checkout-fields">
                <label>Имя и фамилия<input autoComplete="name" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} required /></label>
                <label>Телефон<input type="tel" autoComplete="tel" value={recipientPhone} onChange={(event) => setRecipientPhone(event.target.value)} required /></label>
                <label>Email<input type="email" autoComplete="email" value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} required /></label>
              </div>
            </section>

            <section className="checkout-section" aria-labelledby="delivery-heading">
              <h3 id="delivery-heading">Доставка СДЭК до пункта выдачи</h3>
              {!user && <p className="checkout-help">Войдите в аккаунт, чтобы выбрать доставку и рассчитать её стоимость: <Link to="/login?redirect=/cart">Войти</Link>.</p>}
              <label className="checkout-city-label">Город
                <input
                  autoComplete="off"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={cities.length > 0}
                  aria-controls="delivery-city-options"
                  value={cityQuery}
                  onChange={(event) => {
                    setCityQuery(event.target.value)
                    setSelectedCity(null)
                    setDeliveryPointCode('')
                    setQuote(null)
                    setOrderError('')
                  }}
                  placeholder="Начните вводить город"
                  required
                />
              </label>
              {cityLoading && <p className="checkout-help" role="status">Ищем города…</p>}
              {cities.length > 0 && (
                <ul id="delivery-city-options" className="checkout-city-options" role="listbox" aria-label="Варианты городов">
                  {cities.map((city) => <li key={city.code}><button type="button" role="option" onClick={() => chooseCity(city)}>{city.fullName}</button></li>)}
                </ul>
              )}
              {selectedCity && <p className="checkout-help">Выбран город: {selectedCity.fullName}</p>}
              {selectedCity && (
                <label className="checkout-point-label">Пункт выдачи
                  <select value={deliveryPointCode} onChange={(event) => { setDeliveryPointCode(event.target.value); setOrderError('') }} required disabled={pickupLoading || pickupPoints.length === 0}>
                    <option value="">{pickupLoading ? 'Загрузка пунктов выдачи…' : pickupPoints.length ? 'Выберите пункт выдачи' : 'Нет доступных пунктов выдачи в этом городе'}</option>
                    {pickupPoints.map((point) => <option key={point.code} value={point.code}>{point.name} — {point.address}{point.workTime ? ` · ${point.workTime}` : ''}</option>)}
                  </select>
                </label>
              )}
              {quoteLoading && <p className="checkout-help" role="status">Рассчитываем доставку…</p>}
              {selectedCity && deliveryPointCode && !quoteLoading && !quote && orderError && <button type="button" className="orders-refresh" onClick={() => setQuoteRetry((value) => value + 1)}>Повторить расчёт доставки</button>}
            </section>

            <section className="checkout-totals" aria-label="Состав и стоимость заказа">
              <div><span>Товары</span><strong>{fmtPrice(quote?.goodsTotal ?? total)}</strong></div>
              <div><span>Доставка</span><strong>{quote ? fmtPrice(quote.deliveryPrice) : quoteLoading ? 'Рассчитываем…' : 'Укажите пункт выдачи'}</strong></div>
              {quote && <p className="checkout-help">СДЭК, тариф {quote.tariffCode}. Ориентировочный срок: {quote.deliveryPeriod.min}–{quote.deliveryPeriod.max} дн.</p>}
              <div className="checkout-grand-total"><span>Итого к оплате</span><strong>{quote ? fmtPrice(quote.total) : '—'}</strong></div>
            </section>

            <div className="checkout-consents">
              <label className="legal-consent">
                <input type="checkbox" checked={offerAccepted} onChange={(event) => setOfferAccepted(event.target.checked)} required />
                <span>Принимаю условия <Link to="/offer" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>публичной оферты</Link>.</span>
              </label>
              <label className="legal-consent">
                <input type="checkbox" checked={dataProcessingConsent} onChange={(event) => setDataProcessingConsent(event.target.checked)} required />
                <span>Даю <Link to="/consent" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>согласие на обработку персональных данных</Link> и ознакомлен(а) с <Link to="/privacy" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>политикой конфиденциальности</Link>.</span>
              </label>
            </div>

            {orderError && <p className="checkout-error" role="alert">{orderError}</p>}
            <div className="checkout-actions">
              <Link to="/catalog" className="arrow-link"><span>Продолжить покупки</span></Link>
              {!user && <p className="checkout-help">Чтобы рассчитать доставку и продолжить, <Link to="/login?redirect=/cart">войдите в аккаунт</Link>.</p>}
              <button type="submit" disabled={ordering || !quote || quoteLoading} className="arrow-link checkout-submit">
                <span>{ordering ? 'Переход к оплате…' : 'Перейти к оплате'}</span>
              </button>
            </div>
            <p className="checkout-help">Заказ останется в корзине, пока платёж не будет подтверждён.</p>
          </form>
        </div>
      </main>
    </>
  )
}
