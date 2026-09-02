-- CRITICS ARCHIVE — Stage 2 schema + RLS
-- Dev/reset script (drops & recreates). Production would use incremental migrations.
-- Run with: `npm run db:reset` (see scripts/db-reset.mjs).

create extension if not exists pgcrypto;

drop table if exists order_items;
drop table if exists orders;
drop table if exists product_variants;
drop table if exists product_images;
drop table if exists products;

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

-- Release a reservation immediately when the customer cancels before payment.
create or replace function cancel_pending_order(order_reference text)
returns text as $$
declare
  target_order orders%rowtype;
  item record;
begin
  select * into target_order from orders where reference = order_reference for update;
  if not found then raise exception 'Order not found'; end if;
  if target_order.status in ('paid', 'fulfilled') then return 'already_paid'; end if;
  if target_order.status <> 'pending' then return 'already_cancelled'; end if;

  for item in select product_id, qty from order_items where order_id = target_order.id loop
    update products set stock = stock + item.qty where id = item.product_id;
  end loop;
  update orders set status = 'cancelled' where id = target_order.id;
  return 'cancelled';
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function cancel_pending_order(text) from public, anon, authenticated;
grant execute on function cancel_pending_order(text) to service_role;

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
--    server-side secret client during checkout (Stage 5).