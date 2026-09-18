const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000/api'

// Fallback-данные для работы без бэкенда (демо-режим)
const FALLBACK_CATEGORIES = [
  { id: 'c1', slug: 'classic', title: 'Классика', order: 1 },
  { id: 'c2', slug: 'avtor', title: 'Авторские формы', order: 2 },
  { id: 'c3', slug: 'season', title: 'Сезонные коллекции', order: 3 },
  { id: 'c4', slug: 'gift', title: 'В подарок', order: 4 },
]

const FALLBACK_PRODUCTS = [
  { id: 'p1', title: 'Матрёшка', slug: 'matreshka', notes: 'вишня, мёд', price: 2650, oldPrice: undefined, stock: 8, images: ['/Photos/Collection_classic.jpg'], featured: true, categoryId: 'c1', category: { id: 'c1', title: 'Классика', slug: 'classic' }, description: 'Авторская свеча в форме матрёшки. Тёплый аромат вишни и мёда наполняет дом уютом.' },
  { id: 'p2', title: 'Щелкунчик', slug: 'shchelkunchik', notes: 'корица, кедр', price: 2190, oldPrice: undefined, stock: 5, images: ['/Photos/Collection_avtor.jpg'], featured: true, categoryId: 'c2', category: { id: 'c2', title: 'Авторские формы', slug: 'avtor' }, description: 'Свеча-щелкунчик с ароматом корицы и кедра. Идеальна для зимних вечеров.' },
  { id: 'p3', title: 'Ёлочка', slug: 'yelochka', notes: 'ель, можжевельник', price: 1990, oldPrice: undefined, stock: 12, images: ['/Photos/Collections_seson.jpg'], featured: true, categoryId: 'c3', category: { id: 'c3', title: 'Сезонные коллекции', slug: 'season' }, description: 'Праздничная свеча-ёлочка с хвойным ароматом.' },
  { id: 'p4', title: 'Алёнка', slug: 'alenka', notes: 'печёное яблоко', price: 2500, oldPrice: 2900, stock: 6, images: ['/Photos/Vnalichii.jpg'], featured: true, categoryId: 'c1', category: { id: 'c1', title: 'Классика', slug: 'classic' }, description: 'Свеча с тёплым ароматом печёного яблока. Осеннее настроение в каждом доме.' },
  { id: 'p5', title: 'Молочный свет', slug: 'molochnyy-svet', notes: 'хлопок, ваниль', price: 1850, oldPrice: undefined, stock: 10, images: [], featured: false, categoryId: 'c1', category: { id: 'c1', title: 'Классика', slug: 'classic' }, description: 'Нежная свеча с ароматом хлопка и ванили. Лёгкий, воздушный аромат.' },
  { id: 'p6', title: 'Подарочный набор «Тепло»', slug: 'podarochnyy-nabor-teplo', notes: 'ассорти, 3 свечи', price: 5200, oldPrice: undefined, stock: 4, images: ['/Photos/Podarok.jpg'], featured: false, categoryId: 'c4', category: { id: 'c4', title: 'В подарок', slug: 'gift' }, description: 'Набор из трёх авторских свечей в подарочной упаковке.' },
]

function getToken() {
  return localStorage.getItem('token') || ''
}

export function setToken(token: string) {
  localStorage.setItem('token', token)
}

export function clearToken() {
  localStorage.removeItem('token')
}

async function request(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...((options.headers as Record<string, string>) || {}) }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса')
  return data
}

// Проверка доступности бэкенда
let backendAvailable: boolean | null = null

async function withFallback<T>(requestFn: () => Promise<T>, fallbackFn: () => T | Promise<T>): Promise<T> {
  if (backendAvailable === false) return fallbackFn()
  try {
    const result = await requestFn()
    backendAvailable = true
    return result
  } catch (e) {
    if (e instanceof TypeError || (e instanceof Error && e.message === 'Failed to fetch')) {
      backendAvailable = false
      return fallbackFn()
    }
    throw e
  }
}

// SHA-256 хэш пароля для демо-режима (без хранения паролей открытым текстом)
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Демо-админ: ekozza@bk.ru (пароль хранится только как SHA-256 хэш)
const DEMO_ADMIN = { id: 'admin', email: 'ekozza@bk.ru', name: 'Админ', isAdmin: true, passwordHash: '4d6f0d2ff09505b6e0cf784a1387541364b955a649e3e5a457a2ad4bde133c51' }

// Демо-товары для админки (localStorage, seed из FALLBACK_PRODUCTS)
function getDemoCandles() {
  const stored = localStorage.getItem('demo_candles')
  if (stored) return JSON.parse(stored) as typeof FALLBACK_PRODUCTS
  return [...FALLBACK_PRODUCTS]
}

function saveDemoCandles(items: typeof FALLBACK_PRODUCTS) {
  localStorage.setItem('demo_candles', JSON.stringify(items))
}

