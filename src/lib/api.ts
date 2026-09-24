const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000/api'

// Fallback-данные для работы без бэкенда (демо-режим)
const FALLBACK_CATEGORIES = [
  { id: 'c5', slug: 'shkatulki', title: 'Свечи-шкатулки', order: 1 },
]

const FALLBACK_PRODUCTS = [
  { id: 'p1', title: 'Свеча-шкатулка Щелкунчик', slug: 'svecha-shkatulka-shchelkunchik', notes: '', price: 5000, stock: 0, images: ['/Photos/Shelk_One.jpg', '/Photos/Shelk_Two.jpg', '/Photos/Shelk_Tree.jpg'], featured: true, categoryId: 'c5', category: { id: 'c5', title: 'Свечи-шкатулки', slug: 'shkatulki' }, description: 'Свеча-шкатулка «Щелкунчик» — когда подарок хочется не просто подарить, а впечатлить.\nРучная работа из гипса, внутри — натуральный соевый воск 🤍 Красивый декор, уютное свечение и шкатулка, которая останется с вами и после того, как свеча догорит.\nИдея подарка, которую точно захочется рассмотреть поближе.' },
  { id: 'p2', title: 'Свеча-шкатулка Ёлка', slug: 'svecha-shkatulka-yolka', notes: '', price: 6000, stock: 0, images: ['/Photos/Elka_One.jpg', '/Photos/Elka_Two.jpg', '/Photos/Elka_Tree.jpg', '/Photos/Elka_Four.jpg'], featured: true, categoryId: 'c5', category: { id: 'c5', title: 'Свечи-шкатулки', slug: 'shkatulki' }, description: 'Свеча-шкатулка «Ёлка» из коллекции «Щелкунчик» — маленькая деталь, которая создаёт настоящее новогоднее настроение.\nГипс ручной работы + натуральный соевый воск. Зажигаете — наслаждаетесь уютом, а после свечи у вас остаётся красивая шкатулка.\nИдея подарка, которая точно не затеряется среди обычных.' },
  { id: 'p3', title: 'Свеча-шкатулка Весна', slug: 'svecha-shkatulka-vesna', notes: '', price: 4500, stock: 0, images: ['/Photos/Vesna_One.jpg', '/Photos/Vesna_Two.jpg'], featured: true, categoryId: 'c5', category: { id: 'c5', title: 'Свечи-шкатулки', slug: 'shkatulki' }, description: 'Свеча-шкатулка «Матрешка Весна» — подарок, который хочется рассматривать и хранить.\nГипс ручной работы и натуральный соевый воск. Зажигаете свечу — наслаждаетесь уютом, а после она превращается в красивую шкатулку для маленьких сокровищ.\nНеобычный подарок, который точно запомнится.' },
  { id: 'p4', title: 'Свеча-шкатулка Барыня с самоваром', slug: 'svecha-shkatulka-barynya-s-samovarom', notes: '', price: 4500, stock: 0, images: ['/Photos/Barina.jpg'], featured: true, categoryId: 'c5', category: { id: 'c5', title: 'Свечи-шкатулки', slug: 'shkatulki' }, description: 'Свеча-шкатулка «Барыня с самоваром» — частичка русского уюта в необычном исполнении.\nГипс ручной работы + натуральный соевый воск. Зажигаете свечу — создаёте атмосферу тепла, а после она превращается в красивую шкатулку.\nОригинальный подарок для тех, кто ценит ручную работу и вещи с характером.' },
  { id: 'p5', title: 'Свеча-шкатулка Самовар', slug: 'svecha-shkatulka-samovar', notes: '', price: 6000, stock: 0, images: ['/Photos/Samovar_One.jpg', '/Photos/Samovar_four.jpg', '/Photos/Samovar_Two.jpg'], variants: [{ id: 'white', name: 'Белый', images: ['/Photos/Samovar_One.jpg', '/Photos/Samovar_four.jpg', '/Photos/Samovar_Two.jpg'] }, { id: 'red', name: 'Красный', images: ['/Photos/Samovar_Tree.jpg', '/Photos/Samovar_Two.jpg'] }], featured: false, categoryId: 'c5', category: { id: 'c5', title: 'Свечи-шкатулки', slug: 'shkatulki' }, description: 'Самовар — символ русского уюта, теперь в формате свечи-шкатулки.\nКаждая деталь выполнена вручную из гипса, внутри — натуральный соевый воск. Зажгите самовар-свечу — и наполните пространство атмосферой тёплых чаепитий и домашнего уюта.\nПосле свечи самовар остаётся красивой шкатулкой — как маленький предмет с историей.' },
  { id: 'p6', title: 'Свеча-шкатулка Василиса с караваем', slug: 'svecha-shkatulka-vasilisa-s-karavaem', notes: '', price: 5000, stock: 0, images: ['/Photos/Vasilisa_One.jpg', '/Photos/Vasilisa_Two.jpg'], featured: false, categoryId: 'c5', category: { id: 'c5', title: 'Свечи-шкатулки', slug: 'shkatulki' }, description: 'Свеча-шкатулка «Василиса с караваем» — настоящая русская сказка в миниатюре.\nРучная работа из гипса + натуральный соевый воск. Образ Василисы с караваем наполнен теплом, гостеприимством и особым смыслом.\nА когда свеча догорит, красивая шкатулка останется на память.' },
  { id: 'p7', title: 'Свеча-шкатулка Аннушка с петушком', slug: 'svecha-shkatulka-annushka-s-petushkom', notes: '', price: 4500, stock: 0, images: ['/Photos/Anushka_One.jpg', '/Photos/Anushka_Two.jpg'], featured: false, categoryId: 'c5', category: { id: 'c5', title: 'Свечи-шкатулки', slug: 'shkatulki' }, description: 'Свеча-шкатулка «Аннушка с петушком» — яркая матрёшка с настоящим русским характером.\nГипс ручной работы + натуральный соевый воск. Петушок — символ бодрости, достатка и домашнего уюта, а сама матрёшка станет необычным украшением интерьера.\nЗажигаете свечу — создаёте атмосферу. После — остаётся красивая шкатулка на память.' },
  { id: 'p8', title: 'Свеча-шкатулка Настенька с ягнёнком', slug: 'svecha-shkatulka-nastenka-s-yagnenkom', notes: '', price: 5500, stock: 0, images: ['/Photos/Nastya_One.jpg', '/Photos/Nastya_Two.jpg'], featured: false, categoryId: 'c5', category: { id: 'c5', title: 'Свечи-шкатулки', slug: 'shkatulki' }, description: 'Свеча-шкатулка «Настенька с ягнёнком» — нежность и тепло в каждой детали.\nГипс ручной работы + натуральный соевый воск. Милая матрёшка с ягнёнком станет особенным украшением интерьера и трогательным подарком.\nА когда свеча догорит, останется красивая шкатулка на память.' },
  { id: 'p9', title: 'Свеча-шкатулка Царица', slug: 'svecha-shkatulka-tsaritsa', notes: '', price: 3500, stock: 0, images: ['/Photos/Carica_One.jpg', '/Photos/Carica_Two.jpg'], featured: false, categoryId: 'c5', category: { id: 'c5', title: 'Свечи-шкатулки', slug: 'shkatulki' }, description: '«Если бы я была царицей…» — свеча-шкатулка для той, кто заслуживает королевского подарка.\nГипс ручной работы + натуральный соевый воск. Эффектная «Царица» станет украшением интерьера, а после свечи превратится в красивую шкатулку.\nНе просто свеча — подарок с характером, который хочется рассматривать.' },
  { id: 'p10', title: 'Свеча-шкатулка Я так чувствую', slug: 'svecha-shkatulka-ya-tak-chuvstvuyu', notes: '', price: 3500, stock: 0, images: ['/Photos/Chudvstvo_One.jpg', '/Photos/Chuvstvo_Two.jpg'], featured: false, categoryId: 'c5', category: { id: 'c5', title: 'Свечи-шкатулки', slug: 'shkatulki' }, description: '«Я так чувствую» — свеча-шкатулка для тех, кто не боится быть собой.\nГипс ручной работы + натуральный соевый воск. Зажгите свечу — и наполните пространство теплом. А после она останется красивой шкатулкой с фразой, которая говорит всё без лишних слов.\nНеобычный подарок с характером и настроением.' },
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
  const stored = localStorage.getItem('demo_candles_v2')
  if (stored) return JSON.parse(stored) as typeof FALLBACK_PRODUCTS
  return [...FALLBACK_PRODUCTS]
}

