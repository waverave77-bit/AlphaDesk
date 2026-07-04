/**
 * Seed bot accounts for the $100K Challenge leaderboard + community trades feed.
 * Run: npx tsx prisma/seed-bots.ts
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const STARTING_CASH = 100_000

const BOTS: {
  username: string
  name: string
  holdings: { ticker: string; companyName: string; shares: number; avgCost: number }[]
  cashLeft: number
  recentTrades: { ticker: string; shares: number; price: number; type: 'BUY' | 'SELL'; daysAgo: number }[]
}[] = [
  {
    username: 'TechGuy88',
    name: 'Mike T.',
    cashLeft: 32_500,
    holdings: [
      { ticker: 'NVDA', companyName: 'NVIDIA Corporation', shares: 180, avgCost: 122 },
      { ticker: 'MSFT', companyName: 'Microsoft Corporation', shares: 65, avgCost: 415 },
      { ticker: 'AAPL', companyName: 'Apple Inc.', shares: 50, avgCost: 188 },
    ],
    recentTrades: [
      { ticker: 'NVDA', shares: 20, price: 128, type: 'BUY', daysAgo: 2 },
      { ticker: 'AAPL', shares: 10, price: 190, type: 'BUY', daysAgo: 5 },
    ],
  },
  {
    username: 'ValueHunter22',
    name: 'Sara K.',
    cashLeft: 28_400,
    holdings: [
      { ticker: 'JPM', companyName: 'JPMorgan Chase & Co.', shares: 120, avgCost: 248 },
      { ticker: 'V', companyName: 'Visa Inc.', shares: 75, avgCost: 335 },
      { ticker: 'BRK-B', companyName: 'Berkshire Hathaway Inc.', shares: 25, avgCost: 435 },
    ],
    recentTrades: [
      { ticker: 'JPM', shares: 15, price: 255, type: 'BUY', daysAgo: 3 },
      { ticker: 'V', shares: 10, price: 342, type: 'BUY', daysAgo: 6 },
    ],
  },
  {
    username: 'ETF_Bro',
    name: 'Jordan B.',
    cashLeft: 5_200,
    holdings: [
      { ticker: 'SPY', companyName: 'SPDR S&P 500 ETF Trust', shares: 95, avgCost: 565 },
      { ticker: 'QQQ', companyName: 'Invesco QQQ Trust', shares: 70, avgCost: 492 },
    ],
    recentTrades: [
      { ticker: 'SPY', shares: 5, price: 572, type: 'BUY', daysAgo: 1 },
      { ticker: 'QQQ', shares: 5, price: 498, type: 'BUY', daysAgo: 4 },
    ],
  },
  {
    username: 'RiskyBiz99',
    name: 'Chris L.',
    cashLeft: 18_000,
    holdings: [
      { ticker: 'TSLA', companyName: 'Tesla Inc.', shares: 150, avgCost: 295 },
      { ticker: 'PLTR', companyName: 'Palantir Technologies Inc.', shares: 800, avgCost: 35 },
      { ticker: 'COIN', companyName: 'Coinbase Global Inc.', shares: 40, avgCost: 265 },
    ],
    recentTrades: [
      { ticker: 'TSLA', shares: 25, price: 310, type: 'BUY', daysAgo: 2 },
      { ticker: 'PLTR', shares: 200, price: 38, type: 'SELL', daysAgo: 3 },
    ],
  },
  {
    username: 'DividendDave_',
    name: 'Dave R.',
    cashLeft: 41_200,
    holdings: [
      { ticker: 'KO', companyName: 'The Coca-Cola Company', shares: 250, avgCost: 71 },
      { ticker: 'JNJ', companyName: 'Johnson & Johnson', shares: 100, avgCost: 158 },
      { ticker: 'HD', companyName: 'Home Depot Inc.', shares: 30, avgCost: 388 },
    ],
    recentTrades: [
      { ticker: 'KO', shares: 50, price: 73, type: 'BUY', daysAgo: 5 },
      { ticker: 'JNJ', shares: 10, price: 160, type: 'BUY', daysAgo: 7 },
    ],
  },
  {
    username: 'GrowthMode_',
    name: 'Priya S.',
    cashLeft: 12_800,
    holdings: [
      { ticker: 'GOOGL', companyName: 'Alphabet Inc.', shares: 150, avgCost: 172 },
      { ticker: 'AMZN', companyName: 'Amazon.com Inc.', shares: 100, avgCost: 198 },
      { ticker: 'META', companyName: 'Meta Platforms Inc.', shares: 35, avgCost: 595 },
    ],
    recentTrades: [
      { ticker: 'META', shares: 5, price: 612, type: 'BUY', daysAgo: 1 },
      { ticker: 'GOOGL', shares: 20, price: 178, type: 'BUY', daysAgo: 4 },
      { ticker: 'AMZN', shares: 15, price: 205, type: 'SELL', daysAgo: 6 },
    ],
  },
  {
    username: 'ChartReader_',
    name: 'Alex M.',
    cashLeft: 24_600,
    holdings: [
      { ticker: 'AMD', companyName: 'Advanced Micro Devices Inc.', shares: 280, avgCost: 168 },
      { ticker: 'SMCI', companyName: 'Super Micro Computer Inc.', shares: 120, avgCost: 48 },
      { ticker: 'MSTR', companyName: 'MicroStrategy Inc.', shares: 15, avgCost: 390 },
    ],
    recentTrades: [
      { ticker: 'AMD', shares: 30, price: 172, type: 'BUY', daysAgo: 2 },
      { ticker: 'SMCI', shares: 50, price: 52, type: 'SELL', daysAgo: 3 },
    ],
  },
  {
    username: 'HealthcareBull',
    name: 'Olivia P.',
    cashLeft: 19_500,
    holdings: [
      { ticker: 'LLY', companyName: 'Eli Lilly and Company', shares: 45, avgCost: 785 },
      { ticker: 'UNH', companyName: 'UnitedHealth Group Inc.', shares: 30, avgCost: 498 },
      { ticker: 'ABBV', companyName: 'AbbVie Inc.', shares: 80, avgCost: 195 },
    ],
    recentTrades: [
      { ticker: 'LLY', shares: 5, price: 812, type: 'BUY', daysAgo: 3 },
      { ticker: 'UNH', shares: 10, price: 510, type: 'BUY', daysAgo: 6 },
    ],
  },
  {
    username: 'MomentumKing',
    name: 'Tyler W.',
    cashLeft: 8_400,
    holdings: [
      { ticker: 'NVDA', companyName: 'NVIDIA Corporation', shares: 250, avgCost: 115 },
      { ticker: 'TSLA', companyName: 'Tesla Inc.', shares: 100, avgCost: 280 },
      { ticker: 'AAPL', companyName: 'Apple Inc.', shares: 80, avgCost: 182 },
    ],
    recentTrades: [
      { ticker: 'NVDA', shares: 50, price: 130, type: 'SELL', daysAgo: 1 },
      { ticker: 'TSLA', shares: 20, price: 318, type: 'BUY', daysAgo: 2 },
    ],
  },
  {
    username: 'BogleheadFan',
    name: 'Sam D.',
    cashLeft: 3_800,
    holdings: [
      { ticker: 'VTI', companyName: 'Vanguard Total Stock Market ETF', shares: 200, avgCost: 248 },
      { ticker: 'VXUS', companyName: 'Vanguard Total International Stock ETF', shares: 300, avgCost: 58 },
      { ticker: 'BND', companyName: 'Vanguard Total Bond Market ETF', shares: 150, avgCost: 73 },
    ],
    recentTrades: [
      { ticker: 'VTI', shares: 10, price: 252, type: 'BUY', daysAgo: 4 },
      { ticker: 'BND', shares: 20, price: 74, type: 'BUY', daysAgo: 7 },
    ],
  },
  {
    username: 'WallStWatcher',
    name: 'Nadia H.',
    cashLeft: 31_000,
    holdings: [
      { ticker: 'GS', companyName: 'Goldman Sachs Group Inc.', shares: 50, avgCost: 512 },
      { ticker: 'MS', companyName: 'Morgan Stanley', shares: 100, avgCost: 118 },
      { ticker: 'BAC', companyName: 'Bank of America Corp.', shares: 500, avgCost: 44 },
    ],
    recentTrades: [
      { ticker: 'GS', shares: 5, price: 528, type: 'BUY', daysAgo: 2 },
      { ticker: 'BAC', shares: 100, price: 45, type: 'BUY', daysAgo: 5 },
    ],
  },
  {
    username: 'ConsumerBets',
    name: 'Raj P.',
    cashLeft: 15_200,
    holdings: [
      { ticker: 'COST', companyName: 'Costco Wholesale Corporation', shares: 25, avgCost: 985 },
      { ticker: 'AMZN', companyName: 'Amazon.com Inc.', shares: 120, avgCost: 192 },
      { ticker: 'WMT', companyName: 'Walmart Inc.', shares: 200, avgCost: 92 },
    ],
    recentTrades: [
      { ticker: 'COST', shares: 3, price: 1005, type: 'BUY', daysAgo: 3 },
      { ticker: 'WMT', shares: 50, price: 94, type: 'BUY', daysAgo: 6 },
    ],
  },
]

async function main() {
  console.log('Seeding bot accounts...')
  const password = await bcrypt.hash('bot-account-no-login', 12)
  const now = new Date()

  for (const bot of BOTS) {
    const email = `bot.${bot.username.toLowerCase().replace(/[^a-z0-9]/g, '')}@mrguyinvests.internal`

    const user = await prisma.user.upsert({
      where: { email },
      update: { username: bot.username, name: bot.name },
      create: {
        email,
        password,
        name: bot.name,
        username: bot.username,
        hasOnboarded: true,
        emailVerified: true,
      },
    })

    // Create or update virtual portfolio
    let portfolio = await prisma.virtualPortfolio.findFirst({ where: { userId: user.id } })
    const resetAt = new Date(now.getFullYear(), now.getMonth() + 3, 1)

    if (!portfolio) {
      portfolio = await prisma.virtualPortfolio.create({
        data: {
          userId: user.id,
          cash: bot.cashLeft,
          totalValue: bot.cashLeft + bot.holdings.reduce((s, h) => s + h.shares * h.avgCost, 0),
          resetAt,
          monthlyBaseline: STARTING_CASH,
          monthlyResetAt: new Date(now.getFullYear(), now.getMonth(), 1),
        },
      })
    } else {
      await prisma.virtualPortfolio.update({
        where: { id: portfolio.id },
        data: {
          cash: bot.cashLeft,
          totalValue: bot.cashLeft + bot.holdings.reduce((s, h) => s + h.shares * h.avgCost, 0),
          monthlyBaseline: STARTING_CASH,
        },
      })
      // Clear old holdings so we can re-seed cleanly
      await prisma.virtualHolding.deleteMany({ where: { portfolioId: portfolio.id } })
    }

    // Seed holdings
    for (const h of bot.holdings) {
      await prisma.virtualHolding.create({
        data: {
          portfolioId: portfolio.id,
          ticker: h.ticker,
          companyName: h.companyName,
          shares: h.shares,
          avgCost: h.avgCost,
        },
      })
    }

    // Seed recent trades (last 7 days so they show in community feed)
    for (const t of bot.recentTrades) {
      const executedAt = new Date(now.getTime() - t.daysAgo * 24 * 60 * 60 * 1000)
      // Only add if not already there (avoid duplicates on re-run)
      const existing = await prisma.virtualTrade.findFirst({
        where: { portfolioId: portfolio.id, ticker: t.ticker, type: t.type, executedAt },
      })
      if (!existing) {
        await prisma.virtualTrade.create({
          data: {
            portfolioId: portfolio.id,
            ticker: t.ticker,
            shares: t.shares,
            price: t.price,
            type: t.type,
            executedAt,
          },
        })
      }
    }

    console.log(`✓ ${bot.username} (${email})`)
  }

  console.log(`\nSeeded ${BOTS.length} bots.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
