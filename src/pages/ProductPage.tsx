import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, imgUrl } from '../lib/api'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import PageHeader from '../components/PageHeader'
import '../App.css'

type Candle = {
  id: string; title: string; slug: string; description?: string; notes?: string;
  price: number; oldPrice?: number; stock: number; images: string[]; season?: string;
  category?: { id: string; title: string; slug: string }
}

export default function ProductPage() {
  const { id } = useParams()
  const { add } = useCart()
  const { toggle, has } = useFavorites()
  const [item, setItem] = useState<Candle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.product(id)
      .then(({ item }) => {
        setItem(item)
        window.scrollTo({ top: 0 })
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const fmtPrice = (n: number) => n.toLocaleString('ru-RU') + ' ₽'
  const imgSrc = (img?: string) => imgUrl(img)

  const handleAdd = () => {
    if (!item) return
    add({ id: item.id, title: item.title, price: item.price, image: item.images?.[0] }, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) return <><PageHeader /><main className="section-light" style={{ minHeight: '100svh', paddingTop: '120px' }}><div className="shell"><p>Загрузка…</p></div></main></>
  if (error || !item) return <><PageHeader /><main className="section-light" style={{ minHeight: '100svh', paddingTop: '120px' }}><div className="shell"><p>{error || 'Товар не найден'}</p><Link to="/catalog" className="arrow-link"><span>В каталог</span></Link></div></main></>

  const isFav = has(item.id)
  const seasonLabel: Record<string, string> = { spring: 'Весна', summer: 'Лето', autumn: 'Осень', winter: 'Зима' }

  return (
    <><PageHeader />
    <main className="product-page section-light" style={{ minHeight: '100svh', paddingTop: '100px', paddingBottom: '60px' }}>
      <div className="shell" style={{ maxWidth: '1200px' }}>
        <nav style={{ marginBottom: '32px', fontSize: '.9rem', opacity: .6 }}>
          <Link to="/">Главная</Link> / <Link to="/catalog">Каталог</Link> / <span>{item.title}</span>
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '48px', alignItems: 'start' }} className="product-detail-grid">
          <div>
            <div className="photo-placeholder tone-ruby" style={{ aspectRatio: '4 / 5', position: 'relative', overflow: 'hidden' }}>
              {item.images?.[activeImg] ? (
                <img src={imgSrc(item.images[activeImg])} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}/>
              ) : (
                <div className="placeholder-frame"><span>Фото</span><small>{item.title}</small></div>
              )}
            </div>
            {item.images.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                {item.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} style={{ width: '64px', height: '64px', border: i === activeImg ? '2px solid #5b2d23' : '1px solid rgba(91,45,35,.2)', cursor: 'pointer', padding: 0, background: 'transparent' }}>
                    <img src={imgSrc(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {item.category && <p className="eyebrow">{item.category.title}</p>}
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '12px' }}>{item.title}</h1>
            {item.notes && <p style={{ opacity: .7, marginBottom: '20px', fontSize: '1.1rem' }}>{item.notes}</p>}

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '24px' }}>
              <strong style={{ fontSize: '1.8rem' }}>{fmtPrice(item.price)}</strong>
              {item.oldPrice && <span style={{ textDecoration: 'line-through', opacity: .4 }}>{fmtPrice(item.oldPrice)}</span>}
            </div>

            {item.description && <p style={{ lineHeight: 1.7, marginBottom: '24px', opacity: .8 }}>{item.description}</p>}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {item.season && <span style={{ padding: '6px 14px', border: '1px solid rgba(91,45,35,.2)', fontSize: '.85rem' }}>{seasonLabel[item.season] || item.season}</span>}
              <span style={{ padding: '6px 14px', border: '1px solid rgba(91,45,35,.2)', fontSize: '.85rem' }}>{item.stock > 0 ? `В наличии: ${item.stock} шт` : 'Нет в наличии'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(91,45,35,.2)' }}>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ width: '40px', height: '40px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem' }}>−</button>
                <span style={{ minWidth: '40px', textAlign: 'center' }}>{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} style={{ width: '40px', height: '40px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem' }}>+</button>
              </div>
              <button onClick={handleAdd} className="arrow-link" style={{ cursor: 'pointer', border: 'none', padding: '12px 24px' }}>
                <span>{added ? 'Добавлено ✓' : 'В корзину'}</span>
              </button>
              <button onClick={() => toggle({ id: item.id, title: item.title, price: item.price, image: item.images?.[0], notes: item.notes })} style={{ width: '44px', height: '44px', border: '1px solid rgba(91,45,35,.2)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="В избранное">
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isFav ? '#5b2d23' : 'none'} stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20S4 15.5 4 9.5C4 6 8.5 4.5 12 8c3.5-3.5 8-2 8 1.5 0 6-8 10.5-8 10.5Z"/></svg>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/catalog" className="arrow-link"><span>Продолжить покупки</span></Link>
              <Link to="/cart" className="arrow-link"><span>Перейти в корзину</span></Link>
            </div>
          </div>
        </div>
      </div>
    </main>
    </>
  )
}
