import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, imgUrl } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import '../App.css'

type Candle = {
  id: string; title: string; slug: string; description?: string; notes?: string;
  price: number; oldPrice?: number; stock: number; images: string[]; season?: string;
  featured?: boolean;
  categoryId: string; category?: { id: string; title: string; slug: string }
}
type Category = { id: string; slug: string; title: string }
type Order = {
  id: string; total: number; status: string; cdekTrack?: string; createdAt: string;
  user?: { name: string; email: string; phone?: string }
  items: { id: string; title: string; price: number; quantity: number }[]
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Новый', PAID: 'Оплачен', ASSEMBLED: 'Собирается', SHIPPED: 'Отправлен', DELIVERED: 'Доставлен', CANCELLED: 'Отменён',
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                {candles.map((item) => (
                  <div key={item.id} style={{ border: '1px solid rgba(91,45,35,.15)', padding: '16px', background: 'rgba(255,255,255,.4)', position: 'relative' }}>
                    {item.featured && <span title="Популярный товар" style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1, background: '#5b2d23', color: '#eee8df', fontSize: '.7rem', padding: '4px 8px' }}>★ Популярный</span>}
                    <div className="photo-placeholder tone-ruby" style={{ aspectRatio: '1', marginBottom: '12px', position: 'relative' }}>
                      {imgSrc(item) ? <img src={imgSrc(item)} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}/> : <div className="placeholder-frame"><small>{item.title}</small></div>}
                    </div>
                    <strong>{item.title}</strong>
                    <p style={{ fontSize: '.85rem', opacity: .6 }}>{item.notes}</p>
                    <p style={{ marginTop: '8px' }}>{fmtPrice(item.price)}</p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button onClick={() => { setEditing(item); setShowForm(true) }} style={{ padding: '6px 12px', cursor: 'pointer', fontSize: '.85rem' }}>Редактировать</button>
                      <button onClick={() => handleDelete(item.id)} style={{ padding: '6px 12px', cursor: 'pointer', fontSize: '.85rem', color: '#8b2a2a' }}>Удалить</button>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {candles.map((item) => (
                  <div key={item.id} style={{ border: item.featured ? '2px solid #5b2d23' : '1px solid rgba(91,45,35,.15)', padding: '14px', background: 'rgba(255,255,255,.4)', position: 'relative' }}>
                    {item.featured && <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#5b2d23', color: '#eee8df', fontSize: '.7rem', padding: '4px 8px', letterSpacing: '.05em' }}>В популярных</span>}
                    <div className="photo-placeholder tone-ruby" style={{ aspectRatio: '1', marginBottom: '10px', position: 'relative' }}>
                      {imgSrc(item) ? <img src={imgSrc(item)} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}/> : <div className="placeholder-frame"><small>{item.title}</small></div>}
                    </div>
                    <strong style={{ fontSize: '.95rem' }}>{item.title}</strong>
                    <p style={{ fontSize: '.8rem', opacity: .6, marginTop: '2px' }}>{fmtPrice(item.price)}</p>
                    <button
                      onClick={async () => { await api.adminUpdateCandle(item.id, { featured: !item.featured }); load() }}
                      style={{ marginTop: '10px', width: '100%', padding: '8px', cursor: 'pointer', fontSize: '.85rem', background: item.featured ? 'transparent' : '#5b2d23', color: item.featured ? '#5b2d23' : '#eee8df', border: '1px solid #5b2d23', fontFamily: 'inherit' }}
                    >
                      {item.featured ? 'Убрать из популярных' : 'В популярные'}
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
                      <strong>{fmtPrice(order.total)}</strong>
                    </div>
                    <div style={{ fontSize: '.85rem', marginBottom: '12px' }}>
                      {order.items.map((i) => <div key={i.id}>{i.title} × {i.quantity}</div>)}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <select
                        value={order.status}
                        onChange={async (e) => { await api.adminUpdateOrder(order.id, { status: e.target.value }); load() }}
                        style={{ padding: '8px 12px', border: '1px solid rgba(91,45,35,.2)', background: 'transparent', fontFamily: 'inherit' }}
                      >
                        {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      <input
                        type="text"
                        placeholder="Трек СДЭК"
                        defaultValue={order.cdekTrack || ''}
                        onBlur={async (e) => { if (e.target.value !== order.cdekTrack) await api.adminUpdateOrder(order.id, { cdekTrack: e.target.value }) }}
                        style={{ padding: '8px 12px', border: '1px solid rgba(91,45,35,.2)', background: 'transparent', fontFamily: 'inherit', flex: '1 1 200px' }}
                      />
                    </div>
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
  const [season, setSeason] = useState(candle?.season || '')
  const [featured, setFeatured] = useState(candle?.featured || false)
  const [images, setImages] = useState<string[]>(candle?.images || [])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSubmit({
        title, notes, description, price: parseInt(price) || 0,
        oldPrice: oldPrice ? parseInt(oldPrice) : undefined,
        stock: parseInt(stock) || 0, categoryId, season: season || undefined, images, featured,
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
        <label>Сезон<select value={season} onChange={(e) => setSeason(e.target.value)} style={{ display: 'block', width: '100%', padding: '10px', marginTop: '4px', border: '1px solid rgba(91,45,35,.2)', background: 'transparent', fontFamily: 'inherit' }}>
          <option value="">—</option>
          <option value="spring">Весна</option>
          <option value="summer">Лето</option>
          <option value="autumn">Осень</option>
          <option value="winter">Зима</option>
        </select></label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '24px' }}><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)}/> Популярный товар</label>
      </div>

      <label style={{ display: 'block', marginTop: '16px' }}>Описание<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ display: 'block', width: '100%', padding: '10px', marginTop: '4px', border: '1px solid rgba(91,45,35,.2)', background: 'transparent', fontFamily: 'inherit', resize: 'vertical' }}/></label>

      <div style={{ marginTop: '16px' }}>
        <label>Фотографии товара<input type="file" accept="image/*" multiple onChange={upload} disabled={uploading} style={{ display: 'block', marginTop: '4px' }}/></label>
        {uploading && <p style={{ fontSize: '.85rem', opacity: .6 }}>Загрузка…</p>}
        {images.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
            {images.map((img, i) => (
              <div key={i} style={{ position: 'relative', width: '80px', height: '80px' }}>
                <img src={imgUrl(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                <button type="button" onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 0, right: 0, background: '#5b2d23', color: '#fff', border: 'none', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px' }}>×</button>
              </div>
            ))}
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
