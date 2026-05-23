import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrisma(): PrismaClient {
  // Guard: no DATABASE_URL means we're in a preview/build env without a DB.
  // Return a no-op proxy so imports don't crash — real queries will throw at
  // call-time with a clear message rather than at module-load time.
  if (!process.env.DATABASE_URL) {
    return new Proxy({} as PrismaClient, {
      get: (_, prop) => {
        if (prop === '$connect' || prop === '$disconnect') return () => Promise.resolve()
        return new Proxy(() => {}, {
          get: () => { throw new Error(`Prisma: DATABASE_URL is not set (preview env)`) },
          apply: () => { throw new Error(`Prisma: DATABASE_URL is not set (preview env)`) },
        })
      },
    })
  }
  return new PrismaClient({ log: ['error'] })
}

export const prisma = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
