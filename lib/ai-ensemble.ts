// 3-model AI ensemble: Claude Haiku + DeepSeek-V3 + Grok-2
// All 3 run in parallel, then Claude synthesizes a final consensus answer

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'

function getAnthropicKey(): string {
  const fromEnv = process.env.ANTHROPIC_API_KEY
  if (fromEnv && fromEnv.length > 10) return fromEnv
  try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    const content = fs.readFileSync(envPath, 'utf8')
    const match = content.match(/ANTHROPIC_API_KEY="?([^"\n]+)"?/)
    return match?.[1] ?? ''
  } catch { return '' }
}

// Create client per-call so it always picks up the latest key
function getAnthropic() {
  return new Anthropic({ apiKey: getAnthropicKey() })
}

// ─── Shared prompt builder ───────────────────────────────────────────────────

function buildStockPrompt(data: any): string {
  return `You are a concise stock analyst. Analyze this stock and respond in exactly this format:

SIGNAL: [BUY or HOLD or SELL]
RATIONALE: [2-3 sentences explaining the signal, plain English, no fluff]
KEY_RISK: [One sentence on the biggest risk]
KEY_STRENGTH: [One sentence on the biggest strength]

Stock data:
- Ticker: ${data.ticker} (${data.companyName})
- Price: $${data.price ?? 'N/A'} (${(data.changePercent ?? 0) >= 0 ? '+' : ''}${(data.changePercent ?? 0).toFixed(2)}% today)
- Sector: ${data.sector ?? 'N/A'} | Industry: ${data.industry ?? 'N/A'}
- Market Cap: ${data.marketCap ? '$' + (data.marketCap / 1e9).toFixed(1) + 'B' : 'N/A'}
- P/E Ratio: ${data.peRatio?.toFixed(2) ?? 'N/A'}
- EPS: ${data.eps?.toFixed(2) ?? 'N/A'}
- Beta: ${data.beta?.toFixed(2) ?? 'N/A'}
- Dividend Yield: ${data.dividendYield ? (data.dividendYield * 100).toFixed(2) + '%' : 'None'}
- 52W Range: $${data.week52Low?.toFixed(2) ?? 'N/A'} – $${data.week52High?.toFixed(2) ?? 'N/A'}
${data.recentNews?.length ? `- Recent headlines: ${data.recentNews.slice(0, 2).join(' | ')}` : ''}

Be direct. No disclaimers.`
}

function buildPortfolioPrompt(data: any): string {
  const topHoldings = (data.holdings ?? []).slice(0, 6).map((h: any) =>
    `${h.ticker} (${(h.weight ?? 0).toFixed(1)}%, ${(h.gainLossPercent ?? 0) >= 0 ? '+' : ''}${(h.gainLossPercent ?? 0).toFixed(1)}%)`
  ).join(', ')

  return `You are a concise portfolio analyst. Analyze this portfolio and respond in exactly this format:

SIGNAL: [STRONG or BALANCED or WEAK]
RATIONALE: [2-3 sentences on overall portfolio health, plain English]
KEY_RISK: [One sentence on the biggest portfolio risk]
KEY_STRENGTH: [One sentence on the biggest portfolio strength]

Portfolio data:
- Total Value: $${data.totalValue?.toLocaleString()}
- Overall P&L: ${(data.totalGainLossPercent ?? 0) >= 0 ? '+' : ''}${(data.totalGainLossPercent ?? 0).toFixed(2)}%
- Holdings: ${data.holdings?.length ?? 0} stocks across ${new Set((data.holdings || []).map((h: any) => h.sector)).size} sectors
- Top positions: ${topHoldings}

Be direct. No disclaimers.`
}

// ─── Individual model callers ─────────────────────────────────────────────────

// Per-model hard timeouts — reasoning models (Grok 4) need much longer
const MODEL_TIMEOUT_MS = 12000       // Claude + DeepSeek
const GROK_TIMEOUT_MS  = 45000       // Grok 4 is a reasoning model, takes ~15-30s

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
  ])
}

async function callClaude(prompt: string): Promise<ModelResult> {
  const fallback: ModelResult = { model: 'Claude Haiku', signal: 'HOLD', rationale: 'Timed out', keyRisk: '', keyStrength: '', raw: '', error: true }
  try {
    const result = await withTimeout(
      getAnthropic().messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
      MODEL_TIMEOUT_MS,
      null
    )
    if (!result) return fallback
    const text = (result.content[0] as any).text as string
    return { model: 'Claude Haiku', ...parseModelResponse(text), raw: text }
  } catch {
    return fallback
  }
}

