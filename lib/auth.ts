import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        login: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        demoToken: { label: 'Demo Token', type: 'text' },
      },
      async authorize(credentials) {
        // Demo login path
        if (credentials?.demoToken) {
          if (credentials.demoToken !== process.env.DEMO_SECRET) return null
          let demo = await prisma.user.findFirst({ where: { isDemo: true } })
          if (!demo) {
            demo = await prisma.user.create({
              data: {
                email: 'demo@preview.internal',
                username: 'preview_user',
                password: '',
                name: 'Preview User',
                isDemo: true,
              },
            })
          }
          return { id: demo.id, email: demo.email, name: demo.name, isDemo: true }
        }

        // Normal login: username or email
        if (!credentials?.login || !credentials?.password) return null

        const isEmail = credentials.login.includes('@')
        const user = isEmail
          ? await prisma.user.findUnique({ where: { email: credentials.login } })
          : await prisma.user.findFirst({ where: { username: credentials.login } })

        if (!user || !user.password) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name, username: user.username ?? undefined, isDemo: user.isDemo }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isDemo = (user as any).isDemo ?? false
        token.username = (user as any).username ?? null
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).isDemo = token.isDemo
        ;(session.user as any).username = token.username
      }
      return session
    },
  },
}
