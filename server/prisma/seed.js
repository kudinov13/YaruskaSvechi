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
    { title: 'Матрёшка', slug: 'matreshka', notes: 'вишня, мёд', price: 2650, stock: 8, categoryId: 'classic', images: ['/Photos/Collection_classic.jpg'], season: 'spring', featured: true, description: 'Авторская свеча в форме матрёшки. Тёплый аромат вишни и мёда наполняет дом уютом.' },
    { title: 'Щелкунчик', slug: 'shchelkunchik', notes: 'корица, кедр', price: 2190, stock: 5, categoryId: 'avtor', images: ['/Photos/Collection_avtor.jpg'], season: 'winter', featured: true, description: 'Свеча-щелкунчик с ароматом корицы и кедра. Идеальна для зимних вечеров.' },
    { title: 'Ёлочка', slug: 'yelochka', notes: 'ель, можжевельник', price: 1990, stock: 12, categoryId: 'season', images: ['/Photos/Collections_seson.jpg'], season: 'winter', featured: true, description: 'Праздничная свеча-ёлочка с хвойным ароматом.' },
    { title: 'Алёнка', slug: 'alenka', notes: 'печёное яблоко', price: 2500, oldPrice: 2900, stock: 6, categoryId: 'classic', images: ['/Photos/Vnalichii.jpg'], season: 'autumn', featured: true, description: 'Свеча с тёплым ароматом печёного яблока. Осеннее настроение в каждом доме.' },
    { title: 'Молочный свет', slug: 'molochnyy-svet', notes: 'хлопок, ваниль', price: 1850, stock: 10, categoryId: 'classic', images: [], season: 'summer', description: 'Нежная свеча с ароматом хлопка и ванили. Лёгкий, воздушный аромат.' },
  ]
  for (const c of candles) {
    const cat = await prisma.category.findUnique({ where: { slug: c.categoryId } })
    if (cat) {
      const { categoryId, ...data } = c
      await prisma.candle.upsert({ where: { slug: c.slug }, update: data, create: { ...data, categoryId: cat.id } })
    }
  }

  console.log('Seed complete. Admin: ekozza@bk.ru')
}

main().catch(console.error).finally(() => prisma.$disconnect())
