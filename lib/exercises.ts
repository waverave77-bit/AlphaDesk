/**
 * Interactive exercise engine for the Learn path.
 * Turns a lesson's terms into a varied stream of exercises (never the same
 * screen twice), plus a hand-authored bank of investing scenarios & myths —
 * the stuff a language app can't do, and what makes this genuinely fun.
 */
import { TERMS, type Term } from './glossary-terms'
import type { Lesson } from './curriculum'

export type Exercise =
  | { kind: 'teach'; term: Term }
  | { kind: 'choice'; termName: string; prompt: string; answer: string; options: string[] }
  | { kind: 'blank'; definition: string; answer: string; options: string[] }
  | { kind: 'match'; pairs: { term: string; def: string }[] }
  | { kind: 'scenario'; emoji: string; situation: string; prompt: string; options: ScenarioOption[] }
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
  return { kind: 'choice', termName: term.term, prompt: `What does “${term.term}” mean?`, answer: term.simple, options: [term.simple, ...distractors] }
}
function makeBlank(term: Term, seed: number): Exercise {
  const distractors = pick3(otherInCategory(term, 'term'), term.term, seed)
  return { kind: 'blank', definition: term.simple, answer: term.term, options: [term.term, ...distractors] }
}
function makeMatch(terms: Term[]): Exercise {
  return { kind: 'match', pairs: terms.slice(0, 4).map((t) => ({ term: t.term, def: t.simple })) }
}

/* ── Hand-authored scenario & myth bank (accurate, Mr. Guy voice) ── */
const SCENARIOS: Record<string, Exercise[]> = {
  basics: [
    { kind: 'scenario', emoji: '💸', situation: 'You’ve got $500 you won’t need for 10+ years.', prompt: 'Smartest move for most beginners?',
      options: [
        { label: 'Dump it all into one hot meme stock', correct: false, reply: 'That’s a gamble, not investing. One bad day can wipe it out.' },
        { label: 'Spread it across a low-cost index fund', correct: true, reply: 'Exactly. Instant diversification, low fees, proven over decades.' },
        { label: 'Leave it sitting in checking', correct: false, reply: 'Safe, but inflation slowly eats it. Long-term money can work harder.' },
      ] },
  ],
  charts: [
    { kind: 'scenario', emoji: '📈', situation: 'A stock just hit its all-time high. A friend says “it only goes up!”', prompt: 'What do you do?',
      options: [
        { label: 'Buy immediately — momentum!', correct: false, reply: 'Price near a high tells you nothing about what’s next. FOMO is dangerous.' },
        { label: 'Do your own research first', correct: true, reply: 'Smart. A high price ≠ a good buy. Check the actual business first.' },
        { label: 'Bet against it', correct: false, reply: 'Shorting is risky and “it’s high” isn’t a real thesis either.' },
      ] },
  ],
  health: [
    { kind: 'scenario', emoji: '🏢', situation: 'A company’s sales are growing fast — but it burns more cash every single year.', prompt: 'How should you read that?',
      options: [
        { label: 'Growth is all that matters', correct: false, reply: 'Growth is great until the cash runs out. Profit (or a path to it) matters.' },
        { label: 'A real risk worth digging into', correct: true, reply: 'Right. Revenue isn’t profit. Always check if they actually make money.' },
        { label: 'It must be illegal', correct: false, reply: 'Nope — totally legal and common. It’s just risky.' },
      ] },
  ],
  risk: [
    { kind: 'scenario', emoji: '📉', situation: 'The market drops 20%. You’re investing for retirement 30 years away.', prompt: 'Best move?',
      options: [
        { label: 'Sell everything to stop the bleeding', correct: false, reply: 'That locks in the loss. Crashes are temporary; selling makes them permanent.' },
        { label: 'Keep investing on schedule', correct: true, reply: 'This is the answer. Down markets = stocks on sale for long-term investors.' },
        { label: 'Check the app every hour and panic', correct: false, reply: 'Great way to make an emotional mistake. Step away.' },
      ] },
  ],
  strategies: [
    { kind: 'scenario', emoji: '🎯', situation: 'You can invest $200 every month, or wait in cash to “buy the perfect dip.”', prompt: 'What works better for most people?',
      options: [
        { label: 'Wait for the perfect dip', correct: false, reply: 'Almost nobody times the bottom. Waiting usually costs more than it saves.' },
        { label: 'Invest $200 every month, rain or shine', correct: true, reply: 'Yep — dollar-cost averaging. Boring, consistent, and it wins.' },
        { label: 'Keep it all in cash to be safe', correct: false, reply: 'Cash feels safe but loses to inflation over time.' },
      ] },
  ],
  options: [
    { kind: 'scenario', emoji: '🛡️', situation: 'You want steadier, lower-risk income to balance your stocks.', prompt: 'Where do you lean?',
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

function pickExtra(lesson: Lesson): Exercise | null {
  const scn = SCENARIOS[lesson.courseId] ?? []
  const myth = MYTHS[lesson.courseId] ?? []
  // Alternate scenario vs myth by lesson index so consecutive lessons differ.
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
