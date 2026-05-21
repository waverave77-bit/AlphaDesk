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
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isDemo = user.email === DEMO_EMAIL
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).isDemo = token.isDemo ?? false
      }
      return session
    },
  },
}
