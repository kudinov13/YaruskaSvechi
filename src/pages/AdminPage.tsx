import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, imgUrl } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import '../App.css'

type Candle = {
  id: string; title: string; slug: string; description?: string; notes?: string;
  price: number; oldPrice?: number; stock: number; images: string[];
  featured?: boolean;
  shippingPackagePreset?: string | null
  shippingWeightGrams?: number | null
  categoryId: string; category?: { id: string; title: string; slug: string }
}
type Category = { id: string; slug: string; title: string }
type Order = {
  id: string; total?: number; goodsTotal?: number; deliveryPrice?: number; paymentStatus?: string; status?: string;
  cdekTrack?: string; cdekStatusCode?: string | number; cdekStatus?: string; createdAt: string;
  user?: { name: string; email: string; phone?: string }
  items: { id: string; title: string; price: number; quantity: number }[]
}

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'candles' | 'popular' | 'orders'>('candles')
  const [candles, setCandles] = useState<Candle[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Candle | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate('/')
  }, [user, isAdmin, authLoading, navigate])

  const load = () => {
    Promise.all([api.adminCandles(), api.categories(), api.adminOrders()])
      .then(([c, cat, o]) => { setCandles(c.items); setCategories(cat.categories); setOrders(o.orders) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (user && isAdmin) load()
  }, [user, isAdmin])

  if (authLoading || (!user || !isAdmin)) return null

  const fmtPrice = (n: number) => n.toLocaleString('ru-RU') + ' ₽'
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('ru-RU')

  const imgSrc = (item: Candle) => imgUrl(item.images?.[0])

  const handleUpload = async (files: FileList) => {
    const formData = new FormData()
    Array.from(files).forEach((f) => formData.append('files', f))
    const { files: paths } = await api.adminUpload(formData)
    return paths
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить товар?')) return
    try {
      await api.adminDeleteCandle(id)
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  return (
    <><PageHeader />
    <main className="admin-page section-light" style={{ minHeight: '100svh', paddingTop: '100px', paddingBottom: '60px' }}>
      <div className="shell" style={{ maxWidth: '1200px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <div>
            <p className="eyebrow">Админ-панель</p>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 'clamp(1.8rem, 3vw, 2.5rem)' }}>Управление</h2>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/" className="arrow-link"><span>На главную</span></Link>
            <Link to="/profile" className="arrow-link"><span>Кабинет</span></Link>
          </div>
        </header>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid rgba(91,45,35,.15)' }}>
          <button onClick={() => setTab('candles')} style={{ padding: '12px 20px', background: 'none', border: 'none', borderBottom: tab === 'candles' ? '2px solid #5b2d23' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit', fontWeight: tab === 'candles' ? 600 : 400 }}>Товары</button>
          <button onClick={() => setTab('popular')} style={{ padding: '12px 20px', background: 'none', border: 'none', borderBottom: tab === 'popular' ? '2px solid #5b2d23' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit', fontWeight: tab === 'popular' ? 600 : 400 }}>Популярные</button>
          <button onClick={() => setTab('orders')} style={{ padding: '12px 20px', background: 'none', border: 'none', borderBottom: tab === 'orders' ? '2px solid #5b2d23' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit', fontWeight: tab === 'orders' ? 600 : 400 }}>Заказы</button>
        </div>

        {tab === 'candles' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem' }}>Товары ({candles.length})</h3>
              <button onClick={() => { setEditing(null); setShowForm(true) }} className="arrow-link" style={{ cursor: 'pointer', border: 'none' }}><span>+ Добавить товар</span></button>
            </div>

            {showForm && (
              <CandleForm
                candle={editing}
                categories={categories}
                onUpload={handleUpload}
                onSubmit={async (data) => {
                  if (editing) await api.adminUpdateCandle(editing.id, data)
                  else await api.adminCreateCandle(data)
                  setShowForm(false); setEditing(null); load()
                }}
                onCancel={() => { setShowForm(false); setEditing(null) }}
              />
            )}

            {loading ? <p>Загрузка…</p> : (
              <div className="admin-candle-grid">
                {candles.map((item) => (
                  <div key={item.id} style={{ border: '1px solid rgba(91,45,35,.15)', padding: '10px', background: 'rgba(255,255,255,.4)', position: 'relative' }}>
                    {item.featured && <span title="Популярный товар" style={{ position: 'absolute', top: '6px', right: '6px', zIndex: 1, background: '#5b2d23', color: '#eee8df', fontSize: '.62rem', padding: '3px 6px' }}>★</span>}
                    <div className="photo-placeholder tone-ruby" style={{ aspectRatio: '1', marginBottom: '8px', position: 'relative' }}>
                      {imgSrc(item) ? <img src={imgSrc(item)} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}/> : <div className="placeholder-frame"><small>{item.title}</small></div>}
                    </div>
                    <strong style={{ fontSize: '.9rem', display: 'block', lineHeight: 1.2 }}>{item.title}</strong>
                    <p style={{ fontSize: '.75rem', opacity: .6, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.notes}</p>
                    <p style={{ marginTop: '4px', fontSize: '.85rem' }}>{fmtPrice(item.price)}</p>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <button onClick={() => { setEditing(item); setShowForm(true) }} style={{ flex: 1, minHeight: '36px', padding: '6px 4px', cursor: 'pointer', fontSize: '.78rem', fontFamily: 'inherit' }}>Изменить</button>
                      <button onClick={() => handleDelete(item.id)} style={{ flex: 1, minHeight: '36px', padding: '6px 4px', cursor: 'pointer', fontSize: '.78rem', color: '#8b2a2a', fontFamily: 'inherit' }}>Удалить</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'popular' && (
          <section>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', marginBottom: '8px' }}>Популярные свечи</h3>
            <p style={{ opacity: .6, marginBottom: '20px', fontSize: '.9rem' }}>Отметьте товары, которые показываются в блоке «Популярные свечи» на главной. Добавляются только существующие товары.</p>
            {loading ? <p>Загрузка…</p> : (
              <div className="admin-candle-grid">
                {candles.map((item) => (
                  <div key={item.id} style={{ border: item.featured ? '2px solid #5b2d23' : '1px solid rgba(91,45,35,.15)', padding: '10px', background: 'rgba(255,255,255,.4)', position: 'relative' }}>
                    {item.featured && <span style={{ position: 'absolute', top: '6px', right: '6px', background: '#5b2d23', color: '#eee8df', fontSize: '.62rem', padding: '3px 6px' }}>★</span>}
                    <div className="photo-placeholder tone-ruby" style={{ aspectRatio: '1', marginBottom: '8px', position: 'relative' }}>
                      {imgSrc(item) ? <img src={imgSrc(item)} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}/> : <div className="placeholder-frame"><small>{item.title}</small></div>}
                    </div>
                    <strong style={{ fontSize: '.9rem', display: 'block', lineHeight: 1.2 }}>{item.title}</strong>
                    <p style={{ fontSize: '.78rem', opacity: .6, marginTop: '2px' }}>{fmtPrice(item.price)}</p>
                    <button
                      onClick={async () => { await api.adminUpdateCandle(item.id, { featured: !item.featured }); load() }}
                      style={{ marginTop: '8px', width: '100%', minHeight: '38px', padding: '8px 4px', cursor: 'pointer', fontSize: '.78rem', background: item.featured ? 'transparent' : '#5b2d23', color: item.featured ? '#5b2d23' : '#eee8df', border: '1px solid #5b2d23', fontFamily: 'inherit' }}
                    >
                      {item.featured ? 'Убрать' : 'В популярные'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'orders' && (
          <section>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', marginBottom: '20px' }}>Заказы ({orders.length})</h3>
            {loading ? <p>Загрузка…</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orders.map((order) => (
                  <div key={order.id} style={{ border: '1px solid rgba(91,45,35,.15)', padding: '20px', background: 'rgba(255,255,255,.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      <div>
                        <strong>№ {order.id.slice(-8).toUpperCase()}</strong>
                        <p style={{ fontSize: '.85rem', opacity: .6 }}>{fmtDate(order.createdAt)}</p>
                        {order.user && <p style={{ fontSize: '.85rem', marginTop: '4px' }}>{order.user.name} · {order.user.email}{order.user.phone ? ` · ${order.user.phone}` : ''}</p>}
                      </div>
                      <strong>{fmtPrice(order.total ?? ((order.goodsTotal || 0) + (order.deliveryPrice || 0)))}</strong>
                    </div>
                    <div style={{ fontSize: '.85rem', marginBottom: '12px' }}>
                      {order.items.map((i) => <div key={i.id}>{i.title} × {i.quantity}</div>)}
                    </div>
                    <dl className="order-status-details">
                      <div><dt>Оплата</dt><dd>{order.paymentStatus || 'Статус пока не получен'}</dd></div>
                      {typeof order.goodsTotal === 'number' && <div><dt>Товары</dt><dd>{fmtPrice(order.goodsTotal)}</dd></div>}
                      {typeof order.deliveryPrice === 'number' && <div><dt>Доставка</dt><dd>{fmtPrice(order.deliveryPrice)}</dd></div>}
                      <div><dt>Статус СДЭК</dt><dd>{order.cdekStatus || 'Информация о доставке пока не обновлена'}{order.cdekStatusCode !== undefined && order.cdekStatusCode !== null ? ` · код ${order.cdekStatusCode}` : ''}</dd></div>
                    </dl>
                    {order.cdekTrack && <p style={{ marginTop: '12px', fontSize: '.85rem' }}>Трек: <a href={`https://www.cdek.ru/ru/tracking?order_id=${encodeURIComponent(order.cdekTrack)}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>{order.cdekTrack}</a></p>}
                  </div>
                ))}
                {orders.length === 0 && <p style={{ opacity: .6 }}>Заказов пока нет</p>}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
    </>
  )
}

function CandleForm({ candle, categories, onUpload, onSubmit, onCancel }: {
  candle: Candle | null
  categories: Category[]
  onUpload: (files: FileList) => Promise<string[]>
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>
  onCancel: () => void
}) {
  const [title, setTitle] = useState(candle?.title || '')
  const [notes, setNotes] = useState(candle?.notes || '')
  const [description, setDescription] = useState(candle?.description || '')
  const [price, setPrice] = useState(candle?.price?.toString() || '')
  const [oldPrice, setOldPrice] = useState(candle?.oldPrice?.toString() || '')
  const [stock, setStock] = useState(candle?.stock?.toString() || '0')
  const [categoryId, setCategoryId] = useState(candle?.categoryId || categories[0]?.id || '')
  const [featured, setFeatured] = useState(candle?.featured || false)
  const [packagePreset, setPackagePreset] = useState(candle?.shippingPackagePreset || '')
  const [weightGrams, setWeightGrams] = useState(candle?.shippingWeightGrams?.toString() || '')
  const [images, setImages] = useState<string[]>(candle?.images || [])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!packagePreset || !weightGrams || !Number.isInteger(Number(weightGrams)) || Number(weightGrams) <= 0) {
      setError('Укажите профиль упаковки и фактический вес товара после упаковки для расчёта СДЭК')
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        title, notes, description, price: parseInt(price) || 0,
        oldPrice: oldPrice ? parseInt(oldPrice) : undefined,
        stock: parseInt(stock) || 0, categoryId, images, featured,
        shippingPackagePreset: packagePreset || null,
        shippingWeightGrams: weightGrams ? parseInt(weightGrams, 10) : null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    setUploading(true)
    setError('')
    try {
      const paths = await onUpload(e.target.files)
      setImages((prev) => [...prev, ...paths])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки фото')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const moveImage = (i: number, dir: -1 | 1) => {
    setImages((prev) => {
      const j = i + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const removeImage = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i))

  return (
    <form onSubmit={submit} style={{ border: '1px solid rgba(91,45,35,.2)', padding: '24px', marginBottom: '24px', background: 'rgba(255,255,255,.6)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
        <label>Название<input value={title} onChange={(e) => setTitle(e.target.value)} required style={{ display: 'block', width: '100%', padding: '10px', marginTop: '4px', border: '1px solid rgba(91,45,35,.2)', background: 'transparent', fontFamily: 'inherit' }}/></label>
        <label>Аромат (notes)<input value={notes} onChange={(e) => setNotes(e.target.value)} style={{ display: 'block', width: '100%', padding: '10px', marginTop: '4px', border: '1px solid rgba(91,45,35,.2)', background: 'transparent', fontFamily: 'inherit' }}/></label>
        <label>Цена (₽)<input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required style={{ display: 'block', width: '100%', padding: '10px', marginTop: '4px', border: '1px solid rgba(91,45,35,.2)', background: 'transparent', fontFamily: 'inherit' }}/></label>
        <label>Старая цена<input type="number" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} style={{ display: 'block', width: '100%', padding: '10px', marginTop: '4px', border: '1px solid rgba(91,45,35,.2)', background: 'transparent', fontFamily: 'inherit' }}/></label>
        <label>Остаток<input type="number" value={stock} onChange={(e) => setStock(e.target.value)} style={{ display: 'block', width: '100%', padding: '10px', marginTop: '4px', border: '1px solid rgba(91,45,35,.2)', background: 'transparent', fontFamily: 'inherit' }}/></label>
        <label>Категория<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ display: 'block', width: '100%', padding: '10px', marginTop: '4px', border: '1px solid rgba(91,45,35,.2)', background: 'transparent', fontFamily: 'inherit' }}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select></label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '24px' }}><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)}/> Популярный товар</label>
        <label>Профиль упаковки СДЭК<select value={packagePreset} onChange={(e) => setPackagePreset(e.target.value)} required style={{ display: 'block', width: '100%', padding: '10px', marginTop: '4px', border: '1px solid rgba(91,45,35,.2)', background: 'transparent', fontFamily: 'inherit' }}>
          <option value="">Не выбран</option>
          <option value="p25x25x10">25 × 25 × 10 см — до 2 кг</option>
          <option value="p50x25x15">50 × 25 × 15 см — до 3 кг</option>
          <option value="p40x30x20">40 × 30 × 20 см — до 3 кг</option>
          <option value="p50x30x30">50 × 30 × 30 см — до 5 кг</option>
        </select></label>
        <label>Фактический вес упакованного товара (г)<input type="number" min="1" max={packagePreset === 'p25x25x10' ? 2000 : packagePreset === 'p50x25x15' || packagePreset === 'p40x30x20' ? 3000 : packagePreset === 'p50x30x30' ? 5000 : undefined} step="1" value={weightGrams} onChange={(e) => setWeightGrams(e.target.value)} required placeholder="Точный вес после упаковки" style={{ display: 'block', width: '100%', padding: '10px', marginTop: '4px', border: '1px solid rgba(91,45,35,.2)', background: 'transparent', fontFamily: 'inherit' }}/></label>
        <p style={{ gridColumn: '1 / -1', fontSize: '.85rem', opacity: .7, margin: 0 }}>Нужны для расчёта СДЭК. Профиль задаёт максимальные габариты и вес; укажите только фактически измеренный вес после упаковки.</p>
      </div>

      <label style={{ display: 'block', marginTop: '16px' }}>Описание<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ display: 'block', width: '100%', padding: '10px', marginTop: '4px', border: '1px solid rgba(91,45,35,.2)', background: 'transparent', fontFamily: 'inherit', resize: 'vertical' }}/></label>

      <div style={{ marginTop: '16px' }}>
        <label>Фотографии товара<input type="file" accept="image/*" multiple onChange={upload} disabled={uploading} style={{ display: 'block', marginTop: '4px' }}/></label>
        {uploading && <p style={{ fontSize: '.85rem', opacity: .6 }}>Загрузка…</p>}
        {images.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <p style={{ fontSize: '.85rem', opacity: .6, marginBottom: '10px' }}>Первое фото — главное (показывается на карточке). Стрелки меняют порядок.</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {images.map((img, i) => (
                <div key={i} style={{ width: '110px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                    <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} style={{ flex: 1, minHeight: '48px', cursor: 'pointer', border: '1px solid rgba(91,45,35,.3)', background: 'transparent', fontFamily: 'inherit', fontSize: '1.3rem', opacity: i === 0 ? .3 : 1 }} aria-label="Влево">←</button>
                    <button type="button" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} style={{ flex: 1, minHeight: '48px', cursor: 'pointer', border: '1px solid rgba(91,45,35,.3)', background: 'transparent', fontFamily: 'inherit', fontSize: '1.3rem', opacity: i === images.length - 1 ? .3 : 1 }} aria-label="Вправо">→</button>
                  </div>
                  <div style={{ position: 'relative', width: '110px', height: '110px' }}>
                    <img src={imgUrl(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    {i === 0 && <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(91,45,35,.9)', color: '#eee8df', fontSize: '.68rem', textAlign: 'center', padding: '4px 0', letterSpacing: '.05em' }}>Главное</span>}
                  </div>
                  <button type="button" onClick={() => removeImage(i)} style={{ width: '100%', minHeight: '44px', marginTop: '8px', cursor: 'pointer', border: '1px solid #8b2a2a', background: 'transparent', color: '#8b2a2a', fontFamily: 'inherit', fontSize: '.85rem' }}>Удалить</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <p style={{ marginTop: '16px', color: '#8b2a2a', fontSize: '.9rem' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button type="submit" className="arrow-link" disabled={saving || uploading} style={{ cursor: 'pointer', border: 'none', opacity: saving ? .6 : 1 }}><span>{saving ? 'Сохранение…' : candle ? 'Сохранить' : 'Создать'}</span></button>
        <button type="button" onClick={onCancel} style={{ padding: '10px 16px', cursor: 'pointer', background: 'transparent', border: '1px solid rgba(91,45,35,.2)', fontFamily: 'inherit' }}>Отмена</button>
      </div>
    </form>
  )
}
