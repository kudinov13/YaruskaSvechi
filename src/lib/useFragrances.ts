import { useEffect, useState } from 'react'
import { api } from './api'
import { FRAGRANCES, type Fragrance } from './fragrances'

let cache: Fragrance[] | null = null

export function invalidateFragrancesCache() {
  cache = null
}

export function useFragrances(): Fragrance[] {
  const [items, setItems] = useState<Fragrance[]>(cache || FRAGRANCES)

  useEffect(() => {
    let active = true
    api.fragrances()
      .then((res) => {
        const list = (res.items || []).map((item: Fragrance) => ({
          id: item.id,
          slug: item.slug,
          name: item.name,
          description: Array.isArray(item.description) ? item.description : [],
          order: item.order,
          active: item.active,
        }))
        cache = list
        if (active) setItems(list)
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  return items
}
