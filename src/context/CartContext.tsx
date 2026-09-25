import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type CartItem = {
  id: string
  productId?: string
  variantId?: string
  title: string
  price: number
  image?: string
  quantity: number
}

type CartContextValue = {
  items: CartItem[]
  add: (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  remove: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
  count: number
  total: number
}

const CartContext = createContext<CartContextValue>(null as unknown as CartContextValue)

const STORAGE_KEY = 'yaruska-cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const add: CartContextValue['add'] = (item, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + qty } : i))
      }
      return [...prev, { ...item, quantity: qty }]
    })
  }

  const remove: CartContextValue['remove'] = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const setQty: CartContextValue['setQty'] = (id, qty) => {
    if (qty <= 0) return remove(id)
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)))
  }

  const clear = useCallback(() => setItems([]), [])

  const count = items.reduce((sum, i) => sum + i.quantity, 0)
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, count, total }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
