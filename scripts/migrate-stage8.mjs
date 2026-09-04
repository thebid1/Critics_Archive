#!/usr/bin/env node
/**
 * Stage 8 incremental migration — ADDITIVE ONLY, never drops tables.
 *
 * Applies the Stage 8 schema additions (webhook replay protection + newsletter
 * capture) to the live database WITHOUT touching existing rows, so it is safe to
 * run against the production project while the client is still testing.
 *
 * `scripts/db-reset.mjs` (destructive, drops & reseeds) should only be used for
 * a fresh local/dev database.
 *
 * Usage: node scripts/migrate-stage8.mjs
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

const sql = `
create table if not exists paystack_events (
  reference    text primary key,
  event        text not null,
  processed_at timestamptz not null default now()
);
alter table paystack_events enable row level security;

create table if not exists newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);
alter table newsletter_subscribers enable row level security;

create or replace function claim_paystack_event(
  p_reference text,
  p_event text
) returns boolean as $$
begin
  insert into paystack_events (reference, event)
  values (p_reference, p_event)
  on conflict (reference) do nothing;
  return found;
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function claim_paystack_event(text, text) from public, anon, authenticated;
grant execute on function claim_paystack_event(text, text) to service_role;
`;

const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

pool
  .query(sql)
  .then(() => {
    console.log("✓ Stage 8 migration applied (paystack_events, newsletter_subscribers, claim_paystack_event)");
    return pool.end();
  })
  .catch((err) => {
    console.error("Stage 8 migration failed:", err.message);
    process.exit(1);
  });
