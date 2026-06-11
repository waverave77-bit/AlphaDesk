/**
 * Interactive exercise engine for the Learn path.
 * Turns a lesson's terms into a varied stream of exercises (never the same
 * screen twice), plus a hand-authored bank of investing scenarios & myths —
 * the stuff a language app can't do, and what makes this genuinely fun.
 */
import { TERMS, type Term } from './glossary-terms'
import type { Lesson } from './curriculum'
import type { LucideIcon } from 'lucide-react'
import { Wallet, LineChart, Building2, TrendingDown, Target, Shield } from 'lucide-react'

export type Exercise =
  | { kind: 'teach'; term: Term }
  | { kind: 'choice'; termName: string; prompt: string; answer: string; options: string[]; explain: string }
  | { kind: 'blank'; definition: string; answer: string; options: string[]; explain: string }
  | { kind: 'match'; pairs: { term: string; def: string }[] }
  | { kind: 'scenario'; Icon: LucideIcon; situation: string; prompt: string; options: ScenarioOption[] }
  | { kind: 'truefalse'; statement: string; isTrue: boolean; explain: string }

export type ScenarioOption = { label: string; correct: boolean; reply: string }

export function isScored(ex: Exercise): boolean {
  return ex.kind !== 'teach'
}

/* ── Distractor helpers (generation is deterministic; the UI shuffles) ── */
function otherInCategory(term: Term, key: 'simple' | 'term'): string[] {
  const same = TERMS.filter((t) => t.category === term.category && t.term !== term.term)
  const pool = same.length >= 3 ? same : TERMS.filter((t) => t.term !== term.term)
  return pool.map((t) => t[key])
}
function pick3(pool: string[], answer: string, seed: number): string[] {
  const filtered = pool.filter((s) => s !== answer)
  const out: string[] = []
  for (let i = 0; out.length < 3 && i < filtered.length; i++) {
    const v = filtered[(seed + i * 5) % filtered.length]
    if (v && !out.includes(v)) out.push(v)
  }
  for (const v of filtered) { if (out.length >= 3) break; if (!out.includes(v)) out.push(v) }
  return out.slice(0, 3)
}

function makeChoice(term: Term, seed: number): Exercise {
  const distractors = pick3(otherInCategory(term, 'simple'), term.simple, seed)
  return { kind: 'choice', termName: term.term, prompt: `What does “${term.term}” mean?`, answer: term.simple, options: [term.simple, ...distractors], explain: term.explanation }
}
function makeBlank(term: Term, seed: number): Exercise {
  const distractors = pick3(otherInCategory(term, 'term'), term.term, seed)
  return { kind: 'blank', definition: term.simple, answer: term.term, options: [term.term, ...distractors], explain: term.explanation }
}
function makeMatch(terms: Term[]): Exercise {
  return { kind: 'match', pairs: terms.slice(0, 4).map((t) => ({ term: t.term, def: t.simple })) }
}

