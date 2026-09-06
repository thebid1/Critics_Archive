#!/usr/bin/env node
/**
 * Additive migration: newsletter_subscribers.unsubscribed_at (unsubscribe flag).
 *
 * Usage: node scripts/migrate-newsletter.mjs
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
  .query("alter table newsletter_subscribers add column if not exists unsubscribed_at timestamptz;")
  .then(() => {
    console.log("✓ newsletter_subscribers.unsubscribed_at column added");
    return pool.end();
  })
  .catch((err) => {
    console.error("migration failed:", err.message);
    process.exit(1);
  });
