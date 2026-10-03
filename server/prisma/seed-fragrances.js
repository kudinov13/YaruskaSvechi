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
  for (const [index, item] of data.entries()) {
    await prisma.fragrance.upsert({
      where: { slug: item.slug },
      update: { name: item.name, description: item.description, order: index },
      create: { slug: item.slug, name: item.name, description: item.description, order: index },
    })
    console.log(`ok: ${item.name}`)
  }
} finally {
  await prisma.$disconnect()
}