function saveDemoCandles(items: typeof FALLBACK_PRODUCTS) {
  localStorage.setItem('demo_candles_v2', JSON.stringify(items))
}

export const api = {
  // Auth
  register: (body: { email: string; name: string; password: string; phone?: string; dataProcessingConsent: boolean }) =>
    withFallback(
      () => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
      async () => {
        if (body.dataProcessingConsent !== true) throw new Error('Для регистрации необходимо согласие на обработку персональных данных')
        const users = JSON.parse(localStorage.getItem('demo_users') || '[]')
        if (users.some((u: { email: string }) => u.email === body.email)) {
          throw new Error('Пользователь с таким email уже существует')
        }
        const user = { id: 'u' + Date.now(), email: body.email, name: body.name, phone: body.phone, isAdmin: false }
        const passwordHash = await sha256(body.password)
        users.push({ ...user, passwordHash, dataProcessingConsentAt: new Date().toISOString(), dataProcessingConsentVersion: '2026-09-24' })
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
    () => {
      const used = new Set(getDemoCandles().map((item) => item.categoryId))
      return { categories: FALLBACK_CATEGORIES.filter((category) => used.has(category.id)) }
    },
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
  createOrder: (body: { items: { candleId: string; quantity: number; id?: string; title?: string; price?: number; variantId?: string }[]; address?: string; total?: number; offerAccepted: boolean; dataProcessingConsent: boolean }) =>
    withFallback(
      () => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
      () => {
        if (body.offerAccepted !== true || body.dataProcessingConsent !== true) throw new Error('Для оформления заказа необходимы принятие оферты и согласие на обработку персональных данных')
        const user = JSON.parse(localStorage.getItem('demo_user') || 'null')
        if (!user?.id) throw new Error('Не авторизован')
        const orders = JSON.parse(localStorage.getItem('demo_orders') || '[]')
        const consentAt = new Date().toISOString()
        const order = {
          id: 'o' + Date.now(),
          items: body.items,
          address: body.address,
          total: body.total || 0,
          status: 'NEW',
          userId: user.id,
          offerAcceptedAt: consentAt,
          offerVersion: '2026-09-24',
          dataProcessingConsentAt: consentAt,
          dataProcessingConsentVersion: '2026-09-24',
          createdAt: consentAt,
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
