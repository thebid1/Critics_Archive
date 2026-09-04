#!/usr/bin/env node
/**
 * Reset TEST DATA only — clears orders/order_items/paystack_events/newsletter
 * subscribers/admin_actions, and resets product stock back to 50.
 *
 * KEEPS the catalogue (products, images, variants) and drops.
 *
 * Usage: node scripts/reset-test-data.mjs
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

const TABLES = ["order_items", "orders", "paystack_events", "newsletter_subscribers", "admin_actions"];

async function counts() {
  const out = {};
  for (const t of TABLES) {
    const r = await pool.query(`select count(*)::int as n from ${t}`);
    out[t] = r.rows[0].n;
  }
  return out;
}

async function run() {
  console.log("BEFORE:", JSON.stringify(await counts()));

  const drops = await pool.query("select name, is_active from drops order by created_at");
  console.log("DROPS (kept):", drops.rows.map((d) => `${d.name}${d.is_active ? " (active)" : ""}`).join(", "));

  // FK-safe order.
  await pool.query("delete from order_items");
  await pool.query("delete from orders");
  await pool.query("delete from paystack_events");
  await pool.query("delete from newsletter_subscribers");
  await pool.query("delete from admin_actions");

  await pool.query("update products set stock = 50");

  console.log("AFTER: ", JSON.stringify(await counts()));
  console.log("Product stock reset to 50. Catalogue + drops untouched.");
}

run()
  .then(() => pool.end())
  .catch((err) => {
    console.error("Reset failed:", err.message);
    process.exit(1);
  });
