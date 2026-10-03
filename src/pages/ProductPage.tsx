import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, imgUrl } from '../lib/api'
import { useFragrances } from '../lib/useFragrances'
import { useSeo } from '../lib/seo'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import PageHeader from '../components/PageHeader'
import '../App.css'

type Candle = {
  id: string; title: string; slug: string; description?: string; notes?: string;
  price: number; oldPrice?: number; stock: number; images: string[];
  variants?: { id: string; name: string; images: string[] }[];
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
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [selectedFragrance, setSelectedFragrance] = useState('')
  const [fragranceError, setFragranceError] = useState(false)
  const [added, setAdded] = useState(false)
  const fragrances = useFragrances()

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.product(id)
      .then(({ item }) => {
        setItem(item)
        setSelectedVariantId(item.variants?.[0]?.id || '')
        setSelectedFragrance('')
        setActiveImg(0)
        window.scrollTo({ top: 0 })
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  useSeo({
    title: item ? `${item.title} — соевый воск, гипс, ручная роспись` : undefined,
    description: item?.description?.slice(0, 180) || undefined,
    canonical: item ? `/product/${item.slug || item.id}` : undefined,
    image: item?.images?.[0] ? imgUrl(item.images[0]) : undefined,
    ogType: 'product',
    jsonLd: item ? [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: item.title,
        image: item.images.map((img) => `https://yaruska.ru${img}`),
        description: item.description || item.title,
        material: 'Гипс, соевый воск',
        brand: { '@type': 'Brand', name: 'ЯРУСКА' },
        category: item.category?.title,
        offers: {
          '@type': 'Offer',
          url: `https://yaruska.ru/product/${item.slug || item.id}`,
          priceCurrency: 'RUB',
          price: item.price,
          availability: item.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://yaruska.ru/' },
          { '@type': 'ListItem', position: 2, name: 'Каталог', item: 'https://yaruska.ru/catalog' },
          { '@type': 'ListItem', position: 3, name: item.title, item: `https://yaruska.ru/product/${item.slug || item.id}` },
        ],
      },
    ] : undefined,
  })

  const fmtPrice = (n: number) => n.toLocaleString('ru-RU') + ' ₽'
  const imgSrc = (img?: string) => imgUrl(img)
  const selectedVariant = item?.variants?.find((variant) => variant.id === selectedVariantId)
  const galleryImages = selectedVariant?.images || item?.images || []

  const handleAdd = () => {
    if (!item) return
    if (!selectedFragrance) {
      setFragranceError(true)
      return
    }
    setFragranceError(false)
    const cartId = `${item.id}::${selectedVariant?.id || ''}::${selectedFragrance || ''}`
    add({
      id: cartId,
      productId: item.id,
      variantId: selectedVariant?.id,
      fragrance: selectedFragrance || undefined,
      title: selectedVariant ? `${item.title} — ${selectedVariant.name}` : item.title,
      price: item.price,
      image: galleryImages[0],
    }, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) return <><PageHeader /><main className="section-light" style={{ minHeight: '100svh', paddingTop: '120px' }}><div className="shell"><p>Загрузка…</p></div></main></>
  if (error || !item) return <><PageHeader /><main className="section-light" style={{ minHeight: '100svh', paddingTop: '120px' }}><div className="shell"><p>{error || 'Товар не найден'}</p><Link to="/catalog" className="arrow-link"><span>В каталог</span></Link></div></main></>

  const isFav = has(item.id)

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
              {galleryImages[activeImg] ? (
                <img src={imgSrc(galleryImages[activeImg])} alt={selectedVariant ? `${item.title} — ${selectedVariant.name}` : item.title} decoding="async" fetchPriority="high" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}/>
              ) : (
                <div className="placeholder-frame"><span>Фото</span><small>{item.title}</small></div>
              )}
            </div>
            {galleryImages.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto' }}>
                {galleryImages.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} style={{ width: '64px', height: '64px', border: i === activeImg ? '2px solid #5b2d23' : '1px solid rgba(91,45,35,.2)', cursor: 'pointer', padding: 0, background: 'transparent' }}>
                    <img src={imgSrc(img)} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {item.category && <p className="eyebrow">{item.category.title}</p>}
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '12px' }}>{item.title}</h1>
            {item.notes && <p style={{ opacity: .7, marginBottom: '20px', fontSize: '1.1rem' }}>{item.notes}</p>}

            {item.variants && item.variants.length > 0 && (
              <fieldset className="product-variant-picker">
                <legend>Цвет самовара</legend>
                <div>
                  {item.variants.map((variant) => (
                    <button key={variant.id} type="button" className={selectedVariantId === variant.id ? 'product-variant is-selected' : 'product-variant'} aria-pressed={selectedVariantId === variant.id} onClick={() => { setSelectedVariantId(variant.id); setActiveImg(0) }}>
                      <span className={`variant-swatch variant-swatch-${variant.id}`} aria-hidden="true"/>
                      {variant.name}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '24px' }}>
              <strong style={{ fontSize: '1.8rem' }}>{fmtPrice(item.price)}</strong>
              {item.oldPrice && <span style={{ textDecoration: 'line-through', opacity: .4 }}>{fmtPrice(item.oldPrice)}</span>}
            </div>

            {item.description && <p style={{ lineHeight: 1.7, marginBottom: '24px', opacity: .8 }}>{item.description}</p>}

            <fieldset className="product-variant-picker" style={{ marginBottom: '24px' }}>
              <legend>Аромат <span aria-hidden="true" style={{ color: '#8b2a2a' }}>*</span></legend>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={selectedFragrance}
                  onChange={(event) => { setSelectedFragrance(event.target.value); setFragranceError(false) }}
                  aria-label="Выберите аромат"
                  aria-required="true"
                  style={{ flex: '1 1 260px', padding: '10px', border: fragranceError ? '1px solid #8b2a2a' : '1px solid rgba(91,45,35,.2)', background: 'transparent', fontFamily: 'inherit' }}
                >
                  <option value="">Выберите аромат</option>
                  {fragrances.map((fragrance) => <option key={fragrance.slug} value={fragrance.name}>{fragrance.name}</option>)}
                </select>
                <Link to="/fragrances" target="_blank" rel="noopener noreferrer" className="arrow-link"><span>Все ароматы и состав</span></Link>
              </div>
              {fragranceError && <p role="alert" style={{ color: '#8b2a2a', fontSize: '.85rem', marginTop: '8px' }}>Выберите аромат — без него свечу нельзя добавить в корзину.</p>}
              <details style={{ marginTop: '12px' }}>
                <summary style={{ cursor: 'pointer', fontSize: '.9rem', opacity: .7 }}>Описания ароматов</summary>
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {fragrances.map((fragrance) => (
                    <div key={fragrance.slug}>
                      <strong style={{ fontStyle: 'italic' }}>{fragrance.name}</strong>
                      <p style={{ fontSize: '.85rem', lineHeight: 1.6, opacity: .7, marginTop: '4px' }}>{fragrance.description.join(' ')}</p>
                    </div>
                  ))}
                </div>
              </details>
            </fieldset>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <span style={{ padding: '6px 14px', border: '1px solid rgba(91,45,35,.2)', fontSize: '.85rem' }}>{item.stock > 0 ? `В наличии: ${item.stock} шт` : 'Наличие уточняется'}</span>
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
