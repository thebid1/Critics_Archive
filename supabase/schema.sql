-- CRITICS ARCHIVE — Stage 2 schema + RLS
-- Dev/reset script (drops & recreates). Production would use incremental migrations.
-- Run with: `npm run db:reset` (see scripts/db-reset.mjs).

create extension if not exists pgcrypto;

drop table if exists admin_actions;
drop table if exists paystack_events;
drop table if exists newsletter_subscribers;
drop table if exists order_items;
drop table if exists orders;
drop table if exists product_variants;
drop table if exists product_images;
drop table if exists products;
drop table if exists drops;

create table products (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  price        integer not null check (price >= 0),
  currency     text not null default 'NGN',
  description  text not null default '',
  -- Product-level inventory pool (client: "Hoodie is 50 available, regardless of size").
  -- One pool per product; sizes are just purchase options. Decremented as orders are paid (Stage 5).
  stock        integer not null default 0 check (stock >= 0),
  drop_name    text,                    -- e.g. 'Drop 001'
  season       text,                    -- e.g. 'SS26'
  is_new       boolean not null default false,
  is_published boolean not null default false,
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  url        text not null,
  alt        text not null default '',
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

-- Product sizes are purchase OPTIONS only — inventory lives on products.stock
-- (one pool per product, shared across all sizes).
create table product_variants (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  size       text not null,
  color      text not null default '',
  created_at timestamptz not null default now(),
  unique (product_id, size, color)
);

create table orders (
  id               uuid primary key default gen_random_uuid(),
  reference        text not null unique,
  status           text not null default 'pending'
                     check (status in ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded')),
  email            text not null,
  phone            text not null default '',
  customer_name    text not null default '',
  address_line1    text not null default '',
  address_line2    text not null default '',
  city             text not null default '',
  country          text not null default '',
  subtotal         integer not null default 0,
  shipping_total   integer not null default 0,
  total            integer not null default 0,
  currency         text not null default 'GBP',
  payment_provider text not null default 'paystack',
  paid_at          timestamptz,
  confirmation_email_sent_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table order_items (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references orders (id) on delete cascade,
  product_id         uuid references products (id) on delete set null,
  product_variant_id uuid references product_variants (id) on delete set null,
  name               text not null,
  size               text not null default '',
  price              integer not null,
  qty                integer not null check (qty > 0),
  image              text not null default '',
  created_at         timestamptz not null default now()
);

-- Keep updated_at fresh on edited rows.
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists products_updated_at on products;
create trigger products_updated_at before update on products
  for each row execute function set_updated_at();

drop trigger if exists orders_updated_at on orders;
create trigger orders_updated_at before update on orders
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Checkout: atomically reserve stock + create order (single transaction).
-- Stock is decremented at order CREATION (reservation); payment fulfillment only
-- marks the order paid. Abandoned pending orders are re-credited later by
-- expire_pending_orders. SECURITY DEFINER, so RLS never blocks it; EXECUTE is
-- granted only to service_role (the server's privileged Supabase client).
-- ---------------------------------------------------------------------------
create or replace function create_order(
  p_email text,
  p_phone text,
  p_customer_name text,
  p_address_line1 text,
  p_address_line2 text,
  p_city text,
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
    reference, email, phone, customer_name, address_line1, address_line2, city, country,
    subtotal, shipping_total, total, currency, status
  ) values (
    v_ref, p_email, p_phone, p_customer_name, p_address_line1, p_address_line2, p_city, p_country,
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

revoke execute on function create_order(text, text, text, text, text, text, text, integer, text, jsonb)
  from public, anon, authenticated;
grant execute on function create_order(text, text, text, text, text, text, text, integer, text, jsonb)
  to service_role;
-- Atomically validate a successful Paystack payment and mark the order paid.
-- Stock was already reserved at create_order, so nothing is decremented here.
-- Repeated webhook/verify delivery is safe (row lock + idempotent).
create or replace function fulfill_paid_order(
  order_reference text,
  paid_amount integer,
  paid_currency text
) returns text as $$
declare
  target_order orders%rowtype;
begin
  select * into target_order from orders where reference = order_reference for update;
  if not found then raise exception 'Order not found'; end if;
  if target_order.status in ('paid', 'fulfilled') then return 'already_paid'; end if;
  if target_order.status <> 'pending' then raise exception 'Order is not payable'; end if;
  if target_order.total <> paid_amount or target_order.currency <> paid_currency then
    raise exception 'Payment amount or currency mismatch';
  end if;

  update orders set status = 'paid', paid_at = now() where id = target_order.id;
  return 'paid';
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function fulfill_paid_order(text, integer, text) from public, anon, authenticated;
grant execute on function fulfill_paid_order(text, integer, text) to service_role;

-- Re-credits stock for pending orders older than p_max_age_hours and marks them
-- cancelled. Runs opportunistically before order creation (and via future cron).
create or replace function expire_pending_orders(p_max_age_hours integer default 24)
returns integer as $$
declare
  restored integer := 0;
  r record;
begin
  for r in
    select o.id as order_id
    from orders o
    where o.status = 'pending'
      and o.created_at < now() - make_interval(hours => p_max_age_hours)
  loop
    update products p
      set stock = p.stock + oi.qty
      from order_items oi
      where oi.order_id = r.order_id and p.id = oi.product_id;
    update orders set status = 'cancelled' where id = r.order_id and status = 'pending';
    restored := restored + 1;
  end loop;
  return restored;
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function expire_pending_orders(integer) from public, anon, authenticated;
grant execute on function expire_pending_orders(integer) to service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table products         enable row level security;
alter table product_images   enable row level security;
alter table product_variants enable row level security;
alter table orders           enable row level security;
alter table order_items      enable row level security;

-- Public read: published, non-archived products only.
create policy "products_public_select" on products
  for select to anon, authenticated
  using (is_published and archived_at is null);

-- Child rows are only visible through a published product.
create policy "product_images_public_select" on product_images
  for select to anon, authenticated
  using (exists (
    select 1 from products p
    where p.id = product_images.product_id
      and p.is_published
      and p.archived_at is null
  ));

create policy "product_variants_public_select" on product_variants
  for select to anon, authenticated
  using (exists (
    select 1 from products p
    where p.id = product_variants.product_id
      and p.is_published
      and p.archived_at is null
  ));

-- No anonymous/authenticated DML anywhere:
--  * Catalogue writes happen only with the service/secret key (RLS-bypassing) or
--    by the table owner (admin) — verified in scripts/verify-stage2.mjs.
--  * orders/order_items have no public policies at all; rows are created by the
-- ---------------------------------------------------------------------------
-- Stage 7 — Admin (minimal). drops / admin_actions / audited write RPCs.
-- ---------------------------------------------------------------------------

-- A drop = one homepage collection ("Drop 001", "Drop 002"...). At most one row
-- has is_active = true; the transition is an atomic RPC (publish_drop), not a
-- DB constraint, so the app layer owns the swap.
create table drops (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  is_active  boolean not null default false,
  created_at timestamptz not null default now()
);

-- Audit trail: every admin write (stock change, order status change, product
-- create/update, drop create/publish, email resend) inserts one row HERE in
-- the SAME transaction as the change itself -- treated as required, not optional.
create table admin_actions (
  id           uuid primary key default gen_random_uuid(),
  admin_email  text not null,
  action       text not null,   -- e.g. 'stock_updated', 'order_status_updated', 'drop_published'
  target_table text not null,
  target_id    uuid not null,
  before       jsonb,
  after        jsonb,
  created_at   timestamptz not null default now()
);

create index admin_actions_target_idx on admin_actions (target_table, target_id);
create index admin_actions_created_idx on admin_actions (created_at desc);
--    server-side secret client during checkout (Stage 5).
-- Products now belong to an optional drop (homepage = active drop; /shop = all).
alter table products add column drop_id uuid references drops (id);
-- Fixed per product type ("size charts never change") -- which chart applies.
-- Stock remains ONE product-level pool (client clarification, Stage 7).
alter table products add column size_chart text not null default '';

alter table orders add column tracking_number text not null default '';
alter table orders add column shipped_email_sent_at timestamptz;

create index drops_active_idx on drops (is_active) where is_active;
create index products_drop_idx on products (drop_id);

-- Same RLS treatment as orders from Stage 2: RLS enabled, ZERO public policies.
-- drops/admin_actions are only reachable through server-side code with the
-- service role key (the admin data layer / RPCs).
alter table drops         enable row level security;
alter table admin_actions enable row level security;
-- All audit-inserting write paths below are SECURITY DEFINER and EXECUTE is
-- granted ONLY to service_role. This keeps each admin write + its admin_actions
-- row in one transaction (never an afterthought).

-- Record an audit row as a standalone unit (email resends, etc.).
create or replace function record_admin_action(
  p_admin_email text,
  p_action text,
  p_target_table text,
  p_target_id uuid,
  p_before jsonb default null,
  p_after jsonb default null
) returns void as $$
begin
  insert into admin_actions (admin_email, action, target_table, target_id, before, after)
  values (p_admin_email, p_action, p_target_table, p_target_id, p_before, p_after);
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function record_admin_action(text, text, text, uuid, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function record_admin_action(text, text, text, uuid, jsonb, jsonb)
  to service_role;

-- Server-only util: list one active drop row (used by the homepage).
create or replace function get_active_drop()
returns jsonb as $$
declare
  v_drop drops%rowtype;
begin
  select * into v_drop from drops where is_active order by created_at desc limit 1;
  if not found then return null; end if;
  return jsonb_build_object('id', v_drop.id, 'name', v_drop.name, 'is_active', v_drop.is_active);
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function get_active_drop() from public, anon, authenticated;
grant execute on function get_active_drop() to service_role;

-- Create a drop (not active yet).
create or replace function create_drop(
  p_name text,
  p_admin_email text
) returns jsonb as $$
declare
  v_drop drops%rowtype;
begin
  if p_name is null or trim(p_name) = '' or length(p_name) > 120 then
    raise exception 'BAD_NAME';
  end if;
  insert into drops (name) values (trim(p_name))
  returning * into v_drop;

  perform record_admin_action(p_admin_email, 'drop_created', 'drops', v_drop.id, null,
    to_jsonb(v_drop));

  return to_jsonb(v_drop);
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function create_drop(text, text) from public, anon, authenticated;
grant execute on function create_drop(text, text) to service_role;

-- Publish a drop = single atomic swap: unset the currently active row, set the
-- new one. Products already published stay published (they only leave the
-- homepage spot, never /shop).
-- Set the single product-level stock pool for a product. The storefront derives
-- "sold out" purely from stock = 0 -- no separate boolean anywhere.
create or replace function set_product_stock(
  p_product_id uuid,
  p_stock integer,
  p_admin_email text
) returns integer as $$
declare
  v_before integer;
  v_after integer;
begin
  if p_stock < 0 then raise exception 'INVALID_STOCK'; end if;

  select stock into v_before from products where id = p_product_id for update;
  if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;

  update products set stock = p_stock where id = p_product_id;
  v_after := p_stock;

  perform record_admin_action(p_admin_email, 'stock_updated', 'products', p_product_id,
    jsonb_build_object('stock', v_before),
    jsonb_build_object('stock', v_after));

  return v_after;
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function set_product_stock(uuid, integer, text)
  from public, anon, authenticated;
grant execute on function set_product_stock(uuid, integer, text) to service_role;
create or replace function publish_drop(
  p_drop_id uuid,
  p_admin_email text
) returns jsonb as $$
declare
  v_old_id uuid;
  v_drop drops%rowtype;
begin
  select id into v_old_id from drops where is_active order by created_at desc limit 1;

  update drops set is_active = false where is_active;
  update drops set is_active = true where id = p_drop_id
  returning * into v_drop;

  if not found then
    raise exception 'DROP_NOT_FOUND';
  end if;

  perform record_admin_action(p_admin_email, 'drop_published', 'drops', v_drop.id,
    jsonb_build_object('previous_active_drop_id', v_old_id),
    jsonb_build_object('active_drop_id', v_drop.id, 'name', v_drop.name));

  return jsonb_build_object('id', v_drop.id, 'name', v_drop.name, 'is_active', true,
    'previous_active_drop_id', v_old_id);
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function publish_drop(uuid, text) from public, anon, authenticated;
-- Product create (admin): inserts the product row, its size-chart variants, and
-- its images atomically, with one audit row. p_data shape:
-- { name, slug, price, currency, description, stock, drop_id?, is_new, is_published,
--   season?, size_chart ('tee'|'shorts'|'hoodie'|'sweatpants'|'scarf'), images: [{url, alt}] }
create or replace function create_product(
  p_admin_email text,
  p_data jsonb
) returns jsonb as $$
declare
  v_product products%rowtype;
  v_size_chart text;
  v_image jsonb;
  v_pos integer := 0;
begin
  if jsonb_typeof(p_data) <> 'object' then raise exception 'BAD_PAYLOAD'; end if;

  v_size_chart := coalesce(p_data->>'size_chart', '');
  if v_size_chart not in ('tee', 'short', 'hoodie', 'sweatpants', 'scarf') then
    raise exception 'BAD_SIZE_CHART';
  end if;

  insert into products (
    slug, name, price, currency, description, stock, drop_id, is_new, is_published,
    season, size_chart
  ) values (
    trim(coalesce(p_data->>'slug', '')),
    trim(coalesce(p_data->>'name', '')),
    coalesce((p_data->>'price')::int, 0),
    coalesce(p_data->>'currency', 'NGN'),
    coalesce(p_data->>'description', ''),
    coalesce((p_data->>'stock')::int, 0),
    (p_data->>'drop_id')::uuid,
    coalesce((p_data->>'is_new')::boolean, false),
    coalesce((p_data->>'is_published')::boolean, false),
    coalesce(p_data->>'season', ''),
    v_size_chart
  ) returning * into v_product;

  -- Fixed size charts per product type (client: "charts never change").
  insert into product_variants (product_id, size)
  select v_product.id, s.size
  from (select unnest(
    case v_size_chart
      when 'tee'        then array['S','M','L','XL','XXL']
      when 'short'      then array['L','XL','XXL']
      when 'hoodie'     then array['S','M','L','XL','XX']
      when 'sweatpants' then array['S','M','L','XL','XXL']
      when 'scarf'      then array['OS']
    end
  ) as size) s;

  if jsonb_typeof(p_data->'images') = 'array' then
    for v_image in select * from jsonb_array_elements(p_data->'images') loop
      if coalesce(v_image->>'url', '') <> '' then
        insert into product_images (product_id, url, alt, position)
        values (v_product.id, v_image->>'url', coalesce(v_image->>'alt', ''), v_pos);
        v_pos := v_pos + 1;
      end if;
    end loop;
  end if;

  perform record_admin_action(p_admin_email, 'product_created', 'products', v_product.id,
    null, to_jsonb(v_product));

  return jsonb_build_object('id', v_product.id, 'slug', v_product.slug);
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function create_product(text, jsonb) from public, anon, authenticated;
grant execute on function create_product(text, jsonb) to service_role;
grant execute on function publish_drop(uuid, text) to service_role;
-- Product update (admin): allowed keys are name, slug, price, currency,
-- description, stock, drop_id, is_new, is_published, season, archived_at, and
-- 'images' (REPLACES the whole product_images set in order). Variants are never
-- touched -- size charts are fixed. Old + new rows are both audited.
create or replace function update_product(
  p_product_id uuid,
  p_admin_email text,
  p_patch jsonb
) returns jsonb as $$
declare
  v_old products%rowtype;
  v_new products%rowtype;
  v_image jsonb;
  v_pos integer := 0;
begin
  if jsonb_typeof(p_patch) <> 'object' then raise exception 'BAD_PAYLOAD'; end if;

  select * into v_old from products where id = p_product_id for update;
  if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;

  v_new := v_old;

  -- Text/numeric scalars.
  if p_patch ? 'name' then v_new.name := trim(coalesce(p_patch->>'name', v_new.name)); end if;
  if p_patch ? 'slug' then v_new.slug := trim(coalesce(p_patch->>'slug', v_new.slug)); end if;
  if p_patch ? 'price' then v_new.price := coalesce((p_patch->>'price')::int, v_new.price); end if;
  if p_patch ? 'currency' then v_new.currency := coalesce(p_patch->>'currency', v_new.currency); end if;
  if p_patch ? 'description' then v_new.description := coalesce(p_patch->>'description', v_new.description); end if;
  if p_patch ? 'stock' then v_new.stock := coalesce((p_patch->>'stock')::int, v_new.stock); end if;
  if p_patch ? 'drop_id' then v_new.drop_id := (p_patch->>'drop_id')::uuid; end if;
  if p_patch ? 'season' then v_new.season := coalesce(p_patch->>'season', v_new.season); end if;

  if p_patch ? 'is_new' then v_new.is_new := coalesce((p_patch->>'is_new')::boolean, v_new.is_new); end if;
  if p_patch ? 'is_published' then v_new.is_published := coalesce((p_patch->>'is_published')::boolean, v_new.is_published); end if;

  -- archived_at: explicit boolean toggle maps to a timestamp.
  if p_patch ? 'archived' then
    if (p_patch->>'archived')::boolean then
      if v_new.archived_at is null then v_new.archived_at := now(); end if;
    else
      v_new.archived_at := null;
    end if;
  end if;

  if v_new.stock < 0 or v_new.price < 0 then raise exception 'INVALID_VALUE'; end if;
  if v_new.slug = '' or v_new.name = '' then raise exception 'BAD_VALUE'; end if;

  update products set
    slug = v_new.slug, name = v_new.name, price = v_new.price, currency = v_new.currency,
    description = v_new.description, stock = v_new.stock, drop_id = v_new.drop_id,
    is_new = v_new.is_new, is_published = v_new.is_published, season = v_new.season,
    archived_at = v_new.archived_at
  where id = p_product_id
  returning * into v_new;

  -- Images: accepted as a full replacement list {url, alt}[] in display order.
  if jsonb_typeof(p_patch->'images') = 'array' then
    delete from product_images where product_id = p_product_id;
    for v_image in select * from jsonb_array_elements(p_patch->'images') loop
      if coalesce(v_image->>'url', '') <> '' then
        insert into product_images (product_id, url, alt, position)
        values (p_product_id, v_image->>'url', coalesce(v_image->>'alt', ''), v_pos);
        v_pos := v_pos + 1;
      end if;
    end loop;
  end if;

  perform record_admin_action(p_admin_email, 'product_updated', 'products', p_product_id,
    to_jsonb(v_old), to_jsonb(v_new));

  return to_jsonb(v_new);
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function update_product(uuid, text, jsonb)
  from public, anon, authenticated;
-- Order status change (admin). The rule from Stage 5/agents.md stays: ONLY the
-- signed Paystack webhook / server-side verify may set 'paid'. The admin may
-- mark a paid order fulfilled (captures an optional tracking number) or cancel a
-- still-pending order (which re-credits the reserved stock).
create or replace function update_order_status(
  p_order_id uuid,
  p_admin_email text,
  p_status text,
  p_tracking text default ''
) returns jsonb as $$
declare
  v_old orders%rowtype;
  v_new orders%rowtype;
begin
  select * into v_old from orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;

  if p_status = 'paid' then raise exception 'ADMIN_CANNOT_SET_PAID'; end if;
  if p_status not in ('fulfilled', 'cancelled') then raise exception 'BAD_STATUS'; end if;

  if p_status = 'fulfilled' and v_old.status not in ('paid', 'fulfilled') then
    raise exception 'ONLY_PAID_CAN_FULFILL';
  end if;
  if p_status = 'cancelled' and v_old.status <> 'pending' then
    raise exception 'ONLY_PENDING_CAN_CANCEL';
  end if;

  v_new := v_old;
  v_new.status := p_status;
  v_new.tracking_number := coalesce(trim(p_tracking), '');

  update orders set status = v_new.status, tracking_number = v_new.tracking_number
  where id = p_order_id
  returning * into v_new;

  -- Re-credit reserved stock when a pending order is cancelled.
  if v_old.status = 'pending' and v_new.status = 'cancelled' then
    update products p
      set stock = p.stock + oi.qty
      from order_items oi
      where oi.order_id = p_order_id and p.id = oi.product_id;
  end if;

  perform record_admin_action(p_admin_email, 'order_status_updated', 'orders', p_order_id,
    jsonb_build_object('status', v_old.status, 'tracking_number', v_old.tracking_number),
    jsonb_build_object('status', v_new.status, 'tracking_number', v_new.tracking_number));

  return jsonb_build_object(
    'order_id', v_new.id, 'status', v_new.status, 'tracking_number', v_new.tracking_number
  );
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function update_order_status(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function update_order_status(uuid, text, text, text) to service_role;
grant execute on function update_product(uuid, text, jsonb) to service_role;
-- Admin dashboard counts (service-role only).
create or replace function admin_orders_status_counts()
returns table(status text, count bigint) as $$
  select orders.status, count(*)::bigint as count
  from orders
  group by orders.status;
$$ language sql security definer set search_path = public;

revoke execute on function admin_orders_status_counts() from public, anon, authenticated;
grant execute on function admin_orders_status_counts() to service_role;

-- ---------------------------------------------------------------------------
-- Stage 8 — Security hardening: webhook replay protection + newsletter capture.
-- ---------------------------------------------------------------------------

-- One row per Paystack transaction reference we have already processed. Paystack
-- retries webhook deliveries, so the webhook CLAIMS its reference here before
-- doing any work: a duplicate delivery (same reference) is acknowledged without
-- re-running fulfillment or the confirmation email (closes the confirmation
-- email race documented in security.md).
create table paystack_events (
  reference    text primary key,
  event        text not null,
  processed_at timestamptz not null default now()
);

alter table paystack_events enable row level security;

-- Newsletter subscribers (Stage 8 wiring — validation + rate limiting on the
-- capture route). Server-only writes via the service role key.
create table newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

alter table newsletter_subscribers enable row level security;

-- Atomically claim a webhook event. Returns true if this call inserted a new row
-- (we own the event and should process it), false if the reference was already
-- seen (duplicate delivery — skip).
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