export const api = {
  // Auth
  register: (body: { email: string; name: string; password: string; phone?: string }) =>
    withFallback(
      () => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
      async () => {
        const users = JSON.parse(localStorage.getItem('demo_users') || '[]')
        if (users.some((u: { email: string }) => u.email === body.email)) {
          throw new Error('Пользователь с таким email уже существует')
        }
        const user = { id: 'u' + Date.now(), email: body.email, name: body.name, phone: body.phone, isAdmin: false }
        const passwordHash = await sha256(body.password)
        users.push({ ...user, passwordHash })
        localStorage.setItem('demo_users', JSON.stringify(users))
        localStorage.setItem('demo_user', JSON.stringify(user))
        const token = 'demo-' + user.id
        return { token, user }
      },
    ),
  login: (body: { email: string; password: string }) =>
    withFallback(
      () => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
      async () => {
        const hash = await sha256(body.password)
        if (body.email === DEMO_ADMIN.email && hash === DEMO_ADMIN.passwordHash) {
          const { passwordHash: _ph, ...user } = DEMO_ADMIN
          localStorage.setItem('demo_user', JSON.stringify(user))
          return { token: 'demo-admin', user }
        }
        const users = JSON.parse(localStorage.getItem('demo_users') || '[]')
        const found = users.find((u: { email: string; passwordHash: string }) => u.email === body.email && u.passwordHash === hash)
        if (!found) throw new Error('Неверный email или пароль')
        const user = { id: found.id, email: found.email, name: found.name, phone: found.phone, isAdmin: found.isAdmin || false }
        localStorage.setItem('demo_user', JSON.stringify(user))
        const token = 'demo-' + user.id
        return { token, user }
      },
    ),
  me: () => withFallback(
    () => request('/auth/me'),
    () => {
      const user = JSON.parse(localStorage.getItem('demo_user') || 'null')
      if (!user) throw new Error('Не авторизован')
      return { user }
    },
  ),

  // Products
  products: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : ''
    return withFallback(
      () => request(`/products${q}`),
      () => {
        let items = getDemoCandles()
        if (params?.featured === 'true') items = items.filter((p) => p.featured)
        if (params?.category) items = items.filter((p) => p.categoryId === params.category)
        if (params?.q) items = items.filter((p) => p.title.toLowerCase().includes(params.q!.toLowerCase()))
        return { items }
      },
    )
  },
  categories: () => withFallback(
    () => request('/products/categories'),
    () => ({ categories: FALLBACK_CATEGORIES }),
  ),
  product: (id: string) => withFallback(
    () => request(`/products/${id}`),
    () => {
      const item = getDemoCandles().find((p) => p.id === id || p.slug === id)
      if (!item) throw new Error('Товар не найден')
      return { item }
    },
  ),

  // Orders
  createOrder: (body: { items: { candleId: string; quantity: number; id?: string; title?: string; price?: number }[]; address?: string; total?: number }) =>
    withFallback(
      () => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
      () => {
        const orders = JSON.parse(localStorage.getItem('demo_orders') || '[]')
        const order = {
          id: 'o' + Date.now(),
          items: body.items,
          address: body.address,
          total: body.total || 0,
          status: 'NEW',
          createdAt: new Date().toISOString(),
        }
        orders.push(order)
        localStorage.setItem('demo_orders', JSON.stringify(orders))
        return { order }
      },
    ),
  orders: () => withFallback(
    () => request('/orders'),
    () => ({ orders: JSON.parse(localStorage.getItem('demo_orders') || '[]') }),
  ),
  order: (id: string) => request(`/orders/${id}`),

  // Admin
  adminCandles: () => withFallback(
    () => request('/admin/candles'),
    () => ({ items: getDemoCandles() }),
  ),
  adminCreateCandle: (body: Record<string, unknown>) =>
    withFallback(
      () => request('/admin/candles', { method: 'POST', body: JSON.stringify(body) }),
      () => {
        const items = getDemoCandles()
        const item = { ...body, id: 'dc' + Date.now(), slug: body.slug || String(body.title).toLowerCase() }
        items.unshift(item as (typeof items)[number])
        saveDemoCandles(items)
        return { item }
      },
    ),
  adminUpdateCandle: (id: string, body: Record<string, unknown>) =>
    withFallback(
      () => request(`/admin/candles/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
      () => {
        const items = getDemoCandles()
        const idx = items.findIndex((c) => c.id === id)
        if (idx >= 0) {
          items[idx] = { ...items[idx], ...body }
          saveDemoCandles(items)
        }
        return { item: items[idx] }
      },
    ),
  adminDeleteCandle: (id: string) =>
    withFallback(
      () => request(`/admin/candles/${id}`, { method: 'DELETE' }),
      () => {
        saveDemoCandles(getDemoCandles().filter((c) => c.id !== id))
        return { ok: true }
      },
    ),
  adminUpload: async (formData: FormData) => {
    const res = await fetch(`${API_URL}/admin/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Ошибка загрузки файла')
    return data as { files: string[] }
  },
  adminOrders: () => withFallback(
    () => request('/admin/orders'),
    () => ({ orders: JSON.parse(localStorage.getItem('demo_orders') || '[]') }),
  ),
  adminUpdateOrder: (id: string, body: { status?: string; cdekTrack?: string }) =>
    withFallback(
      () => request(`/admin/orders/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
      () => {
        const orders = JSON.parse(localStorage.getItem('demo_orders') || '[]')
        const order = orders.find((o: { id: string }) => o.id === id)
        if (order) { Object.assign(order, body); localStorage.setItem('demo_orders', JSON.stringify(orders)) }
        return { order }
      },
    ),
}

export const UPLOAD_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://127.0.0.1:4000'

// Для fallback-фото (локальные пути из /Photos)
export function imgUrl(img?: string): string {
  if (!img) return ''
  if (img.startsWith('/Photos/') || img.startsWith('/uploads/')) return img
  return `${UPLOAD_BASE}${img}`
}
