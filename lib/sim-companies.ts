/**
 * Beginner-friendly company catalog for the $100K Challenge.
 * - THEMES groups stocks the way a beginner thinks ("things I use", "brands I know").
 *   Each theme has an `accent` colour used to colour-code its section + page.
 * - Each company has a plain-English blurb Mr. Guy shows before you buy — context
 *   and understanding, never a recommendation.
 * - `domain` powers the real logo (with a letter-badge fallback). Funds have none.
 */
import type { LucideIcon } from 'lucide-react'
import { Shield, Cpu, Sparkles, Coffee, Car } from 'lucide-react'

export interface SimCompany { name: string; color: string; blurb: string; domain?: string }

export const COMPANIES: Record<string, SimCompany> = {
  // ── Index & sector funds (no logo — they're baskets, not one company) ──
  SPY:   { name: 'S&P 500 Fund',        color: '#3b82f6', blurb: 'Owns all 500 of America’s biggest companies in one buy. The classic “set it and forget it” starter pick.' },
  VOO:   { name: 'Vanguard S&P 500',    color: '#ef4444', blurb: 'Same idea as SPY — all 500 big US companies — with famously rock-bottom fees.' },
  IVV:   { name: 'iShares S&P 500',     color: '#111827', blurb: 'Another low-fee way to own the entire S&P 500 in a single fund.' },
  QQQ:   { name: 'Nasdaq-100 Fund',     color: '#8b5cf6', blurb: 'The 100 biggest tech-heavy names. More growth potential, but bigger swings than the S&P 500.' },
  VTI:   { name: 'Total US Market',     color: '#b91c1c', blurb: 'Owns basically every US stock — large and small — in one fund. Maximum spread.' },
  DIA:   { name: 'Dow 30 Fund',         color: '#2563eb', blurb: 'Tracks the 30 famous “Dow” companies — classic blue-chip household names.' },
  IWM:   { name: 'Small-Cap Fund',      color: '#0d9488', blurb: 'Owns 2,000 smaller US companies. More risk, but more room to grow.' },
  VEA:   { name: 'Developed World Fund', color: '#0891b2', blurb: 'Big companies outside the US — Europe, Japan, and more — in one buy.' },
  VWO:   { name: 'Emerging Markets Fund', color: '#16a34a', blurb: 'Companies in fast-growing countries like India and Brazil. Higher risk, higher hope.' },
  VXUS:  { name: 'Total International',  color: '#7c3aed', blurb: 'Owns stocks from the whole world outside the US in a single fund.' },
  SCHD:  { name: 'Dividend Fund',       color: '#ea580c', blurb: 'Holds steady companies that pay you cash (dividends) on a regular schedule.' },
  VIG:   { name: 'Dividend Growth Fund', color: '#0ea5e9', blurb: 'Companies that keep raising the cash they pay shareholders year after year.' },
  VYM:   { name: 'High Dividend Fund',  color: '#d97706', blurb: 'Focuses on companies paying bigger-than-average dividends right now.' },
  VUG:   { name: 'Growth Fund',         color: '#db2777', blurb: 'Leans into fast-growing companies — more upside, but a bumpier ride.' },
  VTV:   { name: 'Value Fund',          color: '#475569', blurb: 'Owns steadier, cheaper “bargain” companies. Usually a calmer ride.' },
  XLK:   { name: 'Tech Sector Fund',    color: '#6366f1', blurb: 'A basket of only technology stocks, bought in one go.' },
  XLE:   { name: 'Energy Sector Fund',  color: '#f59e0b', blurb: 'A basket of oil, gas, and energy companies in one fund.' },
  XLF:   { name: 'Finance Sector Fund', color: '#10b981', blurb: 'A basket of banks and financial companies in one fund.' },
  XLV:   { name: 'Health Sector Fund',  color: '#14b8a6', blurb: 'A basket of healthcare and drug companies in one fund.' },
  SOXX:  { name: 'Chipmakers Fund',     color: '#22c55e', blurb: 'Owns the semiconductor (computer-chip) makers as a single group.' },
  ARKK:  { name: 'Innovation Fund',     color: '#f43f5e', blurb: 'Bets on futuristic, high-risk tech. Big swings in both directions.' },

  // ── Tech you use ──
  AAPL:  { name: 'Apple',      color: '#64748b', domain: 'apple.com',       blurb: 'Makes the iPhone, Mac, and AirPods. Famous for steady profits and a giant cash pile.' },
  MSFT:  { name: 'Microsoft',  color: '#0ea5e9', domain: 'microsoft.com',   blurb: 'Windows, Office, Xbox, and the Azure cloud. A steady giant powering most offices.' },
  GOOGL: { name: 'Google',     color: '#3b82f6', domain: 'google.com',      blurb: 'Search, YouTube, Android, and ads. Basically owns how the internet finds things.' },
  AMZN:  { name: 'Amazon',     color: '#f59e0b', domain: 'amazon.com',      blurb: 'Online shopping plus AWS, the cloud that runs a big chunk of the internet.' },
  META:  { name: 'Meta',       color: '#1d4ed8', domain: 'meta.com',        blurb: 'Owns Facebook, Instagram, and WhatsApp. Makes most of its money from ads.' },
  NVDA:  { name: 'Nvidia',     color: '#22c55e', domain: 'nvidia.com',      blurb: 'Makes the chips that power AI. Huge gains lately — expect big ups and downs.' },
  AMD:   { name: 'AMD',        color: '#ef4444', domain: 'amd.com',         blurb: 'Makes processors and graphics chips, going head-to-head with Intel and Nvidia.' },
  INTC:  { name: 'Intel',      color: '#2563eb', domain: 'intel.com',       blurb: 'The classic chipmaker inside millions of PCs, now fighting to catch up in AI.' },
  CRM:   { name: 'Salesforce', color: '#0ea5e9', domain: 'salesforce.com',  blurb: 'Software that helps companies keep track of their customers.' },
  ORCL:  { name: 'Oracle',     color: '#dc2626', domain: 'oracle.com',      blurb: 'Databases and cloud software that big companies run their operations on.' },
  ADBE:  { name: 'Adobe',      color: '#db2777', domain: 'adobe.com',       blurb: 'Photoshop, Acrobat PDFs, and creative software people pay for monthly.' },
  IBM:   { name: 'IBM',        color: '#1d4ed8', domain: 'ibm.com',         blurb: 'A century-old tech giant now focused on business computing and AI.' },
  CSCO:  { name: 'Cisco',      color: '#0891b2', domain: 'cisco.com',       blurb: 'Makes the networking gear that quietly runs the internet’s plumbing.' },
  QCOM:  { name: 'Qualcomm',   color: '#2563eb', domain: 'qualcomm.com',    blurb: 'Designs the chips and modems inside most smartphones.' },
  AVGO:  { name: 'Broadcom',   color: '#ef4444', domain: 'broadcom.com',    blurb: 'A huge maker of specialized chips and software, big in AI gear.' },
  PYPL:  { name: 'PayPal',     color: '#1d4ed8', domain: 'paypal.com',      blurb: 'Lets people and stores send and accept money online. Owns Venmo too.' },
  UBER:  { name: 'Uber',       color: '#111827', domain: 'uber.com',        blurb: 'Rides and food delivery in one app, in cities worldwide.' },
  SHOP:  { name: 'Shopify',    color: '#16a34a', domain: 'shopify.com',     blurb: 'Powers online stores for millions of small businesses.' },
  SPOT:  { name: 'Spotify',    color: '#16a34a', domain: 'spotify.com',     blurb: 'The world’s biggest music-and-podcast streaming app.' },
  PLTR:  { name: 'Palantir',   color: '#0ea5e9', domain: 'palantir.com',    blurb: 'Software that digs through huge piles of data for governments and big firms.' },

  // ── Brands you know ──
  DIS:   { name: 'Disney',     color: '#6366f1', domain: 'disney.com',      blurb: 'Movies, theme parks, Disney+, and ESPN. A brand people grow up with.' },
  NFLX:  { name: 'Netflix',    color: '#dc2626', domain: 'netflix.com',     blurb: 'The streaming giant. Rises and falls with how many subscribers it adds.' },
  NKE:   { name: 'Nike',       color: '#f97316', domain: 'nike.com',        blurb: 'The world’s biggest sportswear brand — sneakers, gear, and the swoosh.' },
  LULU:  { name: 'Lululemon',  color: '#ef4444', domain: 'lululemon.com',   blurb: 'Premium yoga and athletic wear with a loyal, full-price following.' },
  WMT:   { name: 'Walmart',    color: '#2563eb', domain: 'walmart.com',     blurb: 'America’s biggest retailer — low prices and groceries everywhere.' },
  TGT:   { name: 'Target',     color: '#dc2626', domain: 'target.com',      blurb: 'The “cheap-chic” retailer with the red bullseye.' },
  COST:  { name: 'Costco',     color: '#1d4ed8', domain: 'costco.com',      blurb: 'Membership warehouse club known for bulk deals and fierce loyalty.' },
  HD:    { name: 'Home Depot', color: '#f97316', domain: 'homedepot.com',   blurb: 'The giant home-improvement store for tools and building supplies.' },
  RBLX:  { name: 'Roblox',     color: '#ef4444', domain: 'roblox.com',      blurb: 'A massive online game platform where kids and teens play and hang out.' },
  EA:    { name: 'Electronic Arts', color: '#111827', domain: 'ea.com',     blurb: 'Maker of video games like EA Sports FC, Madden, and The Sims.' },
  TTWO:  { name: 'Take-Two',   color: '#dc2626', domain: 'take2games.com',  blurb: 'The studio behind Grand Theft Auto and NBA 2K.' },
  SONY:  { name: 'Sony',       color: '#0f172a', domain: 'sony.com',        blurb: 'PlayStation, movies, music, and cameras from the Japanese giant.' },
  EBAY:  { name: 'eBay',       color: '#2563eb', domain: 'ebay.com',        blurb: 'The original online marketplace for auctions and resale.' },
  ETSY:  { name: 'Etsy',       color: '#ea580c', domain: 'etsy.com',        blurb: 'An online marketplace for handmade and vintage goods.' },
  ULTA:  { name: 'Ulta Beauty', color: '#db2777', domain: 'ulta.com',       blurb: 'The big US beauty and cosmetics store chain.' },
  CROX:  { name: 'Crocs',      color: '#16a34a', domain: 'crocs.com',       blurb: 'The foam-clog shoe brand that turned a meme into real profits.' },
  HAS:   { name: 'Hasbro',     color: '#6366f1', domain: 'hasbro.com',      blurb: 'Toys and games like Nerf, Monopoly, and Transformers.' },
  MAT:   { name: 'Mattel',     color: '#ec4899', domain: 'mattel.com',      blurb: 'The toymaker behind Barbie and Hot Wheels.' },
  CMCSA: { name: 'Comcast',    color: '#1d4ed8', domain: 'comcast.com',     blurb: 'Cable, internet, and NBCUniversal movies and theme parks.' },
  WBD:   { name: 'Warner Bros. Discovery', color: '#2563eb', domain: 'wbd.com', blurb: 'HBO/Max, Warner movies, and the Discovery channels.' },

  // ── Food & drink ──
  MCD:   { name: 'McDonald’s', color: '#eab308', domain: 'mcdonalds.com',   blurb: 'Fast food worldwide. Known for being steady and paying reliable dividends.' },
  SBUX:  { name: 'Starbucks',  color: '#16a34a', domain: 'starbucks.com',   blurb: 'Coffee on nearly every corner. A classic steady consumer stock.' },
  KO:    { name: 'Coca-Cola',  color: '#dc2626', domain: 'coca-cola.com',   blurb: 'The world’s biggest drinks company. A classic steady, dividend-payer.' },
  PEP:   { name: 'Pepsi',      color: '#1d4ed8', domain: 'pepsico.com',     blurb: 'Pepsi plus Frito-Lay chips like Doritos and Lay’s.' },
  CMG:   { name: 'Chipotle',   color: '#a16207', domain: 'chipotle.com',    blurb: 'The burrito chain. Grows as it opens more restaurants and nudges prices up.' },
  YUM:   { name: 'Yum! Brands', color: '#dc2626', domain: 'yum.com',        blurb: 'Owns KFC, Taco Bell, and Pizza Hut.' },
  QSR:   { name: 'Restaurant Brands', color: '#f97316', domain: 'rbi.com',  blurb: 'Owns Burger King, Tim Hortons, and Popeyes.' },
  DPZ:   { name: 'Domino’s',   color: '#2563eb', domain: 'dominos.com',     blurb: 'The pizza-delivery giant known for tech-savvy ordering.' },
  WEN:   { name: 'Wendy’s',    color: '#dc2626', domain: 'wendys.com',      blurb: 'The square-burger fast-food chain.' },
  MDLZ:  { name: 'Mondelez',   color: '#7c3aed', domain: 'mondelezinternational.com', blurb: 'Snacks like Oreo, Cadbury, and Ritz.' },
  HSY:   { name: 'Hershey',    color: '#92400e', domain: 'hershey.com',     blurb: 'America’s iconic chocolate maker — Hershey’s, Reese’s, and Kisses.' },
  KHC:   { name: 'Kraft Heinz', color: '#dc2626', domain: 'kraftheinzcompany.com', blurb: 'Ketchup, mac & cheese, and other pantry staples.' },
  GIS:   { name: 'General Mills', color: '#16a34a', domain: 'generalmills.com', blurb: 'Cheerios, Häagen-Dazs, and other grocery-aisle staples.' },
  K:     { name: 'Kellanova',  color: '#dc2626', domain: 'kellanova.com',   blurb: 'Pringles, Cheez-It, and snack brands spun off from Kellogg’s.' },
  MNST:  { name: 'Monster',    color: '#16a34a', domain: 'monsterenergy.com', blurb: 'The energy-drink giant with the green claw logo.' },
  CELH:  { name: 'Celsius',    color: '#0ea5e9', domain: 'celsiusholdings.com', blurb: 'A fast-growing fitness energy-drink brand.' },
  KDP:   { name: 'Keurig Dr Pepper', color: '#b91c1c', domain: 'keurigdrpepper.com', blurb: 'Dr Pepper, 7UP, and Keurig coffee pods.' },
  STZ:   { name: 'Constellation', color: '#f59e0b', domain: 'cbrands.com',  blurb: 'Beer, wine, and spirits — including Corona and Modelo in the US.' },
  DRI:   { name: 'Darden',     color: '#0e7490', domain: 'darden.com',      blurb: 'Owns Olive Garden and LongHorn Steakhouse.' },
  CAKE:  { name: 'Cheesecake Factory', color: '#a16207', domain: 'thecheesecakefactory.com', blurb: 'The big-menu, big-portion restaurant chain.' },

  // ── Cars & EVs ──
  TSLA:  { name: 'Tesla',      color: '#ef4444', domain: 'tesla.com',       blurb: 'The electric-car leader. Exciting story, but one of the most volatile big stocks.' },
  F:     { name: 'Ford',       color: '#2563eb', domain: 'ford.com',        blurb: 'The classic American carmaker, now pushing into electric trucks.' },
  GM:    { name: 'General Motors', color: '#0891b2', domain: 'gm.com',      blurb: 'Chevy, GMC, and Cadillac — a legacy automaker shifting toward EVs.' },
  RIVN:  { name: 'Rivian',     color: '#84cc16', domain: 'rivian.com',      blurb: 'A young electric-truck maker. High risk, high hope — still proving itself.' },
  LCID:  { name: 'Lucid',      color: '#0ea5e9', domain: 'lucidmotors.com', blurb: 'Makes luxury electric sedans. Small, risky, and still burning cash.' },
  NIO:   { name: 'NIO',        color: '#16a34a', domain: 'nio.com',         blurb: 'A Chinese EV maker known for its battery-swap stations.' },
  XPEV:  { name: 'XPeng',      color: '#22c55e', domain: 'xpeng.com',       blurb: 'A Chinese EV startup focused on smart, self-driving features.' },
  LI:    { name: 'Li Auto',    color: '#10b981', domain: 'liauto.com',      blurb: 'A Chinese EV maker popular for its longer-range hybrids.' },
  TM:    { name: 'Toyota',     color: '#dc2626', domain: 'toyota.com',      blurb: 'The world’s biggest carmaker — reliable cars and the original Prius hybrid.' },
  HMC:   { name: 'Honda',      color: '#dc2626', domain: 'honda.com',       blurb: 'Japanese maker of cars, motorcycles, and engines.' },
  STLA:  { name: 'Stellantis', color: '#1e3a8a', domain: 'stellantis.com',  blurb: 'Owns Jeep, Ram, Dodge, and Chrysler.' },
  RACE:  { name: 'Ferrari',    color: '#dc2626', domain: 'ferrari.com',     blurb: 'The luxury supercar icon — small volumes, huge brand and fat margins.' },
  HOG:   { name: 'Harley-Davidson', color: '#f97316', domain: 'harley-davidson.com', blurb: 'The legendary American motorcycle brand.' },
  CVNA:  { name: 'Carvana',    color: '#7c3aed', domain: 'carvana.com',     blurb: 'Sells used cars online from giant car “vending machines.”' },
  KMX:   { name: 'CarMax',     color: '#2563eb', domain: 'carmax.com',      blurb: 'The largest used-car retailer in the US.' },
  PSNY:  { name: 'Polestar',   color: '#111827', domain: 'polestar.com',    blurb: 'A premium EV brand spun out of Volvo.' },
  GT:    { name: 'Goodyear',   color: '#1d4ed8', domain: 'goodyear.com',    blurb: 'The famous tire maker rolling under millions of cars.' },
  AN:    { name: 'AutoNation', color: '#0ea5e9', domain: 'autonation.com',  blurb: 'The biggest chain of new- and used-car dealerships in the US.' },
  APTV:  { name: 'Aptiv',      color: '#f59e0b', domain: 'aptiv.com',       blurb: 'Makes the wiring, sensors, and brains inside modern cars.' },
  BWA:   { name: 'BorgWarner', color: '#ef4444', domain: 'borgwarner.com',  blurb: 'Supplies engine and EV parts to nearly every automaker.' },
}

