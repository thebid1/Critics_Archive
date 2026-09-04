#!/usr/bin/env node
/**
 * Additive migration: orders.owner_notified_at (store-owner "new order" email
 * idempotency marker). Never drops anything.
 *
 * Usage: node scripts/migrate-owner-notify.mjs
 */
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import pg from "pg";

dotenv.config({
  path: fileURLToPath(new URL("../.env.local", import.meta.url)),
});

const { Pool } = pg;
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (add it to .env.local).");
  process.exit(1);
}

const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

pool
  .query("alter table orders add column if not exists owner_notified_at timestamptz;")
  .then(() => {
    console.log("✓ orders.owner_notified_at column added");
    return pool.end();
  })
  .catch((err) => {
    console.error("migration failed:", err.message);
    process.exit(1);
  });
