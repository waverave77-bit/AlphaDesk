import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const DEMO_EMAIL = 'demo@preview.internal'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        login:     { label: 'Username or Email', type: 'text' },
        password:  { label: 'Password', type: 'password' },
        demoToken: { label: 'Demo Token', type: 'text' },
      },
      async authorize(credentials) {
        // ── Demo login ──────────────────────────────────────────────────
        if (credentials?.demoToken) {
          const secret = process.env.DEMO_SECRET
          if (!secret || credentials.demoToken !== secret) return null
          const demo = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })
          if (!demo) return null
          return { id: demo.id, email: demo.email, name: demo.name ?? 'Preview User' }
        }

        // ── Normal login: email only ────────────────────────────────────
        if (!credentials?.login || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.login.trim().toLowerCase() },
        })

        if (!user || !user.password) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name ?? undefined }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.isDemo = user.email === DEMO_EMAIL
        // Read user prefs from DB at sign-in so they're available client-side immediately
        const u = await prisma.user.findUnique({
          where: { id: user.id },
          select: { name: true, username: true, isPro: true, hasOnboarded: true, emailVerified: true, experienceLevel: true, themeDark: true, themeAccent: true, loginStreak: true, lastStreakDate: true },
        })
        if (u?.name) token.name = u.name
        token.username = u?.username ?? null
        token.isPro = u?.isPro ?? false
        token.hasOnboarded = u?.hasOnboarded ?? false
        token.emailVerified = u?.emailVerified ?? false
        token.experienceLevel = u?.experienceLevel ?? 'beginner'
        token.themeDark = u?.themeDark ?? true
        token.themeAccent = u?.themeAccent ?? 'default'
        token.loginStreak = u?.loginStreak ?? 0
        token.lastStreakDate = u?.lastStreakDate ?? null
      }
      // Re-read from DB when updateSession() is called
      if (trigger === 'update' && token.id) {
        const u = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { name: true, username: true, isPro: true, hasOnboarded: true, emailVerified: true, experienceLevel: true, themeDark: true, themeAccent: true, loginStreak: true, lastStreakDate: true },
        })
        if (u?.name) token.name = u.name
        token.username = u?.username ?? null
        token.isPro = u?.isPro ?? false
        token.hasOnboarded = u?.hasOnboarded ?? false
        token.emailVerified = u?.emailVerified ?? false
        token.experienceLevel = u?.experienceLevel ?? 'beginner'
        token.themeDark = u?.themeDark ?? true
        token.themeAccent = u?.themeAccent ?? 'default'
        token.loginStreak = u?.loginStreak ?? 0
        token.lastStreakDate = u?.lastStreakDate ?? null
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        if (token.name) session.user.name = token.name as string
        ;(session.user as any).username = token.username ?? null
        ;(session.user as any).isDemo = token.isDemo ?? false
        ;(session.user as any).isPro = token.isPro ?? false
        ;(session.user as any).hasOnboarded = token.hasOnboarded ?? false
        ;(session.user as any).emailVerified = token.emailVerified ?? false
        ;(session.user as any).experienceLevel = token.experienceLevel ?? 'beginner'
        ;(session.user as any).themeDark = token.themeDark ?? true
        ;(session.user as any).themeAccent = token.themeAccent ?? 'default'
        ;(session.user as any).loginStreak = token.loginStreak ?? 0
        ;(session.user as any).lastStreakDate = token.lastStreakDate ?? null
      }
      return session
    },
  },
}
