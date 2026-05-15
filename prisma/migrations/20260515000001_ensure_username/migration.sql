-- Ensure username column exists (idempotent)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;

-- Ensure unique index exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'User' AND indexname = 'User_username_key'
  ) THEN
    CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
  END IF;
END $$;
