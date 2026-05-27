import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live Market Overview — Stocks, Crypto & Commodities | Mr. Guy Invests',
  description: 'Track S&P 500, NASDAQ, Dow Jones, Bitcoin, gold and more in real time. Free live market dashboard with sector performance and Fear & Greed index.',
  keywords: ['live stock market', 'market overview', 'S&P 500 today', 'NASDAQ live', 'crypto prices', 'Fear and Greed index', 'market dashboard'],
}

export default function MarketsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
