import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import '../App.css'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/profile'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate(redirect)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <><PageHeader />
    <main className="auth-page section-light" style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 60px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300, fontSize: '2rem', textAlign: 'center', marginBottom: '8px' }}>Вход</h2>
        <p style={{ textAlign: 'center', opacity: .6, marginBottom: '32px' }}>{redirect === '/cart' ? 'Войдите, чтобы оформить заказ' : 'Рады видеть вас снова'}</p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '14px 16px', border: '1px solid rgba(91,45,35,.2)', background: 'transparent', fontFamily: 'inherit' }}/>
          <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '14px 16px', border: '1px solid rgba(91,45,35,.2)', background: 'transparent', fontFamily: 'inherit' }}/>
          {error && <p style={{ color: '#8b2a2a', fontSize: '.9rem' }}>{error}</p>}
          <button type="submit" disabled={loading} className="arrow-link" style={{ justifyContent: 'center', cursor: 'pointer', border: 'none', padding: '14px' }}>
            <span>{loading ? 'Вход…' : 'Войти'}</span>
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '24px', opacity: .7 }}>
          Нет аккаунта? <Link to={`/register${redirect !== '/profile' ? `?redirect=${redirect}` : ''}`} style={{ textDecoration: 'underline' }}>Зарегистрироваться</Link>
        </p>
      </div>
    </main>
    </>
  )
}
