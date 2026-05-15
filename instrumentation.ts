export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { prisma } = await import('./lib/prisma')
      // Add username column if it doesn't exist yet (idempotent)
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT`
      // Add unique index if it doesn't exist yet
      await prisma.$executeRaw`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE tablename = 'User' AND indexname = 'User_username_key'
          ) THEN
            CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
          END IF;
        END $$
      `
    } catch (e) {
      // Column likely already exists — safe to ignore
      console.log('[instrumentation] schema check:', e)
    }
  }
}