/* ── Hand-authored scenario & myth bank (accurate, Mr. Guy voice) ── */
const SCENARIOS: Record<string, Exercise[]> = {
  basics: [
    { kind: 'scenario', Icon: Wallet, situation: 'You’ve got $500 you won’t need for 10+ years.', prompt: 'Smartest move for most beginners?',
      options: [
        { label: 'Dump it all into one hot meme stock', correct: false, reply: 'That’s a gamble, not investing. One bad day can wipe it out.' },
        { label: 'Spread it across a low-cost index fund', correct: true, reply: 'Exactly. Instant diversification, low fees, proven over decades.' },
        { label: 'Leave it sitting in checking', correct: false, reply: 'Safe, but inflation slowly eats it. Long-term money can work harder.' },
      ] },
  ],
  charts: [
    { kind: 'scenario', Icon: LineChart, situation: 'A stock just hit its all-time high. A friend says “it only goes up!”', prompt: 'What do you do?',
      options: [
        { label: 'Buy immediately — momentum!', correct: false, reply: 'Price near a high tells you nothing about what’s next. FOMO is dangerous.' },
        { label: 'Do your own research first', correct: true, reply: 'Smart. A high price ≠ a good buy. Check the actual business first.' },
        { label: 'Bet against it', correct: false, reply: 'Shorting is risky and “it’s high” isn’t a real thesis either.' },
      ] },
  ],
  health: [
    { kind: 'scenario', Icon: Building2, situation: 'A company’s sales are growing fast — but it burns more cash every single year.', prompt: 'How should you read that?',
      options: [
        { label: 'Growth is all that matters', correct: false, reply: 'Growth is great until the cash runs out. Profit (or a path to it) matters.' },
        { label: 'A real risk worth digging into', correct: true, reply: 'Right. Revenue isn’t profit. Always check if they actually make money.' },
        { label: 'It must be illegal', correct: false, reply: 'Nope — totally legal and common. It’s just risky.' },
      ] },
  ],
  risk: [
    { kind: 'scenario', Icon: TrendingDown, situation: 'The market drops 20%. You’re investing for retirement 30 years away.', prompt: 'Best move?',
      options: [
        { label: 'Sell everything to stop the bleeding', correct: false, reply: 'That locks in the loss. Crashes are temporary; selling makes them permanent.' },
        { label: 'Keep investing on schedule', correct: true, reply: 'This is the answer. Down markets = stocks on sale for long-term investors.' },
        { label: 'Check the app every hour and panic', correct: false, reply: 'Great way to make an emotional mistake. Step away.' },
      ] },
  ],
  strategies: [
    { kind: 'scenario', Icon: Target, situation: 'You can invest $200 every month, or wait in cash to “buy the perfect dip.”', prompt: 'What works better for most people?',
      options: [
        { label: 'Wait for the perfect dip', correct: false, reply: 'Almost nobody times the bottom. Waiting usually costs more than it saves.' },
        { label: 'Invest $200 every month, rain or shine', correct: true, reply: 'Yep — dollar-cost averaging. Boring, consistent, and it wins.' },
        { label: 'Keep it all in cash to be safe', correct: false, reply: 'Cash feels safe but loses to inflation over time.' },
      ] },
  ],
  options: [
    { kind: 'scenario', Icon: Shield, situation: 'You want steadier, lower-risk income to balance your stocks.', prompt: 'Where do you lean?',
      options: [
        { label: 'Go 100% stocks anyway', correct: false, reply: 'More risk, not less. That’s the opposite of what you wanted.' },
        { label: 'Add some bonds to the mix', correct: true, reply: 'Right. Bonds are steadier and balance out stock swings.' },
        { label: 'Put it all in crypto', correct: false, reply: 'Crypto is the opposite of steady. Not the move here.' },
      ] },
  ],
}

const MYTHS: Record<string, Exercise[]> = {
  basics: [
    { kind: 'truefalse', statement: 'You need thousands of dollars to start investing.', isTrue: false, explain: 'Myth! Most brokers let you start with a few dollars and buy fractional shares.' },
  ],
  charts: [
    { kind: 'truefalse', statement: 'A stock going up means it’s a good company.', isTrue: false, explain: 'Myth. Price is driven by hype and momentum short-term — not just quality.' },
  ],
  health: [
    { kind: 'truefalse', statement: 'High revenue means a company is profitable.', isTrue: false, explain: 'Myth. Revenue isn’t profit — companies can sell a lot and still lose money.' },
  ],
  risk: [
    { kind: 'truefalse', statement: 'Diversification guarantees you won’t lose money.', isTrue: false, explain: 'Myth. It reduces risk — it doesn’t erase it. Nothing guarantees no losses.' },
  ],
  strategies: [
    { kind: 'truefalse', statement: 'Time in the market usually beats timing the market.', isTrue: true, explain: 'Fact! Even pros rarely time it right. Staying invested tends to win.' },
  ],
  options: [
    { kind: 'truefalse', statement: 'Options are a quick, easy way to get rich.', isTrue: false, explain: 'Myth. Most options expire worthless. They’re risky tools, not lottery tickets.' },
  ],
}

/**
 * Lesson-specific overrides for early lessons where course-level scenarios
 * reference terms the user hasn't been taught yet (e.g. Lesson 1 of Basics
 * mentions "index fund" before that term appears in Lesson 2).
 */
