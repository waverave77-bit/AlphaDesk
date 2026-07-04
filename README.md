# Mr. Guy Invests

**Learn investing like a game.** Bite-sized lessons, a $100K practice portfolio, and Mr. Guy — an AI mascot who explains anything about money in plain English. Built for people who were never taught how money works.

Live at [www.mrguyinvests.com](https://www.mrguyinvests.com)

## Features

- **Learn the Basics** — bite-sized lessons with XP, streaks, and levels (Duolingo mechanics, but for investing)
- **$100K Challenge** — trade real stocks at real prices with $100,000 of virtual cash; climb the live leaderboard
- **Ask Mr. Guy** — AI chat that answers any stock or money question like a smart friend, never like a bank
- **Investing Dictionary** — every confusing finance term explained simply; public glossary pages are free with no account
- **Stock Research** — live quotes, charts, fundamentals, news, and AI breakdowns for any ticker
- **Markets** — live overview of indices, crypto, commodities, sectors, and the Fear & Greed index

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth.js (email/password + email verification) |
| AI | Anthropic Claude API |
| Stock Data | Yahoo Finance |
| Payments | Stripe ($4.99/mo Pro tier) |
| Deployment | Vercel (deploys on push to `main`) |

## Local Development

```bash
npm install
npm run dev        # needs .env.local (DATABASE_URL, NEXTAUTH_SECRET, ANTHROPIC_API_KEY, ...)
```

`npm run build` runs `prisma migrate deploy` first, which requires `DATABASE_URL`. To build without touching the database: `npx next build`.

## Free vs Pro

Free: all lessons, the full $100K Challenge, dictionary, markets, watchlist, and daily-limited AI (3 Mr. Guy chats/day, 2 AI stock breakdowns/day). Pro ($4.99/mo): no daily limits, a second $100K portfolio, exclusive themes.

## Disclaimer

> For informational and educational purposes only. Not financial advice. Always consult a qualified professional before investing.
