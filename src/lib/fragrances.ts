import fragrancesData from '../../server/prisma/fragrances.json'

export type Fragrance = {
  id?: string
  slug: string
  name: string
  description: string[]
  order?: number
  active?: boolean
}

// Запасной каталог на случай недоступности API (демо-режим).
// Источник истины на проде — таблица Fragrance, управляется из админки.
export const FRAGRANCES: Fragrance[] = fragrancesData as Fragrance[]
