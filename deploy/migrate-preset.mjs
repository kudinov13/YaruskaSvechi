import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const r = await p.candle.updateMany({
  where: { shippingPackagePreset: 'p50x25x15' },
  data: { shippingPackagePreset: 'p25x25x15' },
})
console.log('migrated rows:', r.count)
process.exit(0)