export interface SimTheme { id: string; title: string; short: string; accent: string; Icon: LucideIcon; blurb: string; tickers: string[] }

export const THEMES: SimTheme[] = [
  { id: 'index',  title: 'Spread your risk', short: 'Index funds', accent: '#3b82f6', Icon: Shield,   blurb: 'Funds that own hundreds of companies at once — instant diversification, much safer than betting on one stock.',
    tickers: ['SPY', 'VOO', 'IVV', 'QQQ', 'VTI', 'DIA', 'IWM', 'VEA', 'VWO', 'VXUS', 'SCHD', 'VIG', 'VYM', 'VUG', 'VTV', 'XLK', 'XLE', 'XLF', 'XLV', 'SOXX', 'ARKK'] },
  { id: 'tech',   title: 'Tech you use',     short: 'Tech',        accent: '#6366f1', Icon: Cpu,      blurb: 'The companies behind the apps, phones, and sites you use every day.',
    tickers: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'IBM', 'CSCO', 'QCOM', 'AVGO', 'PYPL', 'UBER', 'SHOP', 'SPOT', 'PLTR'] },
  { id: 'brands', title: 'Brands you know',  short: 'Brands',      accent: '#ec4899', Icon: Sparkles, blurb: 'Household names you already recognise — retail, streaming, toys, and gear.',
    tickers: ['DIS', 'NFLX', 'NKE', 'LULU', 'WMT', 'TGT', 'COST', 'HD', 'RBLX', 'EA', 'TTWO', 'SONY', 'EBAY', 'ETSY', 'ULTA', 'CROX', 'HAS', 'MAT', 'CMCSA', 'WBD'] },
  { id: 'food',   title: 'Food & drink',     short: 'Food',        accent: '#f59e0b', Icon: Coffee,   blurb: 'Everyday food and drink names — often steady and dividend-paying.',
    tickers: ['MCD', 'SBUX', 'KO', 'PEP', 'CMG', 'YUM', 'QSR', 'DPZ', 'WEN', 'MDLZ', 'HSY', 'KHC', 'GIS', 'K', 'MNST', 'CELH', 'KDP', 'STZ', 'DRI', 'CAKE'] },
  { id: 'cars',   title: 'Cars & EVs',       short: 'Cars',        accent: '#ef4444', Icon: Car,      blurb: 'Carmakers old and new, racing into electric.',
    tickers: ['TSLA', 'F', 'GM', 'RIVN', 'LCID', 'NIO', 'XPEV', 'LI', 'TM', 'HMC', 'STLA', 'RACE', 'HOG', 'CVNA', 'KMX', 'PSNY', 'GT', 'AN', 'APTV', 'BWA'] },
]

export const ALL_SIM_TICKERS = THEMES.flatMap((t) => t.tickers)
