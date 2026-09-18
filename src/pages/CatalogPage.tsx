import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, imgUrl } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import PageHeader from '../components/PageHeader'
import '../App.css'

type Candle = {
  id: string; title: string; slug: string; description?: string; notes?: string;
  price: number; oldPrice?: number; stock: number; images: string[]; season?: string;
  category?: { id: string; title: string; slug: string }
}

type Category = { id: string; slug: string; title: string }

export default function CatalogPage() {
  const { user } = useAuth()
  const { add } = useCart()
  const { toggle, has } = useFavorites()
  const [items, setItems] = useState<Candle[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCat, setActiveCat] = useState('')
  const [season, setSeason] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addedId, setAddedId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.products(), api.categories()])
      .then(([p, c]) => {
        setItems(p.items)
        setCategories(c.categories)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter((item) => {
    if (activeCat && item.category?.slug !== activeCat) return false
    if (season && item.season !== season) return false
    if (q) {
      const query = q.toLowerCase()
      const inTitle = item.title.toLowerCase().includes(query)
      const inNotes = (item.notes || '').toLowerCase().includes(query)
      const inDesc = (item.description || '').toLowerCase().includes(query)
      if (!inTitle && !inNotes && !inDesc) return false
    }
    return true
  })

  const fmtPrice = (n: number) => n.toLocaleString('ru-RU') + ' ₽'
  const imgSrc = (item: Candle) => imgUrl(item.images?.[0])

  const handleAdd = (item: Candle) => {
    add({ id: item.id, title: item.title, price: item.price, image: item.images?.[0] })
    setAddedId(item.id)
    setTimeout(() => setAddedId(null), 1500)
  }

  return (
    <>
    <PageHeader/>
    <main className="catalog-page section-light" style={{ minHeight: '100svh', paddingTop: '120px' }}>
      <div className="shell">
        <header style={{ marginBottom: '40px' }}>
          <p className="eyebrow">Все свечи</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>Полный каталог</h2>
        </header>

        <div className="catalog-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
          <input
            type="search"
            placeholder="Поиск по названию или аромату…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ flex: '1 1 280px', padding: '12px 16px', border: '1px solid rgba(91,45,35,.2)', background: 'transparent', borderRadius: 0, fontFamily: 'inherit' }}
          />
          <select value={activeCat} onChange={(e) => setActiveCat(e.target.value)} style={{ padding: '12px 16px', border: '1px solid rgba(91,45,35,.2)', background: 'transparent', fontFamily: 'inherit' }}>
            <option value="">Все категории</option>
            {categories.map((c) => <option key={c.id} value={c.slug}>{c.title}</option>)}
          </select>
          <select value={season} onChange={(e) => setSeason(e.target.value)} style={{ padding: '12px 16px', border: '1px solid rgba(91,45,35,.2)', background: 'transparent', fontFamily: 'inherit' }}>
            <option value="">Все сезоны</option>
            <option value="spring">Весна</option>
            <option value="summer">Лето</option>
            <option value="autumn">Осень</option>
            <option value="winter">Зима</option>
          </select>
        </div>

        <p style={{ opacity: .5, fontSize: '.85rem', marginBottom: '20px' }}>Найдено: {filtered.length}</p>

        {loading && <p style={{ textAlign: 'center', padding: '60px 0' }}>Загрузка…</p>}
        {error && <p style={{ color: '#8b2a2a' }}>{error}</p>}

        <div className="product-grid catalog-grid">
          {filtered.map((item) => {
            const isFav = has(item.id)
            return (
              <article className="product-card catalog-card" key={item.id} style={{ position: 'relative' }}>
                <Link to={`/product/${item.id}`} className="product-media" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="photo-placeholder tone-ruby" aria-label={item.title}>
                    {imgSrc(item) ? <img src={imgSrc(item)} alt={item.title} loading="lazy"/> : <div className="placeholder-frame"><span>Фото</span><small>{item.title}</small></div>}
                  </div>
                </Link>
                <button
                  onClick={() => toggle({ id: item.id, title: item.title, price: item.price, image: item.images?.[0], notes: item.notes })}
                  className="card-fav"
                  aria-label={isFav ? 'Убрать из избранного' : 'В избранное'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav ? '#5b2d23' : 'none'} stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20S4 15.5 4 9.5C4 6 8.5 4.5 12 8c3.5-3.5 8-2 8 1.5 0 6-8 10.5-8 10.5Z"/></svg>
                </button>
                <h3>{item.title}</h3>
                <p>{item.notes || ''}</p>
                <strong>{fmtPrice(item.price)}</strong>
                <button onClick={() => handleAdd(item)} className="card-add-btn">
                  <span>{addedId === item.id ? '✓' : 'В корзину'}</span>
                </button>
              </article>
            )
          })}
        </div>

        {!loading && filtered.length === 0 && <p style={{ textAlign: 'center', padding: '60px 0' }}>Ничего не найдено</p>}

        <div style={{ marginTop: '48px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Link to="/" className="arrow-link"><span>На главную</span></Link>
          {user && <Link to="/profile" className="arrow-link"><span>Личный кабинет</span></Link>}
          <Link to="/favorites" className="arrow-link"><span>Избранное</span></Link>
          <Link to="/cart" className="arrow-link"><span>Корзина</span></Link>
        </div>
      </div>
    </main>
    </>
  )
}
