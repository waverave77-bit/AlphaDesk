import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// ── ONE-TIME admin utility ────────────────────────────────────────────────────
// Adds the themeSkin/themeOutfit columns to the User table in whatever database
// the live app is connected to. Needed because prod is managed by `db push`, not
// migrations, so a committed migration file never runs on deploy. The SQL is a
// fixed, additive, idempotent DDL string (no user input). Admin-only. DELETE this
// route once the columns exist and the sync feature is shipped.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "themeSkin" TEXT')
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "themeOutfit" TEXT')

    const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'User' AND column_name IN ('themeSkin','themeOutfit')`
    )
    const found = cols.map((c) => c.column_name).sort()
    return NextResponse.json({
      ok: found.length === 2,
      columns: found,
      message: found.length === 2
        ? 'themeSkin and themeOutfit columns are present. Safe to ship the sync feature.'
        : 'Columns missing — something went wrong.',
    })
  } catch (e: any) {
    console.error('db-add-theme-columns error:', e)
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 })
  }
}
