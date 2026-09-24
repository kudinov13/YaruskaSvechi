import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import '../App.css'

type IconName = 'search' | 'user' | 'bag' | 'menu' | 'arrow' | 'heart' | 'hand' | 'flower' | 'spark' | 'globe' | 'telegram' | 'vk' | 'pin'

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

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export default function PageHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, isAdmin } = useAuth()
  const { count: cartCount } = useCart()
  const { count: favCount } = useFavorites()

  return (
    <header className="site-header page-header shell">
      <Link className="brand brand-dark" to="/" aria-label="Яруска, на главную"><strong>ЯРУСКА</strong></Link>
      <nav className={menuOpen ? 'nav is-open nav-dark' : 'nav nav-dark'} aria-label="Основная навигация">
        <Link to="/catalog" onClick={() => setMenuOpen(false)}>Коллекции</Link>
        <Link to="/#story" onClick={() => setMenuOpen(false)}>О бренде</Link>
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
        <Link to="/cart" aria-label="Корзина" className="header-icon-link">
          <Icon name="bag" size={24}/>
          {cartCount > 0 && <span className="header-badge">{cartCount}</span>}
        </Link>
        <button className="menu-button" type="button" aria-label="Открыть меню" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><Icon name="menu" size={20}/></button>
      </div>
    </header>
  )
}
