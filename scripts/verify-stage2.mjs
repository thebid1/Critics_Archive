#!/usr/bin/env node
/**
 * Stage 2 exit-criteria check:
 *   1. The publishable (anon) key can read all published products + relations.
 *   2. The publishable (anon) key CANNOT write (RLS enforced).
 *
 * Usage: npm run db:verify
 */
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

dotenv.config({
  path: fileURLToPath(new URL("../.env.local", import.meta.url)),
});

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

if (!url || !key) {
  console.error("Supabase env vars missing from .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);
let failed = false;

console.log("1) public read: published products…");
const { data: products, error: readError } = await supabase
  .from("products")
  .select("slug, name, price, is_published, product_images(url), product_variants(stock)")
  .order("created_at", { ascending: true });

if (readError) {
  console.error("   ✗ READ FAILED:", readError.message);
  process.exit(1);
}
console.log(`   ✓ got ${products.length} rows via publishable key`);
for (const p of products) {
  const sym = p.currency === "NGN" ? "₦" : `${p.currency} `;
  console.log(
    `   - ${p.slug} | ${sym}${Number(p.price).toLocaleString("en-NG")} | img=${p.product_images.length} variants=${p.product_variants.length}`
  );
}

console.log("2) anon write attempt (must be denied)…");
const { error: writeError } = await supabase
  .from("products")
  .insert({ slug: "__rls_write_probe__", name: "RLS probe", price: 1 });

if (!writeError) {
  console.error("   ✗ WRITE WAS ALLOWED — RLS is broken!");
  process.exit(1);
}
console.log(`   ✓ denied (${writeError.status === 403 ? "403 Forbidden" : `status ${writeError.status}`})`);
console.log(`     ${writeError.message}`);

if (failed) process.exit(1);
console.log("\nStage 2 RLS verification passed ✓");