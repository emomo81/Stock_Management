-- ============================================================================
-- AIMS Inventory OS — Fresh Database Setup
-- ============================================================================
-- Use this if your Supabase/Postgres project was deleted or you're bringing
-- up a brand new database from scratch.
--
-- You have two options — pick ONE:
--
-- OPTION A (recommended): Just redeploy.
--   server/package.json's "start" script already runs `prisma migrate deploy`
--   before starting the server. If DATABASE_URL points at an empty Postgres
--   database, Render (or wherever you deploy) will create these exact tables
--   automatically on the next deploy. You do NOT need to run this file by hand.
--
-- OPTION B: Run this file manually.
--   Paste this whole file into the Supabase SQL editor (or `psql`) if you want
--   the tables to exist before your first deploy, or if `prisma migrate
--   deploy` can't run for some reason. It creates the identical schema Prisma
--   expects, so `prisma migrate deploy` will simply recognize it as already
--   up to date afterwards.
--
-- After creating the new Supabase project:
--   1. Copy its connection string (Project Settings -> Database -> Connection
--      string -> URI). Use the "Transaction pooler" (port 6543) string if
--      you're on a serverless/Render free tier, or the direct (port 5432)
--      string otherwise.
--   2. Set it as DATABASE_URL in your Render backend's environment variables.
--   3. Set JWT_SECRET and (optionally) GEMINI_API_KEY there too.
--   4. Redeploy the backend.
-- ============================================================================

BEGIN;

-- Needed for gen_random_uuid() used in the admin seed below.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "users" (
    "id"        TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "password"  TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "role"      TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- ---------------------------------------------------------------------------
-- inventory
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "inventory" (
    "id"         TEXT NOT NULL,
    "name"       TEXT NOT NULL,
    "sku"        TEXT NOT NULL,
    "stock"      INTEGER NOT NULL,
    "price"      TEXT NOT NULL,
    "cat"        TEXT NOT NULL,
    "img"        TEXT NOT NULL,
    "attributes" TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "inventory_sku_key" ON "inventory"("sku");

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "transactions" (
    "id"          TEXT NOT NULL,
    "type"        TEXT NOT NULL,
    "itemId"      TEXT NOT NULL,
    "qty"         INTEGER NOT NULL,
    "price"       TEXT NOT NULL,
    "vendor"      TEXT,
    "date"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- Register this schema with Prisma's migration history so future
-- `prisma migrate deploy` runs don't try to re-run the init migration.
-- Safe to run even if the row already exists.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    VARCHAR(36) NOT NULL,
    "checksum"              VARCHAR(64) NOT NULL,
    "finished_at"           TIMESTAMPTZ,
    "migration_name"        VARCHAR(255) NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        TIMESTAMPTZ,
    "started_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count"   INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

INSERT INTO "_prisma_migrations"
    ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
SELECT
    '00000000-0000-0000-0000-000000000001',
    '91a6b36674ba1227d4022728e92d53d239f7611c1c0abe696ef450a1476f036f',
    now(),
    '20260710185345_init',
    now(),
    1
WHERE NOT EXISTS (
    SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20260710185345_init'
);

-- ---------------------------------------------------------------------------
-- Seed one admin login so you can sign in immediately after setup.
--   email:    admin@aims.com
--   password: ChangeMe123!
-- CHANGE THIS PASSWORD after your first login (Admin > Create User, or by
-- updating this row) — it's a placeholder hash committed to the repo.
-- ---------------------------------------------------------------------------
INSERT INTO "users" ("id", "email", "password", "name", "role")
SELECT
    gen_random_uuid()::text,
    'admin@aims.com',
    '$2b$10$gC.frD8WplJag0AfaDImx.8jTNYElXNTIbUMbkydTgJ7af76zXTEu',
    'System Admin',
    'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM "users" WHERE "email" = 'admin@aims.com'
);

COMMIT;

-- ============================================================================
-- Bonus: handy read-only reporting queries (run separately, not part of setup)
-- ============================================================================

-- Low / out-of-stock items
-- SELECT name, sku, stock, cat FROM inventory WHERE stock < 20 ORDER BY stock ASC;

-- Top sellers by units sold in the last 30 days
-- SELECT i.name, i.sku, SUM(t.qty) AS units_sold
-- FROM transactions t
-- JOIN inventory i ON i.id = t."itemId"
-- WHERE t.type = 'OUT' AND t.date >= now() - interval '30 days'
-- GROUP BY i.name, i.sku
-- ORDER BY units_sold DESC
-- LIMIT 10;

-- Inventory value by category
-- SELECT cat, SUM(stock * NULLIF(regexp_replace(price, '[^0-9.]', '', 'g'), '')::numeric) AS value
-- FROM inventory
-- GROUP BY cat
-- ORDER BY value DESC;

-- Dead stock: items in stock that haven't sold in 30+ days (or never)
-- SELECT i.name, i.sku, i.stock, MAX(t.date) AS last_sale
-- FROM inventory i
-- LEFT JOIN transactions t ON t."itemId" = i.id AND t.type = 'OUT'
-- WHERE i.stock > 0
-- GROUP BY i.name, i.sku, i.stock
-- HAVING MAX(t.date) IS NULL OR MAX(t.date) < now() - interval '30 days'
-- ORDER BY i.stock DESC;
