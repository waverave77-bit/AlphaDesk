import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const password = await bcrypt.hash('demo1234', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@mrguyinvests.com' },
    update: {},
    create: {
      email: 'demo@mrguyinvests.com',
      password,
      name: 'Demo User',
    },
  })

  console.log('Created user:', user.email)

  // Seed sample portfolio
  const holdings = [
    { ticker: 'AAPL', companyName: 'Apple Inc.', shares: 50, purchasePrice: 178.50, purchaseDate: new Date('2023-06-15'), sector: 'Technology' },
    { ticker: 'MSFT', companyName: 'Microsoft Corporation', shares: 25, purchasePrice: 335.00, purchaseDate: new Date('2023-04-20'), sector: 'Technology' },
    { ticker: 'NVDA', companyName: 'NVIDIA Corporation', shares: 15, purchasePrice: 450.00, purchaseDate: new Date('2023-08-10'), sector: 'Technology' },
    { ticker: 'GOOGL', companyName: 'Alphabet Inc.', shares: 30, purchasePrice: 135.00, purchaseDate: new Date('2023-05-01'), sector: 'Communication Services' },
    { ticker: 'JPM', companyName: 'JPMorgan Chase & Co.', shares: 40, purchasePrice: 148.00, purchaseDate: new Date('2023-07-15'), sector: 'Financials' },
  ]

  for (const h of holdings) {
    await prisma.holding.upsert({
      where: { id: `seed-${user.id}-${h.ticker}` },
      update: {},
      create: {
        id: `seed-${user.id}-${h.ticker}`,
        userId: user.id,
        ...h,
      },
    })
  }
  console.log('Seeded', holdings.length, 'holdings')

  // Watchlist
  const watchlistItems = ['TSLA', 'AMZN', 'META', 'V']
  for (const ticker of watchlistItems) {
    await prisma.watchlistItem.upsert({
      where: { userId_ticker: { userId: user.id, ticker } },
      update: {},
      create: { userId: user.id, ticker },
    })
  }
  console.log('Seeded', watchlistItems.length, 'watchlist items')

  console.log('\nDemo credentials:')
  console.log('  Email:    demo@mrguyinvests.com')
  console.log('  Password: demo1234')
}

main().catch(console.error).finally(() => prisma.$disconnect())
