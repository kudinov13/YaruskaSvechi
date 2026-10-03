// Заполнение справочника ароматов из prisma/fragrances.json (идемпотентно, по slug).
// Запуск: node prisma/seed-fragrances.js
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'fragrances.json'), 'utf8'))

const prisma = new PrismaClient()
try {
  // Только добавляем недостающие — правки из админки не затираем
  const { count } = await prisma.fragrance.createMany({
    data: data.map((item, index) => ({
      slug: item.slug,
      name: item.name,
      description: item.description,
      order: index,
    })),
    skipDuplicates: true,
  })
  console.log(`seeded: ${count} new fragrances (${data.length} in catalog)`)
} finally {
  await prisma.$disconnect()
}
