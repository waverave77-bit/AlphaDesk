/**
 * Beginner-friendly company catalog for the $100K Challenge.
 * - THEMES groups stocks the way a beginner thinks ("things I use", "brands I know").
 * - Each company has a plain-English blurb Mr. Guy shows before you buy — context
 *   and understanding, never a recommendation.
 */
export interface SimCompany { name: string; color: string; blurb: string }

export const COMPANIES: Record<string, SimCompany> = {
  // Index funds
  SPY:   { name: 'S&P 500 Fund',  color: '#3b82f6', blurb: 'Holds all 500 of America’s biggest companies in one. The classic “set it and forget it” beginner pick — when the market rises, so does this.' },
  QQQ:   { name: 'Nasdaq-100 Fund', color: '#8b5cf6', blurb: 'Holds the 100 biggest tech-heavy companies. More growth potential, but bigger swings than the S&P 500.' },
  // Tech you use
  AAPL:  { name: 'Apple',      color: '#64748b', blurb: 'Makes the iPhone, Mac, and AirPods. People like it for steady profits and a giant pile of cash.' },
  MSFT:  { name: 'Microsoft',  color: '#0ea5e9', blurb: 'Windows, Office, Xbox, and the Azure cloud. A steady giant that quietly powers most offices.' },
  GOOGL: { name: 'Google',     color: '#3b82f6', blurb: 'Search, YouTube, Android, and ads. Basically owns how the internet finds things.' },
  NVDA:  { name: 'Nvidia',     color: '#22c55e', blurb: 'Makes the chips that power AI. Huge gains lately — but expect big ups and downs.' },
  AMZN:  { name: 'Amazon',     color: '#f59e0b', blurb: 'Online shopping plus AWS, the cloud service running a big chunk of the internet.' },
  // Brands you know
  DIS:   { name: 'Disney',     color: '#6366f1', blurb: 'Movies, theme parks, Disney+, and ESPN. A brand people grow up with worldwide.' },
  NFLX:  { name: 'Netflix',    color: '#dc2626', blurb: 'The streaming giant. It tends to rise and fall with how many subscribers it’s adding.' },
  NKE:   { name: 'Nike',       color: '#f97316', blurb: 'The world’s biggest sportswear brand — sneakers, gear, and the swoosh.' },
  SBUX:  { name: 'Starbucks',  color: '#16a34a', blurb: 'Coffee on nearly every corner. A classic steady consumer stock.' },
  MCD:   { name: 'McDonald’s', color: '#eab308', blurb: 'Fast food worldwide. Known for being steady and paying reliable dividends.' },
  // Cars & EVs
  TSLA:  { name: 'Tesla',      color: '#ef4444', blurb: 'The electric-car leader. Exciting story, but one of the most volatile big stocks out there.' },
  F:     { name: 'Ford',       color: '#2563eb', blurb: 'The classic American carmaker, now pushing into electric trucks.' },
  GM:    { name: 'General Motors', color: '#0891b2', blurb: 'Chevy, GMC, and Cadillac — a legacy automaker shifting toward EVs.' },
  RIVN:  { name: 'Rivian',     color: '#84cc16', blurb: 'A young electric-truck maker. High risk, high hope — still proving itself.' },
}

export interface SimTheme { id: string; title: string; blurb: string; tickers: string[] }

export const THEMES: SimTheme[] = [
  { id: 'index',  title: 'Spread your risk', blurb: 'Funds that own hundreds of companies at once — instant diversification, much safer than betting on one stock.', tickers: ['SPY', 'QQQ'] },
  { id: 'tech',   title: 'Tech you use',     blurb: 'The companies behind the apps, phones, and sites you use every day.', tickers: ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'AMZN'] },
  { id: 'brands', title: 'Brands you know',  blurb: 'Household names you already recognise.', tickers: ['DIS', 'NFLX', 'NKE', 'SBUX', 'MCD'] },
  { id: 'cars',   title: 'Cars & EVs',       blurb: 'Carmakers old and new, racing into electric.', tickers: ['TSLA', 'F', 'GM', 'RIVN'] },
]

export const ALL_SIM_TICKERS = THEMES.flatMap((t) => t.tickers)