const LESSON_SCENARIOS: Record<string, Exercise> = {
  'basics-1': {
    kind: 'scenario', Icon: Wallet,
    situation: 'Your friend says she "bought 10 shares of Apple yesterday." What did she actually do?',
    prompt: 'What does owning shares really mean?',
    options: [
      { label: 'She lent Apple $10', correct: false, reply: 'Nope — that\'s a bond. Shares are ownership, not a loan.' },
      { label: 'She bought 10 tiny pieces of ownership in Apple', correct: true, reply: 'Exactly. Each share = a tiny slice of the company. If Apple does well, so does she.' },
      { label: 'She got 10 coupons to buy Apple products', correct: false, reply: 'Ha — that would be nice, but no. Shares mean ownership, not discounts.' },
    ],
  },
  'basics-2': {
    kind: 'scenario', Icon: Wallet,
    situation: 'You want to invest but don\'t want to pick individual stocks. What\'s the easiest way to own a little of hundreds of companies at once?',
    prompt: 'Best move for a beginner who wants instant spread?',
    options: [
      { label: 'Buy one ETF that holds hundreds of stocks', correct: true, reply: 'Exactly. One ETF like SPY gives you a piece of 500 companies immediately.' },
      { label: 'Manually buy stocks in 50 different companies', correct: false, reply: 'Possible — but expensive, time-consuming, and way more work than needed.' },
      { label: 'Keep cash in a savings account', correct: false, reply: 'Safe, but cash doesn\'t grow with the market. You\'d miss the upside.' },
    ],
  },
  'charts-1': {
    kind: 'scenario', Icon: LineChart,
    situation: 'You look at a chart and see a green candlestick followed by a red one. What does that tell you at a glance?',
    prompt: 'What do those two candles mean?',
    options: [
      { label: 'The stock went up one period, then down the next', correct: true, reply: 'Correct. Green = price closed higher than it opened. Red = closed lower.' },
      { label: 'The stock doubled then halved', correct: false, reply: 'Not quite — colour just shows direction, not the size of the move.' },
      { label: 'The company made a profit then a loss', correct: false, reply: 'Candlesticks show price movement, not company profits.' },
    ],
  },
  'health-1': {
    kind: 'scenario', Icon: Building2,
    situation: 'Company A earns $10 million in revenue. Company B earns $2 million. Which one is definitely more profitable?',
    prompt: 'What does revenue alone tell you?',
    options: [
      { label: 'Company A — it makes way more money', correct: false, reply: 'Revenue isn\'t profit. Company A might spend $12M to earn that $10M.' },
      { label: 'You can\'t tell from revenue alone', correct: true, reply: 'Right. Revenue is just total sales. You need to subtract expenses to find profit.' },
      { label: 'Company B — it must be more efficient', correct: false, reply: 'Lower revenue doesn\'t mean more efficient. You need the full picture.' },
    ],
  },
  'risk-1': {
    kind: 'scenario', Icon: Shield,
    situation: 'You put all your savings into a single stock and it drops 60% overnight after a bad earnings report.',
    prompt: 'What investing principle did you skip?',
    options: [
      { label: 'Spreading your money across many investments', correct: true, reply: 'Exactly — diversification. Never put everything in one place.' },
      { label: 'Checking the stock price daily', correct: false, reply: 'Watching prices more wouldn\'t have helped. The problem was concentration.' },
      { label: 'Buying during a bull market', correct: false, reply: 'Bull or bear market, one stock can always collapse. Spread it out.' },
    ],
  },
  'strategies-1': {
    kind: 'scenario', Icon: Target,
    situation: 'Sarah invests $100 every month no matter what the market does. Tom waits for the "perfect dip" before putting any money in. After 3 years, who usually comes out ahead?',
    prompt: 'Whose strategy tends to win?',
    options: [
      { label: 'Tom — he buys at the best prices', correct: false, reply: 'Sounds logical, but timing the market perfectly is nearly impossible even for pros.' },
      { label: 'Sarah — consistent investing beats waiting', correct: true, reply: 'Right. Regular investing (dollar-cost averaging) almost always beats waiting for the perfect moment.' },
      { label: 'They end up the same', correct: false, reply: 'Not usually. Tom\'s money sits idle. Sarah\'s is growing the whole time.' },
    ],
  },
  'options-1': {
    kind: 'scenario', Icon: Shield,
    situation: 'A friend says he turned $500 into $5,000 in a week trading options. He says it\'s easy money.',
    prompt: 'What\'s the most important thing to know before copying him?',
    options: [
      { label: 'Which options he bought — copy the same ones', correct: false, reply: 'Past trades don\'t predict future ones. Options move fast and can go to zero.' },
      { label: 'Most options expire worthless — the gains are real, but so are the losses', correct: true, reply: 'Exactly. He got lucky. Most options buyers lose money. It\'s high risk, not easy money.' },
      { label: 'How to open an options account immediately', correct: false, reply: 'Slow down. Understand the risk first. Options can lose 100% fast.' },
    ],
  },
}

