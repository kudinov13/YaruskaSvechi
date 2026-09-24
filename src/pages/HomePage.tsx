import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, imgUrl } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import '../App.css'

type IconName = 'search' | 'user' | 'bag' | 'menu' | 'arrow' | 'heart' | 'hand' | 'flower' | 'spark' | 'globe' | 'telegram' | 'vk' | 'pin'

type Candle = {
  id: string; title: string; slug: string; notes?: string; price: number;
  oldPrice?: number; stock: number; images: string[]; featured?: boolean;
  variants?: { id: string; name: string; images: string[] }[];
}

const TONES = ['ruby', 'amber', 'forest', 'velvet', 'clay', 'cream']

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    search: <><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6"/></>,
    bag: <><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    arrow: <><path d="M4 12h15M14 7l5 5-5 5"/></>,
    heart: <path d="M12 20S4 15.5 4 9.5C4 6 8.5 4.5 12 8c3.5-3.5 8-2 8 1.5 0 6-8 10.5-8 10.5Z"/>,
    hand: <><path d="M7 12V7a2 2 0 0 1 4 0v4-6a2 2 0 0 1 4 0v6-4a2 2 0 0 1 4 0v7c0 5-3 8-8 8-3 0-5-2-7-5l-2-3a2 2 0 0 1 3-2l2 2"/></>,
    flower: <><circle cx="12" cy="12" r="2"/><path d="M12 10c-4-1-4-6-1-7 3-1 4 4 1 7Zm2 2c1-4 6-4 7-1 1 3-4 4-7 1Zm-2 2c4 1 4 6 1 7-3 1-4-4-1-7Zm-2-2c-1 4-6 4-7 1-1-3 4-4 7-1Z"/></>,
    spark: <><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></>,
    telegram: <path d="m3 11 17-7-4 16-5-5-3 3v-5l8-6-10 5-3-1Z"/>,
    vk: <path d="M4 7c1 6 4 10 9 10h2v-4c2 0 3 2 5 4h2c-1-3-3-5-4-6 1-1 3-3 3-5h-3c-1 2-2 4-3 4V6h-4v7C9 13 8 9 7 7H4Z"/>,
    pin: <><path d="M12 21s6-6 6-12a6 6 0 0 0-12 0c0 6 6 12 6 12Z"/><circle cx="12" cy="9" r="2"/></>,
  }
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function PhotoPlaceholder({ className = '', label = 'Место для фотографии', tone = 'ruby', src = '', mobileSrc = '' }: { className?: string; label?: string; tone?: string; src?: string; mobileSrc?: string }) {
  return (
    <div className={`photo-placeholder tone-${tone} ${className}`} aria-label={label}>
      {src ? (
        mobileSrc ? <picture><source media="(max-width: 768px)" srcSet={mobileSrc}/><img src={src} alt={label} loading="lazy"/></picture> : <img src={src} alt={label} loading="lazy"/>
      ) : <div className="placeholder-frame"><span>Фото</span><small>{label}</small></div>}
    </div>
  )
}

function ArrowLink({ children, to = '#' }: { children: React.ReactNode; to?: string }) {
  return <Link className="arrow-link" to={to}><span>{children}</span><Icon name="arrow" size={16}/></Link>
}

