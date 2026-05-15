export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: { ticker: string } }
) {
  const { ticker } = params
  const { searchParams } = new URL(req.url)
  const count = Math.min(parseInt(searchParams.get('count') ?? '25', 10), 40)

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 })
  }

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&newsCount=${count}&quotesCount=0`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Zains Game/1.0)',
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch news' }, { status: 502 })
    }

    const data = await res.json()

    const news = (data?.news ?? []).map(
      (item: {
        title?: string
        link?: string
        publisher?: string
        providerPublishTime?: number
        thumbnail?: { resolutions?: { url: string }[] }
      }) => ({
        title: item.title ?? '',
        link: item.link ?? '',
        publisher: item.publisher ?? '',
        providerPublishTime: item.providerPublishTime ?? 0,
        thumbnail: item.thumbnail?.resolutions?.[0]?.url ?? null,
      })
    )

    return NextResponse.json({ news })
  } catch (error) {
    console.error('News fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
