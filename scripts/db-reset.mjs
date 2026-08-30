#!/usr/bin/env node
/**
 * Stage 2 dev migration runner.
 *
 * Applies supabase/schema.sql + supabase/seed.sql to the DATABASE_URL in
 * .env.local. Supabase's PostgREST can't run DDL and the Supabase CLI needs an
 * account token we don't have, so we talk to Postgres directly with
 * node-postgres. Local tool only (`pg`/`dotenv` are devDependencies) — nothing
 * here ships to the client.
 *
 * Usage: npm run db:reset
 */
import dotenv from "dotenv";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

dotenv.config({
  path: fileURLToPath(new URL("../.env.local", import.meta.url)),
});

const { Pool } = pg;
const dir = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(dir, "..", "supabase", "schema.sql");
const seedPath = path.join(dir, "..", "supabase", "seed.sql");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (add it to .env.local).");
  process.exit(1);
}

const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function run() {
  const schema = readFileSync(schemaPath, "utf8");
  const seed = readFileSync(seedPath, "utf8");

  await pool.query(schema);
  console.log("✓ schema (tables + RLS) applied");

  await pool.query(seed);
  console.log("✓ seed applied");

  const { rows } = await pool.query(
    "select count(*)::int as products, (select count(*)::int from product_images) as images, (select count(*)::int from product_variants) as variants from products"
  );
  const counts = rows[0];
  console.log(
    `✓ db now has ${counts.products} products, ${counts.images} images, ${counts.variants} variants`
  );
}

run()
  .then(() => pool.end())
  .catch((err) => {
    console.error("Migration failed:", err.message);
    process.exit(1);
  });