async function callDeepSeek(prompt: string): Promise<ModelResult> {
  const fallback: ModelResult = { model: 'DeepSeek V3', signal: 'HOLD', rationale: 'Timed out', keyRisk: '', keyStrength: '', raw: '', error: true }
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS)
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({ model: 'deepseek-chat', max_tokens: 300, messages: [{ role: 'user', content: prompt }] }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return { ...fallback, rationale: `API error (${res.status})` }
    const json = await res.json()
    if (json.error) return { ...fallback, rationale: json.error?.message || 'API error' }
    const text: string = json.choices?.[0]?.message?.content ?? ''
    if (!text.trim()) return { ...fallback, rationale: 'Empty response from model' }
    return { model: 'DeepSeek V3', ...parseModelResponse(text), raw: text }
  } catch (e: any) {
    const msg = e?.name === 'AbortError' ? 'Timed out' : (e?.message || 'Failed')
    return { ...fallback, rationale: msg }
  }
}

function getXaiKey(): string {
  const fromEnv = process.env.XAI_API_KEY
  if (fromEnv && fromEnv.length > 10) return fromEnv
  try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    const content = fs.readFileSync(envPath, 'utf8')
    const match = content.match(/XAI_API_KEY="?([^"\n]+)"?/)
    return match?.[1] ?? ''
  } catch { return '' }
}

async function callGrok(prompt: string): Promise<ModelResult> {
  const fallback: ModelResult = { model: 'Grok 4', signal: 'HOLD', rationale: 'Timed out', keyRisk: '', keyStrength: '', raw: '', error: true }
  const apiKey = getXaiKey()
  if (!apiKey || apiKey.length < 10) return { ...fallback, rationale: 'API key not configured' }
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), GROK_TIMEOUT_MS)
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'grok-4.3', max_tokens: 300, messages: [{ role: 'user', content: prompt }] }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) {
      return { ...fallback, rationale: `API error (${res.status})` }
    }
    const json = await res.json()
    if (json.error) return { ...fallback, rationale: json.error?.message || 'API error' }
    // grok-4.x returns both content and reasoning_content — use content only
    const text: string = json.choices?.[0]?.message?.content ?? ''
    if (!text.trim()) return { ...fallback, rationale: 'Empty response from model' }
    return { model: 'Grok 4', ...parseModelResponse(text), raw: text }
  } catch (e: any) {
    const msg = e?.name === 'AbortError' ? 'Timed out' : (e?.message || 'Failed')
    return { ...fallback, rationale: msg }
  }
}

// ─── Response parser ──────────────────────────────────────────────────────────

function parseModelResponse(text: string): Pick<ModelResult, 'signal' | 'rationale' | 'keyRisk' | 'keyStrength'> {
  // Strip reasoning blocks (Grok-3-mini adds <think>...</think>)
  const clean = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

  // Try to grab a value for a label — handles UPPERCASE, Title Case, underscores, colons, bold markers
  const get = (keys: string[]) => {
    for (const key of keys) {
      const pattern = new RegExp(
        `(?:\\*{0,2})${key}(?:\\*{0,2})[:\\s]+([\\s\\S]+?)(?=\\n(?:\\*{0,2})[A-Z][A-Z_\\s]+(?:\\*{0,2})[:\\s]|\\n---|\n\n|$)`,
        'i'
      )
      const m = clean.match(pattern)
      if (m && m[1].trim()) return m[1].replace(/\*\*/g, '').trim()
    }
    return ''
  }

  // Detect signal — scan full text for BUY/SELL/HOLD keywords
  let signal: 'BUY' | 'HOLD' | 'SELL' | 'STRONG' | 'BALANCED' | 'WEAK' = 'HOLD'
  const sigRaw = get(['SIGNAL', 'RECOMMENDATION', 'VERDICT', 'RATING']).toUpperCase()
  const fullUpper = clean.toUpperCase()
  if (sigRaw.includes('STRONG') || sigRaw.includes('BULLISH')) signal = 'STRONG'
  else if (sigRaw.includes('BUY')) signal = 'BUY'
  else if (sigRaw.includes('SELL') || sigRaw.includes('BEARISH') || sigRaw.includes('WEAK')) signal = 'SELL'
  else if (sigRaw.includes('BALANCED') || sigRaw.includes('NEUTRAL') || sigRaw.includes('HOLD')) signal = 'HOLD'
  else if (fullUpper.match(/\bBUY\b/)) signal = 'BUY'
  else if (fullUpper.match(/\bSELL\b/)) signal = 'SELL'

  const rationale = get(['RATIONALE', 'ANALYSIS', 'REASONING', 'EXPLANATION', 'SUMMARY'])
    || clean.split('\n').filter(l => l.trim().length > 40 && !l.toUpperCase().startsWith('SIGNAL'))[0]?.trim()
    || clean.slice(0, 250)

  const keyRisk = get(['KEY_RISK', 'KEY RISK', 'RISK', 'MAIN RISK', 'PRIMARY RISK', 'BIGGEST RISK'])
  const keyStrength = get(['KEY_STRENGTH', 'KEY STRENGTH', 'STRENGTH', 'MAIN STRENGTH', 'PRIMARY STRENGTH', 'BIGGEST STRENGTH'])

  return { signal, rationale, keyRisk, keyStrength }
}

// ─── Synthesizer ──────────────────────────────────────────────────────────────

