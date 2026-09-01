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

-- Atomically validate a successful Paystack payment, decrement shared product
-- pools, and mark the order paid. Repeated webhook/callback delivery is safe.
create or replace function fulfill_paid_order(
  order_reference text,
  paid_amount integer,
  paid_currency text
) returns text as $$
declare
  target_order orders%rowtype;
  item record;
begin
  select * into target_order from orders where reference = order_reference for update;
  if not found then raise exception 'Order not found'; end if;
  if target_order.status in ('paid', 'fulfilled') then return 'already_paid'; end if;
  if target_order.status <> 'pending' then raise exception 'Order is not payable'; end if;
  if target_order.total <> paid_amount or target_order.currency <> paid_currency then
    raise exception 'Payment amount or currency mismatch';
  end if;

  for item in select product_id, qty from order_items where order_id = target_order.id loop
    update products
      set stock = stock - item.qty
      where id = item.product_id and stock >= item.qty;
    if not found then raise exception 'Insufficient stock'; end if;
  end loop;

  update orders set status = 'paid', paid_at = now() where id = target_order.id;
  return 'paid';
end;
$$ language plpgsql security definer set search_path = public;

-- This function is called only by the server's privileged Supabase client.
-- Never expose the payment fulfillment primitive through public RPC access.
revoke execute on function fulfill_paid_order(text, integer, text) from public, anon, authenticated;
grant execute on function fulfill_paid_order(text, integer, text) to service_role;

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