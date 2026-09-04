#!/usr/bin/env node
/**
 * Reset all product stock back to 50 (the Drop 001 seed value).
 * Does NOT touch drops, orders, admin_actions, newsletter, images, or variants.
 *
 * Usage: node scripts/reset-stock.mjs
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

async function run() {
  const before = await pool.query("select slug, stock from products order by slug");
  console.log("BEFORE:", before.rows.map((r) => `${r.slug}=${r.stock}`).join(", "));

  await pool.query("update products set stock = 50");

  const after = await pool.query("select slug, stock from products order by slug");
  console.log("AFTER: ", after.rows.map((r) => `${r.slug}=${r.stock}`).join(", "));
}

run()
  .then(() => pool.end())
  .catch((err) => {
    console.error("Reset failed:", err.message);
    process.exit(1);
  });
