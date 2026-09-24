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
    { slug: 'shkatulki', title: 'Свечи-шкатулки', order: 2 },
    { slug: 'avtor', title: 'Авторские формы', order: 3 },
    { slug: 'gift', title: 'В подарок', order: 4 },
  ]
  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: { title: c.title, order: c.order }, create: c })
  }

  const products = [
    {
      slug: 'svecha-shkatulka-shchelkunchik', legacySlug: 'shchelkunchik',
      title: 'Свеча-шкатулка Щелкунчик', price: 5000, stock: 0, featured: true,
      description: 'Свеча-шкатулка «Щелкунчик» — когда подарок хочется не просто подарить, а впечатлить.\nРучная работа из гипса, внутри — натуральный соевый воск 🤍 Красивый декор, уютное свечение и шкатулка, которая останется с вами и после того, как свеча догорит.\nИдея подарка, которую точно захочется рассмотреть поближе.',
      images: ['/Photos/Shelk_One.jpg', '/Photos/Shelk_Two.jpg', '/Photos/Shelk_Tree.jpg'],
    },
    {
      slug: 'svecha-shkatulka-yolka', legacySlug: 'yelochka',
      title: 'Свеча-шкатулка Ёлка', price: 6000, stock: 0, featured: true,
      description: 'Свеча-шкатулка «Ёлка» из коллекции «Щелкунчик» — маленькая деталь, которая создаёт настоящее новогоднее настроение.\nГипс ручной работы + натуральный соевый воск. Зажигаете — наслаждаетесь уютом, а после свечи у вас остаётся красивая шкатулка.\nИдея подарка, которая точно не затеряется среди обычных.',
      images: ['/Photos/Elka_One.jpg', '/Photos/Elka_Two.jpg', '/Photos/Elka_Tree.jpg', '/Photos/Elka_Four.jpg'],
    },
    {
      slug: 'svecha-shkatulka-vesna', legacySlug: 'matreshka',
      title: 'Свеча-шкатулка Весна', price: 4500, stock: 0, featured: true,
      description: 'Свеча-шкатулка «Матрешка Весна» — подарок, который хочется рассматривать и хранить.\nГипс ручной работы и натуральный соевый воск. Зажигаете свечу — наслаждаетесь уютом, а после она превращается в красивую шкатулку для маленьких сокровищ.\nНеобычный подарок, который точно запомнится.',
      images: ['/Photos/Vesna_One.jpg', '/Photos/Vesna_Two.jpg'],
    },
    {
      slug: 'svecha-shkatulka-barynya-s-samovarom', legacySlug: 'alenka',
      title: 'Свеча-шкатулка Барыня с самоваром', price: 4500, stock: 0, featured: true,
      description: 'Свеча-шкатулка «Барыня с самоваром» — частичка русского уюта в необычном исполнении.\nГипс ручной работы + натуральный соевый воск. Зажигаете свечу — создаёте атмосферу тепла, а после она превращается в красивую шкатулку.\nОригинальный подарок для тех, кто ценит ручную работу и вещи с характером.',
      images: ['/Photos/Barina.jpg'],
    },
    {
      slug: 'svecha-shkatulka-samovar', legacySlug: 'molochnyy-svet',
      title: 'Свеча-шкатулка Самовар', price: 6000, stock: 0, featured: false,
      description: 'Самовар — символ русского уюта, теперь в формате свечи-шкатулки.\nКаждая деталь выполнена вручную из гипса, внутри — натуральный соевый воск. Зажгите самовар-свечу — и наполните пространство атмосферой тёплых чаепитий и домашнего уюта.\nПосле свечи самовар остаётся красивой шкатулкой — как маленький предмет с историей.',
      images: ['/Photos/Samovar_One.jpg', '/Photos/Samovar_four.jpg', '/Photos/Samovar_Two.jpg'],
      variants: [
        { id: 'white', name: 'Белый', images: ['/Photos/Samovar_One.jpg', '/Photos/Samovar_four.jpg', '/Photos/Samovar_Two.jpg'] },
        { id: 'red', name: 'Красный', images: ['/Photos/Samovar_Tree.jpg', '/Photos/Samovar_Two.jpg'] },
      ],
    },
    {
      slug: 'svecha-shkatulka-vasilisa-s-karavaem',
      title: 'Свеча-шкатулка Василиса с караваем', price: 5000, stock: 0, featured: false,
      description: 'Свеча-шкатулка «Василиса с караваем» — настоящая русская сказка в миниатюре.\nРучная работа из гипса + натуральный соевый воск. Образ Василисы с караваем наполнен теплом, гостеприимством и особым смыслом.\nА когда свеча догорит, красивая шкатулка останется на память.',
      images: ['/Photos/Vasilisa_One.jpg', '/Photos/Vasilisa_Two.jpg'],
    },
    {
      slug: 'svecha-shkatulka-annushka-s-petushkom',
      title: 'Свеча-шкатулка Аннушка с петушком', price: 4500, stock: 0, featured: false,
      description: 'Свеча-шкатулка «Аннушка с петушком» — яркая матрёшка с настоящим русским характером.\nГипс ручной работы + натуральный соевый воск. Петушок — символ бодрости, достатка и домашнего уюта, а сама матрёшка станет необычным украшением интерьера.\nЗажигаете свечу — создаёте атмосферу. После — остаётся красивая шкатулка на память.',
      images: ['/Photos/Anushka_One.jpg', '/Photos/Anushka_Two.jpg'],
    },
    {
      slug: 'svecha-shkatulka-nastenka-s-yagnenkom',
      title: 'Свеча-шкатулка Настенька с ягнёнком', price: 5500, stock: 0, featured: false,
      description: 'Свеча-шкатулка «Настенька с ягнёнком» — нежность и тепло в каждой детали.\nГипс ручной работы + натуральный соевый воск. Милая матрёшка с ягнёнком станет особенным украшением интерьера и трогательным подарком.\nА когда свеча догорит, останется красивая шкатулка на память.',
      images: ['/Photos/Nastya_One.jpg', '/Photos/Nastya_Two.jpg'],
    },
    {
      slug: 'svecha-shkatulka-tsaritsa',
      title: 'Свеча-шкатулка Царица', price: 3500, stock: 0, featured: false,
      description: '«Если бы я была царицей…» — свеча-шкатулка для той, кто заслуживает королевского подарка.\nГипс ручной работы + натуральный соевый воск. Эффектная «Царица» станет украшением интерьера, а после свечи превратится в красивую шкатулку.\nНе просто свеча — подарок с характером, который хочется рассматривать.',
      images: ['/Photos/Carica_One.jpg', '/Photos/Carica_Two.jpg'],
    },
    {
      slug: 'svecha-shkatulka-ya-tak-chuvstvuyu',
      title: 'Свеча-шкатулка Я так чувствую', price: 3500, stock: 0, featured: false,
      description: '«Я так чувствую» — свеча-шкатулка для тех, кто не боится быть собой.\nГипс ручной работы + натуральный соевый воск. Зажгите свечу — и наполните пространство теплом. А после она останется красивой шкатулкой с фразой, которая говорит всё без лишних слов.\nНеобычный подарок с характером и настроением.',
      images: ['/Photos/Chudvstvo_One.jpg', '/Photos/Chuvstvo_Two.jpg'],
    },
  ]

  const category = await prisma.category.findUnique({ where: { slug: 'shkatulki' } })
  for (const { legacySlug, ...product } of products) {
    const existing = await prisma.candle.findUnique({ where: { slug: product.slug } })
      || (legacySlug ? await prisma.candle.findUnique({ where: { slug: legacySlug } }) : null)
    const data = { ...product, categoryId: category.id }
    if (existing) await prisma.candle.update({ where: { id: existing.id }, data })
    else await prisma.candle.create({ data })
  }

  await prisma.candle.updateMany({
    where: { slug: { in: ['podarochnyy-nabor-teplo'] } },
    data: { featured: false },
  })

  console.log('Seed complete. Admin: ekozza@bk.ru')
}

main().catch(console.error).finally(() => prisma.$disconnect())
