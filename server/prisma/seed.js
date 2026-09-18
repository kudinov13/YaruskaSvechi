import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPass = await bcrypt.hash('Artemmatvey2022', 10)
  await prisma.user.upsert({
    where: { email: 'ekozza@bk.ru' },
    update: {},
    create: { email: 'ekozza@bk.ru', name: 'Админ', password: adminPass, role: 'ADMIN' },
  })

  const categories = [
    { slug: 'classic', title: 'Классика', order: 1 },
    { slug: 'avtor', title: 'Авторские формы', order: 2 },
    { slug: 'season', title: 'Сезонные коллекции', order: 3 },
    { slug: 'gift', title: 'В подарок', order: 4 },
  ]
  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c })
  }

  const candles = [
    { title: 'Матрёшка', slug: 'matreshka', notes: 'вишня, мёд', price: 2650, categoryId: 'classic', images: [], season: 'spring' },
    { title: 'Щелкунчик', slug: 'shchelkunchik', notes: 'корица, кедр', price: 2190, categoryId: 'avtor', images: [], season: 'winter' },
    { title: 'Ёлочка', slug: 'yelochka', notes: 'ель, можжевельник', price: 1990, categoryId: 'season', images: [], season: 'winter' },
    { title: 'Алёнка', slug: 'alenka', notes: 'печёное яблоко', price: 2500, categoryId: 'classic', images: [], season: 'autumn' },
    { title: 'Молочный свет', slug: 'molochnyy-svet', notes: 'хлопок, ваниль', price: 1850, categoryId: 'classic', images: [], season: 'summer' },
  ]
  for (const c of candles) {
    const cat = await prisma.category.findUnique({ where: { slug: c.categoryId } })
    if (cat) await prisma.candle.upsert({ where: { slug: c.slug }, update: {}, create: { ...c, categoryId: cat.id } })
  }

  console.log('Seed complete. Admin: ekozza@bk.ru')
}

main().catch(console.error).finally(() => prisma.$disconnect())
