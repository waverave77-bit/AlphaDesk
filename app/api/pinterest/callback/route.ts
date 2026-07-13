import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// One-time manual OAuth handoff: Pinterest redirects here with a short-lived
// `code` after the app owner approves access. The code is copy-pasted into
// the setup script on the server (which holds the app secret) to exchange
// for a long-lived access + refresh token. Nothing sensitive is stored here.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  const page = (title: string, body: string) => new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head>
    <body style="font-family:-apple-system,sans-serif;max-width:640px;margin:60px auto;padding:0 20px;color:#16130a">
      <h1>${title}</h1>${body}
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )

  if (error) {
    return page('Pinterest authorization failed', `<p>Error: <code>${error}</code></p>`)
  }
  if (!code) {
    return page('No authorization code received', `<p>Try the authorization link again.</p>`)
  }

  return page('Pinterest authorized', `
    <p>Copy this code and paste it into the setup script on the server (it's single-use and expires in ~10 minutes):</p>
    <textarea readonly style="width:100%;height:90px;font-family:monospace;font-size:14px;padding:12px;box-sizing:border-box">${code}</textarea>
  `)
}
