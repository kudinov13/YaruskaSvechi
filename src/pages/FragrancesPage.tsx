import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useFragrances } from '../lib/useFragrances'
import { useSeo } from '../lib/seo'
import '../App.css'

export default function FragrancesPage() {
  const fragrances = useFragrances()
  useSeo({
    title: 'Ароматы для свечей',
    description: 'Каталог ароматов ЯРУСКА: таёжные дали, вечер у камина, пряный глинтвейн и другие композиции. Выбранный аромат укажите в комментарии к заказу.',
    canonical: '/fragrances',
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return <>
    <PageHeader />
    <main className="section-light" style={{ minHeight: '100svh', paddingTop: '120px', paddingBottom: '80px' }}>
      <div className="shell" style={{ maxWidth: '860px' }}>
        <p className="eyebrow">Каталог ароматов</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '16px' }}>Ароматы</h1>
        <p style={{ lineHeight: 1.7, opacity: .8, marginBottom: '40px', maxWidth: '640px' }}>
          Каждую свечу мы наполняем одним из ароматов ниже. Выберите аромат на странице товара
          или в корзине перед оформлением — без выбора аромата заказ не оформить.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {fragrances.map((fragrance) => (
            <article key={fragrance.slug} id={fragrance.slug} style={{ border: '1px solid rgba(91,45,35,.15)', padding: '24px', background: 'rgba(255,255,255,.4)' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 400, fontStyle: 'italic', fontSize: '1.5rem', marginBottom: '12px' }}>{fragrance.name}</h2>
              {fragrance.description.map((paragraph, index) => (
                <p key={index} style={{ lineHeight: 1.7, opacity: .8, marginTop: index === 0 ? 0 : '10px' }}>{paragraph}</p>
              ))}
            </article>
          ))}
        </div>

        <div style={{ marginTop: '40px' }}>
          <Link to="/catalog" className="arrow-link"><span>Выбрать свечу</span></Link>
        </div>
      </div>
    </main>
  </>
}
