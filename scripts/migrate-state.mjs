#!/usr/bin/env node
/**
 * Stage 10 migration — ADDITIVE ONLY, never drops tables.
 *
 * Adds the checkout "state" field:
 *   1. `orders.state` column (default '')
 *   2. `create_order` updated to accept + persist `p_state`
 *
 * Safe to run against the live database while the client is testing.
 *
 * Usage: node scripts/migrate-state.mjs
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
alter table orders add column if not exists state text not null default '';

-- Drop the pre-state (10-arg) create_order overload, then recreate with p_state.
drop function if exists create_order(text, text, text, text, text, text, text, integer, text, jsonb);

create or replace function create_order(
  p_email text,
  p_phone text,
  p_customer_name text,
  p_address_line1 text,
  p_address_line2 text,
  p_city text,
  p_state text,
  p_country text,
  p_delivery_fee integer,
  p_currency text,
  p_items jsonb
) returns jsonb as $$
declare
  v_order_id uuid;
  v_ref text := 'ca_' || replace(gen_random_uuid()::text, '-', '');
  v_subtotal integer := 0;
  v_total integer;
  r record;
  v_p products%rowtype;
  v_var product_variants%rowtype;
begin
  if p_currency <> 'NGN' then raise exception 'BAD_CURRENCY'; end if;
  if p_delivery_fee < 0 or p_delivery_fee > 1000000 then raise exception 'BAD_FEE'; end if;
  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 50 then
    raise exception 'BAD_ITEMS';
  end if;

  create temp table t_lines (
    product_id uuid, variant_id uuid, pname text, psize text, pprice int, pqty int, pimage text
  ) on commit drop;

  for r in
    select (x->>'slug') as slug,
           upper(coalesce(x->>'size', '')) as size,
           (x->>'qty')::int as qty
    from jsonb_array_elements(p_items) as x
  loop
    if r.slug is null or r.qty is null or r.qty < 1 or r.qty > 99 then
      raise exception 'BAD_ITEM';
    end if;

    select * into v_p from products where slug = r.slug for update;
    if not found then raise exception 'PRODUCT_UNAVAILABLE'; end if;
    if not v_p.is_published or v_p.archived_at is not null then
      raise exception 'PRODUCT_UNAVAILABLE';
    end if;

    v_var := null;
    if r.size <> '' then
      select * into v_var from product_variants
        where product_id = v_p.id and size = r.size;
      if not found then raise exception 'SIZE_UNAVAILABLE'; end if;
    else
      select * into v_var from product_variants
        where product_id = v_p.id order by size limit 1;
      if not found then raise exception 'SIZE_REQUIRED'; end if;
      if (select count(*) from product_variants where product_id = v_p.id) > 1 then
        raise exception 'SIZE_REQUIRED';
      end if;
    end if;

    if v_p.stock < r.qty then raise exception 'INSUFFICIENT_STOCK'; end if;

    update products set stock = stock - r.qty where id = v_p.id;
    v_subtotal := v_subtotal + (v_p.price * r.qty);

    insert into t_lines (product_id, variant_id, pname, psize, pprice, pqty, pimage)
    values (
      v_p.id,
      v_var.id,
      v_p.name,
      r.size,
      v_p.price,
      r.qty,
      (select url from product_images where product_id = v_p.id order by position limit 1)
    );
  end loop;

  v_total := v_subtotal + p_delivery_fee;
  insert into orders (
    reference, email, phone, customer_name, address_line1, address_line2, city, state, country,
    subtotal, shipping_total, total, currency, status
  ) values (
    v_ref, p_email, p_phone, p_customer_name, p_address_line1, p_address_line2, p_city, p_state, p_country,
    v_subtotal, p_delivery_fee, v_total, p_currency, 'pending'
  ) returning id into v_order_id;

  insert into order_items (order_id, product_id, product_variant_id, name, size, price, qty, image)
  select v_order_id, t.product_id, t.variant_id, t.pname, t.psize, t.pprice, t.pqty, t.pimage
  from t_lines t;

  return jsonb_build_object(
    'reference', v_ref,
    'order_id', v_order_id,
    'subtotal', v_subtotal,
    'total', v_total,
    'currency', p_currency
  );
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function create_order(text, text, text, text, text, text, text, text, integer, text, jsonb)
  from public, anon, authenticated;
grant execute on function create_order(text, text, text, text, text, text, text, text, integer, text, jsonb)
  to service_role;
`;

const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

pool
  .query(sql)
  .then(() => {
    console.log("✓ orders.state column + create_order(p_state) applied");
    return pool.end();
  })
  .catch((err) => {
    console.error("state migration failed:", err.message);
    process.exit(1);
  });
