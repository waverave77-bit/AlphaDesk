/**
 * Beginner-friendly company catalog for the $100K Challenge.
 * - THEMES groups stocks the way a beginner thinks ("things I use", "brands I know").
 * - Each company has a plain-English blurb Mr. Guy shows before you buy — context
 *   and understanding, never a recommendation.
 * - `domain` powers the real logo (with a letter-badge fallback).
 */
import type { LucideIcon } from 'lucide-react'
import { Shield, Cpu, Sparkles, Coffee, Car } from 'lucide-react'

export interface SimCompany { name: string; color: string; blurb: string; domain?: string }

export const COMPANIES: Record<string, SimCompany> = {
  // Index funds (no logo — they're funds, not companies)
  SPY:   { name: 'S&P 500 Fund',    color: '#3b82f6', blurb: 'Holds all 500 of America’s biggest companies in one. The classic “set it and forget it” beginner pick — when the market rises, so does this.' },
  QQQ:   { name: 'Nasdaq-100 Fund', color: '#8b5cf6', blurb: 'Holds the 100 biggest tech-heavy companies. More growth potential, but bigger swings than the S&P 500.' },
  // Tech you use
  AAPL:  { name: 'Apple',      color: '#64748b', domain: 'apple.com',     blurb: 'Makes the iPhone, Mac, and AirPods. People like it for steady profits and a giant pile of cash.' },
  MSFT:  { name: 'Microsoft',  color: '#0ea5e9', domain: 'microsoft.com', blurb: 'Windows, Office, Xbox, and the Azure cloud. A steady giant that quietly powers most offices.' },
  GOOGL: { name: 'Google',     color: '#3b82f6', domain: 'google.com',    blurb: 'Search, YouTube, Android, and ads. Basically owns how the internet finds things.' },
  NVDA:  { name: 'Nvidia',     color: '#22c55e', domain: 'nvidia.com',    blurb: 'Makes the chips that power AI. Huge gains lately — but expect big ups and downs.' },
  AMZN:  { name: 'Amazon',     color: '#f59e0b', domain: 'amazon.com',    blurb: 'Online shopping plus AWS, the cloud service running a big chunk of the internet.' },
  // Brands you know
  DIS:   { name: 'Disney',     color: '#6366f1', domain: 'disney.com',    blurb: 'Movies, theme parks, Disney+, and ESPN. A brand people grow up with worldwide.' },
  NFLX:  { name: 'Netflix',    color: '#dc2626', domain: 'netflix.com',   blurb: 'The streaming giant. It tends to rise and fall with how many subscribers it’s adding.' },
  NKE:   { name: 'Nike',       color: '#f97316', domain: 'nike.com',      blurb: 'The world’s biggest sportswear brand — sneakers, gear, and the swoosh.' },
  // Food & drink
  MCD:   { name: 'McDonald’s', color: '#eab308', domain: 'mcdonalds.com', blurb: 'Fast food worldwide. Known for being steady and paying reliable dividends.' },
  SBUX:  { name: 'Starbucks',  color: '#16a34a', domain: 'starbucks.com', blurb: 'Coffee on nearly every corner. A classic steady consumer stock.' },
  KO:    { name: 'Coca-Cola',  color: '#dc2626', domain: 'coca-cola.com', blurb: 'The world’s biggest drinks company. A classic steady, dividend-paying stock.' },
  CMG:   { name: 'Chipotle',   color: '#a16207', domain: 'chipotle.com',  blurb: 'The burrito chain. Grows as it opens more restaurants and nudges prices up.' },
  // Cars & EVs
  TSLA:  { name: 'Tesla',      color: '#ef4444', domain: 'tesla.com',     blurb: 'The electric-car leader. Exciting story, but one of the most volatile big stocks out there.' },
  F:     { name: 'Ford',       color: '#2563eb', domain: 'ford.com',      blurb: 'The classic American carmaker, now pushing into electric trucks.' },
  GM:    { name: 'General Motors', color: '#0891b2', domain: 'gm.com',    blurb: 'Chevy, GMC, and Cadillac — a legacy automaker shifting toward EVs.' },
  RIVN:  { name: 'Rivian',     color: '#84cc16', domain: 'rivian.com',    blurb: 'A young electric-truck maker. High risk, high hope — still proving itself.' },
}

export interface SimTheme { id: string; title: string; short: string; Icon: LucideIcon; blurb: string; tickers: string[] }

export const THEMES: SimTheme[] = [
  { id: 'index',  title: 'Spread your risk', short: 'Index funds', Icon: Shield,   blurb: 'Funds that own hundreds of companies at once — instant diversification, much safer than betting on one stock.', tickers: ['SPY', 'QQQ'] },
  { id: 'tech',   title: 'Tech you use',     short: 'Tech',        Icon: Cpu,      blurb: 'The companies behind the apps, phones, and sites you use every day.', tickers: ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'AMZN'] },
  { id: 'brands', title: 'Brands you know',  short: 'Brands',      Icon: Sparkles, blurb: 'Household names you already recognise.', tickers: ['DIS', 'NFLX', 'NKE'] },
  { id: 'food',   title: 'Food & drink',     short: 'Food',        Icon: Coffee,   blurb: 'Everyday food and drink names — often steady and dividend-paying.', tickers: ['MCD', 'SBUX', 'KO', 'CMG'] },
  { id: 'cars',   title: 'Cars & EVs',       short: 'Cars',        Icon: Car,      blurb: 'Carmakers old and new, racing into electric.', tickers: ['TSLA', 'F', 'GM', 'RIVN'] },
]

export const ALL_SIM_TICKERS = THEMES.flatMap((t) => t.tickers)
