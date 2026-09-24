import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { consent, legalRevision, offer, privacy, type LegalDocument } from '../lib/legalDocuments'
import '../App.css'

const pages: Record<string, { eyebrow: string; document: LegalDocument }> = {
  '/offer': { eyebrow: 'Условия покупки', document: offer },
  '/privacy': { eyebrow: 'Персональные данные', document: privacy },
  '/consent': { eyebrow: 'Персональные данные', document: consent },
  '/delivery': { eyebrow: 'Информация для покупателей', document: { title: 'Доставка и получение заказа', sections: [offer.sections[5]] } },
  '/returns': { eyebrow: 'Информация для покупателей', document: { title: 'Возврат товара', sections: [offer.sections[8]] } },
  '/contacts': { eyebrow: 'ЯРУСКА', document: { title: 'Контакты и реквизиты', sections: [offer.sections[13]] } },
}

const navigation = [
  { to: '/offer', label: 'Публичная оферта' },
  { to: '/delivery', label: 'Доставка' },
  { to: '/returns', label: 'Возврат' },
  { to: '/privacy', label: 'Политика обработки данных' },
  { to: '/consent', label: 'Согласие на обработку данных' },
  { to: '/contacts', label: 'Контакты и реквизиты' },
]

export default function LegalPage() {
  const { pathname } = useLocation()
  const { eyebrow, document: legalDoc } = pages[pathname] || pages['/offer']

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = `${legalDoc.title} — ЯРУСКА`
    return () => { document.title = 'Яруска — авторские свечи ручной работы' }
  }, [legalDoc, pathname])

  return <>
    <PageHeader />
    <main className="legal-page section-light">
      <div className="shell legal-layout">
        <aside className="legal-navigation" aria-label="Документы и информация">
          <Link to="/" className="legal-back">← На главную</Link>
          <p className="eyebrow">Документы</p>
          <nav>{navigation.map((link) => <Link key={link.to} to={link.to} aria-current={link.to === pathname ? 'page' : undefined}>{link.label}</Link>)}</nav>
        </aside>
        <article className="legal-document">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{legalDoc.title}</h1>
          {legalDoc.subtitle && <p className="legal-subtitle">{legalDoc.subtitle}</p>}
          <p className="legal-revision">Редакция от {legalRevision}</p>
          <div className="legal-sections">
            {legalDoc.sections.map((section) => <section key={section.title}>
              {section.title !== 'Преамбула' && <h2>{section.title}</h2>}
              {section.text.split('\n').map((line, index) => <p key={index}>{line}</p>)}
            </section>)}
          </div>
          <div className="legal-help">Вопросы по заказу и документам: <a href="mailto:ekozza@bk.ru">ekozza@bk.ru</a> · <a href="tel:+79534393158">+7 (953) 439-31-58</a></div>
        </article>
      </div>
    </main>
    <footer className="legal-footer"><div className="shell"><Link to="/">ЯРУСКА</Link><nav aria-label="Правовая информация">{navigation.map((link) => <Link key={link.to} to={link.to}>{link.label}</Link>)}</nav></div></footer>
  </>
}