const LESSON_MYTHS: Record<string, Exercise> = {
  'basics-1': {
    kind: 'truefalse',
    statement: 'When you buy a share of stock, you\'re lending money to the company.',
    isTrue: false,
    explain: 'Myth. Buying stock makes you a part-owner, not a lender. Bonds are loans — stocks are ownership.',
  },
  'basics-2': {
    kind: 'truefalse',
    statement: 'An ETF and a single stock are the same kind of investment.',
    isTrue: false,
    explain: 'Myth. A single stock is one company. An ETF holds dozens or hundreds of stocks — built-in spread.',
  },
  'charts-1': {
    kind: 'truefalse',
    statement: 'A green candlestick always means the stock went up that day.',
    isTrue: false,
    explain: 'Mostly true, but not always "that day" — the candle colour depends on the timeframe. A green 1-hour candle just means it rose that hour.',
  },
  'health-1': {
    kind: 'truefalse',
    statement: 'A company with high revenue is always profitable.',
    isTrue: false,
    explain: 'Myth. Revenue is just total sales. A company can bring in millions and still lose money after expenses.',
  },
}

function pickExtra(lesson: Lesson): Exercise | null {
  // Lesson-specific override takes priority — used for early lessons where
  // course-level scenarios reference terms the user hasn't learned yet.
  const lessonScn = LESSON_SCENARIOS[lesson.id]
  const lessonMyth = LESSON_MYTHS[lesson.id]

  if (lessonScn || lessonMyth) {
    const preferScenario = lesson.index % 2 === 1
    if (preferScenario && lessonScn) return lessonScn
    if (!preferScenario && lessonMyth) return lessonMyth
    return lessonScn ?? lessonMyth ?? null
  }

  // Fall back to course-level pool for later lessons.
  const scn = SCENARIOS[lesson.courseId] ?? []
  const myth = MYTHS[lesson.courseId] ?? []
  const preferScenario = lesson.index % 2 === 1
  const primary = preferScenario ? scn : myth
  const fallback = preferScenario ? myth : scn
  const pool = primary.length ? primary : fallback
  if (!pool.length) return null
  return pool[(lesson.index - 1) % pool.length]
}

/** Deterministic shuffle (LCG) — no Math.random, so SSR and client agree. */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]
  let s = (seed % 233280) + 1
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Boss review — combines everything from the whole course. No teaching,
 * all testing: a wide sample of choice/blank across every term, two match
 * sets, plus the course scenario & myth. Deterministic.
 */
function buildReviewExercises(lesson: Lesson): Exercise[] {
  const terms = lesson.terms
  const seed = lesson.globalOrder + 7
  const shuffled = seededShuffle(terms, seed)
  const out: Exercise[] = []

  const sample = shuffled.slice(0, Math.min(8, shuffled.length))
  sample.forEach((t, i) => out.push(i % 2 === 0 ? makeChoice(t, seed + i) : makeBlank(t, seed + i)))

  // Drop in match sets among the questions.
  out.splice(3, 0, makeMatch(seededShuffle(terms, seed + 1).slice(0, 4)))
  if (terms.length >= 8) out.push(makeMatch(seededShuffle(terms, seed + 2).slice(0, 4)))

  const scn = SCENARIOS[lesson.courseId]?.[0]
  if (scn) out.push(scn)
  const myth = MYTHS[lesson.courseId]?.[0]
  if (myth) out.push(myth)

  return out
}

/** Build the ordered exercise stream for a lesson. */
export function buildLessonExercises(lesson: Lesson): Exercise[] {
  if (lesson.isReview) return buildReviewExercises(lesson)
  const out: Exercise[] = []
  lesson.terms.forEach((term, i) => {
    out.push({ kind: 'teach', term })
    out.push(i % 2 === 0 ? makeChoice(term, i + lesson.globalOrder) : makeBlank(term, i + lesson.globalOrder))
  })
  if (lesson.terms.length >= 3) out.push(makeMatch(lesson.terms))
  const extra = pickExtra(lesson)
  if (extra) out.push(extra)
  return out
}

/** Count of scored (non-teach) exercises — the denominator for results. */
export function scoredCount(exercises: Exercise[]): number {
  return exercises.filter(isScored).length
}
