# AlphaDesk

A professional investing web app combining a real-time portfolio tracker with an AI-powered stock research tool.

## Features

- **Portfolio Tracker** — Add/remove holdings with live P&L, allocation pie charts, and performance metrics
- **Stock Research** — Search any ticker for live prices, fundamentals, interactive charts, and news
- **AI Analysis** — Claude-powered Buy/Hold/Sell analysis for individual stocks and your whole portfolio
- **Watchlist** — Save and monitor stocks with live price updates
- **Dark Theme** — Bloomberg-inspired dark UI with green/red gain/loss coding

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui primitives |
| Charts | Recharts |
| Stock Data | Yahoo Finance (yahoofinance2, no API key needed) |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Database | SQLite via Prisma ORM |
| Auth | NextAuth.js (email/password) |

## Setup

### Prerequisites

- Node.js 20.19+
- npm

### 1. Install dependencies

```bash
cd alphadesk
npm install
```

### 2. Environment variables

The `.env.local` file is pre-configured for local development. To enable AI features, add your Anthropic API key:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-..."   # Required for AI analysis features
```

Generate a secret with: `openssl rand -base64 32`

### 3. Set up the database

```bash
# Run migrations (creates dev.db)
DATABASE_URL="file:./dev.db" npx prisma migrate dev --name init

# Seed with demo account + sample portfolio
DATABASE_URL="file:./dev.db" npx prisma db seed
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Login

| Field | Value |
|-------|-------|
| Email | demo@alphadesk.app |
| Password | demo1234 |

The demo account comes pre-loaded with AAPL, MSFT, NVDA, GOOGL, JPM in the portfolio and TSLA, AMZN, META, V on the watchlist.

## Project Structure

```
alphadesk/
├── app/
│   ├── (auth)/login          # Sign-in page
│   ├── (auth)/register       # Registration page
│   ├── (dashboard)/          # Main app (requires auth)
│   │   ├── page.tsx          # Portfolio Dashboard
│   │   ├── research/[ticker] # Stock detail + AI analysis
│   │   ├── watchlist/        # Watchlist with live prices
│   │   └── settings/         # Account settings
│   └── api/                  # API routes
│       ├── stock/[ticker]    # Live quotes + historical data
│       ├── stock/search      # Ticker search
│       ├── portfolio/        # Holdings CRUD
│       ├── watchlist/        # Watchlist CRUD
│       └── ai-analysis       # Claude AI endpoint
├── components/
│   ├── charts/               # Recharts components
│   ├── portfolio/            # Portfolio UI (table, dialogs, AI panel)
│   ├── research/             # Stock search
│   └── ui/                   # Button, Card, Input, Dialog, Toast, etc.
├── lib/
│   ├── yahoo-finance.ts      # Yahoo Finance helpers
│   ├── claude.ts             # Claude AI helpers
│   ├── auth.ts               # NextAuth config
│   └── utils.ts              # Formatting utilities
└── prisma/
    ├── schema.prisma         # User, Holding, WatchlistItem models
    └── seed.ts               # Demo data seeder
```

## AI Analysis

Requires `ANTHROPIC_API_KEY` in `.env.local`. Without it, the analyze buttons show a friendly error.

**Stock Analysis** includes:
- Executive Summary
- Strengths & Catalysts  
- Risks & Weaknesses
- Valuation Assessment (Overvalued / Fairly Valued / Undervalued)
- Analyst Verdict (Buy / Hold / Sell with reasoning)

**Portfolio Analysis** includes:
- Portfolio Health Score
- Diversification Assessment
- Top Performers & Losers commentary
- Risk Analysis
- Rebalancing Suggestions

## Disclaimer

> For informational purposes only. Not financial advice. Always conduct your own research before making investment decisions.
