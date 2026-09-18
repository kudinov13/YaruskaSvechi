import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type FavoriteItem = {
  id: string
  title: string
  price: number
  image?: string
  notes?: string
}

type FavoritesContextValue = {
  items: FavoriteItem[]
  toggle: (item: FavoriteItem) => void
  has: (id: string) => boolean
  remove: (id: string) => void
  count: number
}

const FavoritesContext = createContext<FavoritesContextValue>(null as unknown as FavoritesContextValue)

const STORAGE_KEY = 'yaruska-favorites'

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FavoriteItem[]>(() => {
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

  const toggle: FavoritesContextValue['toggle'] = (item) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) {
        return prev.filter((i) => i.id !== item.id)
      }
      return [...prev, item]
    })
  }

  const has: FavoritesContextValue['has'] = (id) => items.some((i) => i.id === id)

  const remove: FavoritesContextValue['remove'] = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const count = items.length

  return (
    <FavoritesContext.Provider value={{ items, toggle, has, remove, count }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  return useContext(FavoritesContext)
}
