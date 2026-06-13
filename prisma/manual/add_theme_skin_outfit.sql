-- Run this against the PRODUCTION database BEFORE deploying the skin/outfit
-- sync feature. Adds two optional columns to the User table.
--
-- Safe: nullable columns, IF NOT EXISTS, no data loss, idempotent (re-runnable).
-- This is NOT a Prisma migration — it won't auto-run on deploy. Run it manually
-- once against prod, then the feature code can be shipped.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "themeSkin" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "themeOutfit" TEXT;