function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [favorites, setFavorites] = useState<number[]>([])
  const [items, setItems] = useState<Candle[]>([])
  const [featured, setFeatured] = useState<Candle[]>([])
  const { user, isAdmin } = useAuth()
  const { count: cartCount, add } = useCart()
  const { count: favCount } = useFavorites()

  const fmtPrice = (n: number) => n.toLocaleString('ru-RU') + ' ₽'

  useEffect(() => {
    api.products().then(({ items }) => setItems(items)).catch(() => {})
    api.products({ featured: 'true' }).then(({ items }) => setFeatured(items)).catch(() => {})
  }, [])

  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>('[data-reveal]')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' })
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [items, featured])

  const toggleFavorite = (index: number) => {
    setFavorites((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])
  }

  return (
    <main>
      <section className="hero-section hero-solid" id="home">
        <div className="hero-vignette"/>
        <header className="site-header shell">
          <Link className="brand brand-light" to="/" aria-label="Яруска, на главную"><strong>ЯРУСКА</strong><span>авторские свечи<br/>ручной работы</span></Link>
          <nav className={menuOpen ? 'nav is-open' : 'nav'} aria-label="Основная навигация">
            <Link to="/catalog" onClick={() => setMenuOpen(false)}>Коллекции</Link>
            <a href="#story" onClick={() => setMenuOpen(false)}>О бренде</a>
            <Link to="/delivery" onClick={() => setMenuOpen(false)}>Доставка</Link>
            <Link to="/contacts" onClick={() => setMenuOpen(false)}>Контакты</Link>
            <div className="nav-divider mobile-only"/>
            <Link to={user ? '/profile' : '/login'} onClick={() => setMenuOpen(false)} className="nav-icon-link mobile-only"><span>{user ? 'Личный кабинет' : 'Войти'}</span></Link>
            <Link to="/favorites" onClick={() => setMenuOpen(false)} className="nav-icon-link mobile-only"><span>Избранное</span>{favCount > 0 && <span className="nav-badge">{favCount}</span>}</Link>
            {isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)} className="nav-icon-link mobile-only"><span>Админ-панель</span></Link>}
          </nav>
          <div className="header-actions">
            <Link to={user ? '/profile' : '/login'} className="header-text-link desktop-only"><span>{user ? 'Профиль' : 'Войти'}</span></Link>
            <Link to="/favorites" className="header-text-link desktop-only" style={{ position: 'relative' }}>
              <span>Избранное</span>
              {favCount > 0 && <span className="header-badge">{favCount}</span>}
            </Link>
            {isAdmin && <Link to="/admin" className="header-text-link desktop-only"><span>Админ</span></Link>}
            <Link to="/cart" aria-label="Корзина" style={{ position: 'relative' }}>
              <Icon name="bag" size={24}/>
              {cartCount > 0 && <span style={{ position: 'absolute', top: '4px', right: '2px', background: '#5b2d23', color: '#eee8df', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>}
            </Link>
            <button className="menu-button" type="button" aria-label="Открыть меню" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><Icon name="menu" size={20}/></button>
          </div>
        </header>

        <div className="hero-copy" data-reveal>
          <p className="eyebrow light">Свечи, которые</p>
          <h1>ЯРУСКА — <em>свечи, которые дарят эмоции</em></h1>
          <p className="hero-text">Авторские свечи ручной работы, вдохновлённые русскими традициями, красотой и тёплыми воспоминаниями.</p>
          <ArrowLink to="/catalog">Смотреть коллекцию</ArrowLink>
        </div>
        <div className="hero-note"><span>Свет,<br/>в котором<br/>живёт память<br/>дома и тепло<br/>родных<br/>рук</span><i/></div>
        <div className="scroll-cue"><span>Листайте<br/>вниз</span><i/></div>
      </section>

      {/* Мобильный блок: быстрые товары */}
      <section className="mobile-quick section-light">
        <div className="shell">
          <div className="mobile-quick-head">
            <h2>Популярные свечи</h2>
            <Link to="/catalog" className="arrow-link"><span>Смотреть все</span><Icon name="arrow" size={16}/></Link>
          </div>
          <div className="mobile-quick-scroll">
            {featured.slice(0, 4).map((item, index) => (
              <Link className="mobile-quick-card" to={`/product/${item.id}`} key={item.id}>
                <PhotoPlaceholder label={item.title} tone={TONES[index % TONES.length]} src={imgUrl(item.images?.[0])}/>
                <h3>{item.title}</h3>
                <p>{item.notes}</p>
                <strong>{fmtPrice(item.price)}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="collections section-light" id="collections">
        <div className="shell">
          <div className="section-heading" data-reveal>
            <div><p className="eyebrow">Товары</p><h2>Наши свечи</h2></div>
            <ArrowLink to="/catalog">Все товары</ArrowLink>
          </div>
          <div className="collection-grid">
            {items.slice(0, 4).map((item, index) => (
              <div className="collection-card" key={item.id} data-reveal style={{ '--delay': `${index * 70}ms` } as React.CSSProperties}>
                <Link to={`/product/${item.id}`}>
                  <PhotoPlaceholder label={item.title} tone={TONES[index % TONES.length]} src={imgUrl(item.images?.[0])}/>
                </Link>
                <div className="card-meta">
                  <div><h3>{item.title}</h3><p>{item.notes}</p><strong>{fmtPrice(item.price)}</strong></div>
                  {item.variants?.length ? (
                    <Link to={`/product/${item.id}`} className="card-add-btn variant-choice-link"><span>Выбрать цвет</span></Link>
                  ) : (
                    <button className="card-add-btn" onClick={() => add({ id: item.id, title: item.title, price: item.price, image: imgUrl(item.images?.[0]) })}><span>В корзину</span></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="craft" id="story">
        <PhotoPlaceholder className="craft-photo" label="Мастер расписывает свечу вручную" tone="craft" src="/Photos/OBrende.jpg"/>
        <div className="craft-copy" data-reveal>
          <p className="eyebrow light">О бренде</p>
          <h2>Ручная работа<br/>в каждой детали</h2>
          <p>Каждая свеча Яруска создаётся вручную: от первого эскиза до последнего штриха. Мы соединяем традиционные формы, безопасные ароматические композиции и внимательное отношение к материалам.</p>
          <ArrowLink to="/catalog">Узнать больше</ArrowLink>
        </div>
        <div className="craft-values" data-reveal>
          <div><Icon name="hand"/><span>Натуральный<br/>воск</span></div>
          <div><Icon name="flower"/><span>Авторские<br/>ароматы</span></div>
          <div><Icon name="spark"/><span>Ручная<br/>работа</span></div>
          <div><Icon name="globe"/><span>Лимитированные<br/>серии</span></div>
        </div>
      </section>

      <section className="popular section-light" id="popular">
        <div className="shell popular-layout">
          <aside className="popular-intro" data-reveal>
            <p className="eyebrow popular-eyebrow-first">Популярные</p>
            <p className="popular-eyebrow-second">Свечи</p>
            <h2>Те самые формы, которые хочется<br/>дарить близким, забирать себе<br/>и зажигать, когда дома<br/>собираются люди, которых<br/>по-настоящему любишь</h2>
            <ArrowLink to="/catalog">Все свечи</ArrowLink>
          </aside>
          <div className="product-grid">
            {featured.slice(0, 4).map((item, index) => (
              <article className="product-card" key={item.id} data-reveal style={{ '--delay': `${index * 60}ms` } as React.CSSProperties}>
                <div className="product-media">
                  <Link to={`/product/${item.id}`}>
                    <PhotoPlaceholder label={item.title} tone={TONES[index % TONES.length]} src={imgUrl(item.images?.[0])}/>
                  </Link>
                  <button className={favorites.includes(index) ? 'favorite is-active' : 'favorite'} type="button" aria-label={`Добавить ${item.title} в избранное`} onClick={() => toggleFavorite(index)}><Icon name="heart" size={15}/></button>
                </div>
                <h3>{item.title}</h3><p>{item.notes}</p><strong>{fmtPrice(item.price)}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="gift gift-solid" id="delivery">
        <div className="gift-copy" data-reveal>
          <p className="eyebrow light">Подарок</p>
          <h2>Идеальное решение<br/>для особенного человека</h2>
          <p>Мы бережно упакуем свечу, добавим открытку и отправим подарок по нужному адресу. Вам останется выбрать аромат и написать пару тёплых слов.</p>
          <Link to="/cart" className="arrow-link gift-order-btn"><span>Оформить заказ</span></Link>
        </div>
        <div className="gift-side">
          <blockquote><span className="gift-diamond"/>Подарок,<br/>который<br/>запомнится<br/>без слов<span className="gift-diamond"/></blockquote>
        </div>
      </section>

      <footer className="footer" id="contacts">
        <div className="shell footer-main">
          <Link className="brand brand-light" to="/"><strong>ЯРУСКА</strong><span>авторские свечи<br/>ручной работы</span></Link>
          <div className="newsletter"><p>Связаться с нами</p><p>Ющенко Валерия Александровна · ИНН 621304947080</p><a href="mailto:ekozza@bk.ru">ekozza@bk.ru</a><br/><a href="tel:+79534393158">+7 (953) 439-31-58</a></div>
          <nav className="footer-nav" aria-label="Навигация в подвале"><Link to="/catalog">Коллекции</Link><a href="#story">О бренде</a><Link to="/delivery">Доставка</Link><Link to="/returns">Возврат</Link><Link to="/contacts">Контакты и реквизиты</Link><Link to="/offer">Публичная оферта</Link><Link to="/privacy">Политика обработки данных</Link><Link to="/consent">Согласие на обработку данных</Link></nav>
        </div>
        <div className="shell footer-bottom"><span>© 2026 ЯРУСКА. Ющенко Валерия Александровна</span><Link to="/privacy">Политика обработки персональных данных</Link><span>Свечи ручной работы</span></div>
      </footer>
    </main>
  )
}

export default HomePage
