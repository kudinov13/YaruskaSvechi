import { Link } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'
import { useCart } from '../context/CartContext'
import { imgUrl } from '../lib/api'
import PageHeader from '../components/PageHeader'
import '../App.css'

const fmtPrice = (n: number) => n.toLocaleString('ru-RU') + ' ₽'
const imgSrc = (img?: string) => imgUrl(img)

export default function FavoritesPage() {
  const { items, remove } = useFavorites()
  const { add } = useCart()

  if (items.length === 0) {
    return (
      <><PageHeader />
      <main className="section-light" style={{ minHeight: '100svh', paddingTop: '120px', paddingBottom: '60px' }}>
        <div className="shell" style={{ maxWidth: '700px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: '2.5rem', marginBottom: '16px' }}>Избранное пусто</h2>
          <p style={{ opacity: .6, marginBottom: '32px' }}>Сохраняйте понравившиеся свечи, нажимая на сердечко.</p>
          <Link to="/catalog" className="arrow-link"><span>В каталог</span></Link>
        </div>
      </main>
      </>
    )
  }

  return (
    <><PageHeader />
    <main className="section-light" style={{ minHeight: '100svh', paddingTop: '120px', paddingBottom: '60px' }}>
      <div className="shell" style={{ maxWidth: '1000px' }}>
        <header style={{ marginBottom: '32px' }}>
          <p className="eyebrow">Избранное</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 'clamp(1.8rem, 3vw, 2.5rem)' }}>Понравившиеся свечи ({items.length})</h2>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
          {items.map((item) => (
            <article key={item.id} className="product-card" style={{ position: 'relative' }}>
              <Link to={`/product/${item.id}`} className="photo-placeholder tone-ruby" style={{ aspectRatio: '1', position: 'relative', display: 'block' }}>
                {item.image ? <img src={imgSrc(item.image)} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}/> : <div className="placeholder-frame"><small>{item.title}</small></div>}
              </Link>
              <button onClick={() => remove(item.id)} style={{ position: 'absolute', top: '8px', right: '8px', width: '32px', height: '32px', border: 'none', background: 'rgba(255,255,255,.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Убрать из избранного">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#5b2d23" stroke="#5b2d23" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20S4 15.5 4 9.5C4 6 8.5 4.5 12 8c3.5-3.5 8-2 8 1.5 0 6-8 10.5-8 10.5Z"/></svg>
              </button>
              <h3 style={{ marginTop: '12px' }}>{item.title}</h3>
              {item.notes && <p>{item.notes}</p>}
              <strong>{fmtPrice(item.price)}</strong>
              <button onClick={() => add({ id: item.id, title: item.title, price: item.price, image: item.image })} className="arrow-link" style={{ marginTop: '10px', cursor: 'pointer', border: 'none', padding: '8px 14px' }}>
                <span>В корзину</span>
              </button>
            </article>
          ))}
        </div>

        <div style={{ marginTop: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/catalog" className="arrow-link"><span>В каталог</span></Link>
          <Link to="/cart" className="arrow-link"><span>В корзину</span></Link>
        </div>
      </div>
    </main>
    </>
  )
}
