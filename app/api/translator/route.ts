import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkAILimit } from '@/lib/pro'

export const dynamic = 'force-dynamic'

const MR_GUY_SYSTEM = `You are Mr. Guy, a funny finance mascot who talks like a smart friend at a bar. Plain English only — no jargon. If you use a finance term, immediately explain it in parentheses. Casual, confident, occasionally funny. No markdown asterisks or pound signs. No em dashes. Emojis only: 🟢 🟡 🔴 🚨 ✅ ❌.`

export async function POST(req: NextRequest) {
  const limited = await checkAILimit('translator')
  if (limited) return limited

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  try {
    const { text, mode } = await req.json()
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }
    if (mode !== 'jargon' && mode !== 'earnings') {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
    }

    let userPrompt: string

    if (mode === 'jargon') {
      userPrompt = `Rewrite this finance text in plain English that anyone can understand. Keep the same information, just make it normal. No jargon. Here's the text: ${text}`
    } else {
      userPrompt = `Here's an earnings call excerpt: ${text}

Do two things:
1. Rewrite it in plain English
2. List any red flags — things executives said that sound sketchy, vague, or like they're hiding bad news

Format:
PLAIN ENGLISH:
[rewritten text]

RED FLAGS:
[list or 'None detected']`
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 800,
      system: MR_GUY_SYSTEM,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const responseText = response.content[0].type === 'text' ? response.content[0].text : ''

    if (mode === 'jargon') {
      return NextResponse.json({ translated: responseText })
    }

    // Parse earnings mode response
    const plainEnglishMatch = responseText.match(/PLAIN ENGLISH:\s*([\s\S]*?)(?=RED FLAGS:|$)/i)
    const redFlagsMatch = responseText.match(/RED FLAGS:\s*([\s\S]*?)$/i)

    const plainEnglish = plainEnglishMatch?.[1]?.trim() ?? responseText
    const redFlagsRaw = redFlagsMatch?.[1]?.trim() ?? ''

    let redFlags: string[] | undefined
    if (redFlagsRaw && redFlagsRaw.toLowerCase() !== 'none detected' && redFlagsRaw.toLowerCase() !== 'none') {
      redFlags = redFlagsRaw
        .split('\n')
        .map(line => line.replace(/^[-*•\d.]+\s*/, '').trim())
        .filter(line => line.length > 0)
    }

    return NextResponse.json({ translated: plainEnglish, redFlags })
  } catch (err: any) {
    console.error('Translator error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
