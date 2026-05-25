/**
 * Shared DeepSeek-V3 client helper.
 * Used for analytical / structured-reasoning tasks where DeepSeek outperforms
 * Claude Haiku (Bull vs Bear, Reality Check, Report Card).
 */

export async function callDeepSeek(
  system: string,
  user: string,
  maxTokens = 600,
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not set')

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat', // DeepSeek-V3
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: user   },
      ],
    }),
    signal: AbortSignal.timeout(20000),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`DeepSeek API error ${res.status}: ${body}`)
  }

  const json = await res.json()
  return (json.choices?.[0]?.message?.content ?? '').trim()
}
