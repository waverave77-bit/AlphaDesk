import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { holdings, totalGainLoss, totalGainLossPct } = await req.json()

  if (!holdings?.length) return NextResponse.json({ error: 'No holdings to roast' }, { status: 400 })

  const holdingLines = holdings.map((h: any) =>
    `${h.ticker}: ${h.shares} shares, avg cost $${h.avgCost.toFixed(2)}, now $${h.currentPrice.toFixed(2)} (${h.gainLossPct >= 0 ? '+' : ''}${h.gainLossPct.toFixed(2)}%)`
  ).join('\n')

  const prompt = `You are Mr. Guy — a brutally honest, funny investing advisor. Roast this virtual $100K Challenge portfolio. Be SHORT, punchy, and savage. No markdown headers, no bullet points with **bold**. Just plain conversational text with line breaks.

Holdings:
${holdingLines}

Total P&L: ${totalGainLoss >= 0 ? '+' : ''}$${Math.abs(totalGainLoss).toFixed(2)} (${totalGainLossPct >= 0 ? '+' : ''}${totalGainLossPct?.toFixed(2)}%)

Give: one sharp sentence per stock, then a one-line portfolio grade, then one thing to change. Keep the whole thing under 150 words. No markdown formatting.`

  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-latest',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.9,
      }),
    })

    if (!res.ok) {
      // Fallback to DeepSeek
      const dsRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
          temperature: 0.9,
        }),
      })
      const dsData = await dsRes.json()
      return NextResponse.json({ roast: dsData.choices?.[0]?.message?.content ?? 'No roast available.' })
    }

    const data = await res.json()
    return NextResponse.json({ roast: data.choices?.[0]?.message?.content ?? 'No roast available.' })
  } catch (e) {
    return NextResponse.json({ error: 'Roast failed' }, { status: 500 })
  }
}