async function synthesize(results: ModelResult[], type: 'stock' | 'portfolio', name: string): Promise<string> {
  const signals = results.filter(r => !r.error).map(r => r.signal)
  const buyCount = signals.filter(s => s === 'BUY' || s === 'STRONG').length
  const sellCount = signals.filter(s => s === 'SELL' || s === 'WEAK').length
  const holdCount = signals.filter(s => s === 'HOLD' || s === 'BALANCED').length

  let consensusSignal = 'HOLD'
  if (buyCount >= 2) consensusSignal = type === 'portfolio' ? 'STRONG' : 'BUY'
  else if (sellCount >= 2) consensusSignal = type === 'portfolio' ? 'WEAK' : 'SELL'

  const modelSummaries = results.map(r =>
    `${r.model}: ${r.signal}\n  Rationale: ${r.rationale}\n  Strength: ${r.keyStrength}\n  Risk: ${r.keyRisk}`
  ).join('\n\n')

  const synthesisPrompt = `You are synthesizing 3 AI model analyses into one clear, final answer for ${name}.

The 3 models said:
${modelSummaries}

Consensus signal: ${consensusSignal} (${buyCount} ${type === 'portfolio' ? 'STRONG' : 'BUY'}, ${holdCount} ${type === 'portfolio' ? 'BALANCED' : 'HOLD'}, ${sellCount} ${type === 'portfolio' ? 'WEAK' : 'SELL'})

Write a final analysis in this exact markdown format:

## Consensus: ${consensusSignal} (${buyCount}/3 ${type === 'portfolio' ? 'models say Strong' : 'models say Buy'})

## What the Models Agree On
[2-3 sentences on where all 3 models align]

## Where They Differ
[1-2 sentences on any disagreement between models, or "All models are aligned." if unanimous]

## Key Strengths
• [strength 1]
• [strength 2]

## Key Risks
• [risk 1]
• [risk 2]

## Bottom Line
[2-3 sentences final verdict in plain English — what should an investor actually do?]

---
*Powered by Claude Haiku · DeepSeek V3 · Grok 4*`

  try {
    const msg = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 600,
      messages: [{ role: 'user', content: synthesisPrompt }],
    })
    return (msg.content[0] as any).text as string
  } catch {
    // Fallback: build synthesis manually
    return `## Consensus: ${consensusSignal} (${buyCount}/3 models agree)

## What the Models Found
${results.filter(r => !r.error).map(r => `**${r.model}:** ${r.rationale}`).join('\n\n')}

## Key Strengths
${results.flatMap(r => r.keyStrength ? [`• ${r.keyStrength}`] : []).slice(0, 3).join('\n')}

## Key Risks
${results.flatMap(r => r.keyRisk ? [`• ${r.keyRisk}`] : []).slice(0, 3).join('\n')}

---
*Powered by Claude Haiku · DeepSeek V3 · Grok 4*`
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ModelResult {
  model: string
  signal: string
  rationale: string
  keyRisk: string
  keyStrength: string
  raw: string
  error?: boolean
}

export interface EnsembleResult {
  models: ModelResult[]
  synthesis: string
  consensusSignal: string
  buyCount: number
  holdCount: number
  sellCount: number
}

export async function ensembleAnalyzeStock(data: any): Promise<EnsembleResult> {
  const prompt = buildStockPrompt(data)
  const [claude, deepseek, grok] = await Promise.all([
    callClaude(prompt),
    callDeepSeek(prompt),
    callGrok(prompt),
  ])
  const results = [claude, deepseek, grok]
  const signals = results.map(r => r.signal)
  const buyCount = signals.filter(s => s === 'BUY').length
  const sellCount = signals.filter(s => s === 'SELL').length
  const holdCount = signals.filter(s => s === 'HOLD').length
  const consensusSignal = buyCount >= 2 ? 'BUY' : sellCount >= 2 ? 'SELL' : 'HOLD'
  const synthesis = await synthesize(results, 'stock', `${data.ticker} (${data.companyName})`)
  return { models: results, synthesis, consensusSignal, buyCount, holdCount, sellCount }
}

export async function ensembleAnalyzePortfolio(data: any): Promise<EnsembleResult> {
  const prompt = buildPortfolioPrompt(data)
  const [claude, deepseek, grok] = await Promise.all([
    callClaude(prompt),
    callDeepSeek(prompt),
    callGrok(prompt),
  ])
  const results = [claude, deepseek, grok]
  const signals = results.map(r => r.signal)
  const buyCount = signals.filter(s => s === 'STRONG').length
  const sellCount = signals.filter(s => s === 'WEAK').length
  const holdCount = signals.filter(s => s === 'BALANCED' || s === 'HOLD').length
  const consensusSignal = buyCount >= 2 ? 'STRONG' : sellCount >= 2 ? 'WEAK' : 'BALANCED'
  const synthesis = await synthesize(results, 'portfolio', 'your portfolio')
  return { models: results, synthesis, consensusSignal, buyCount, holdCount, sellCount }
}
