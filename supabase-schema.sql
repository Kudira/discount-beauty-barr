-- ============================================================
-- DISCOUNT BEAUTY BARR — SUPABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- ── Enable UUID extension ────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── ENUM types ───────────────────────────────────────────────
create type user_role as enum ('customer', 'cashier', 'manager', 'admin');
create type branch_id as enum ('osu', 'east-legon');
create type product_category as enum ('skincare', 'makeup', 'haircare', 'fragrance', 'tools', 'body');
create type order_status as enum ('pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled', 'refunded');
create type fulfillment_type as enum ('delivery', 'pickup');
create type payment_method as enum ('card', 'mobile_money', 'cash', 'bank_transfer');
create type payment_status as enum ('pending', 'success', 'failed', 'refunded');

-- ============================================================
-- TABLE: profiles
-- Extends Supabase auth.users with app-specific data
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  phone       text,
  role        user_role not null default 'customer',
  branch_id   branch_id,                    -- for staff: their assigned branch
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'customer'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TABLE: branches
-- ============================================================
create table public.branches (
  id            branch_id primary key,
  name          text not null,
  address       text not null,
  phone         text,
  email         text,
  opening_hours text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Seed branches
insert into public.branches (id, name, address, phone, email, opening_hours) values
  ('osu',       'Osu Branch',        'Oxford Street, Osu, Accra',                    '+233 XX XXX XXXX', 'osu@discountbeautybarr.com',       'Mon – Sat: 9am – 7pm | Sun: 11am – 5pm'),
  ('east-legon','East Legon Branch', 'American House Junction, East Legon, Accra',   '+233 XX XXX XXXX', 'eastlegon@discountbeautybarr.com',  'Mon – Sat: 9am – 7pm | Sun: 11am – 5pm');

-- ============================================================
-- TABLE: products
-- ============================================================
create table public.products (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text not null unique,
  description   text,
  category      product_category not null,
  brand         text not null,
  images        text[] default '{}',
  base_price    numeric(10,2) not null,
  is_featured   boolean not null default false,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- TABLE: product_variants
-- ============================================================
create table public.product_variants (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references public.products(id) on delete cascade,
  name        text not null,     -- e.g. "30ml", "Shade: Ivory"
  sku         text not null unique,
  price       numeric(10,2) not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- TABLE: inventory
-- Stock per variant per branch
-- ============================================================
create table public.inventory (
  id                  uuid primary key default uuid_generate_v4(),
  variant_id          uuid not null references public.product_variants(id) on delete cascade,
  branch_id           branch_id not null references public.branches(id),
  quantity            integer not null default 0 check (quantity >= 0),
  low_stock_threshold integer not null default 5,
  updated_at          timestamptz not null default now(),
  unique(variant_id, branch_id)
);

-- ============================================================
-- TABLE: orders
-- ============================================================
create table public.orders (
  id              uuid primary key default uuid_generate_v4(),
  order_number    text not null unique default 'DBB-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  customer_id     uuid references public.profiles(id) on delete set null,
  branch_id       branch_id references public.branches(id),
  status          order_status not null default 'pending',
  fulfillment     fulfillment_type not null default 'delivery',

  -- Customer info (stored at order time in case profile changes)
  customer_name   text not null,
  customer_email  text not null,
  customer_phone  text,

  -- Delivery address
  delivery_address text,
  delivery_city    text,
  notes            text,

  -- Financials
  subtotal        numeric(10,2) not null default 0,
  delivery_fee    numeric(10,2) not null default 0,
  discount        numeric(10,2) not null default 0,
  total           numeric(10,2) not null default 0,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- TABLE: order_items
-- ============================================================
create table public.order_items (
  id            uuid primary key default uuid_generate_v4(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  variant_id    uuid references public.product_variants(id) on delete set null,
  product_name  text not null,   -- snapshot at purchase time
  variant_name  text not null,
  brand         text not null,
  sku           text not null,
  price         numeric(10,2) not null,
  quantity      integer not null check (quantity > 0),
  subtotal      numeric(10,2) generated always as (price * quantity) stored
);

-- ============================================================
-- TABLE: payments
-- ============================================================
create table public.payments (
  id                  uuid primary key default uuid_generate_v4(),
  order_id            uuid not null references public.orders(id) on delete cascade,
  method              payment_method not null,
  status              payment_status not null default 'pending',
  amount              numeric(10,2) not null,
  reference           text not null unique,
  paystack_reference  text,
  paid_at             timestamptz,
  created_at          timestamptz not null default now()
);

-- ============================================================
-- UPDATED_AT triggers
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at    before update on public.profiles    for each row execute procedure public.set_updated_at();
create trigger set_products_updated_at    before update on public.products    for each row execute procedure public.set_updated_at();
create trigger set_inventory_updated_at   before update on public.inventory   for each row execute procedure public.set_updated_at();
create trigger set_orders_updated_at      before update on public.orders      for each row execute procedure public.set_updated_at();

-- ============================================================
-- INDEXES for common queries
-- ============================================================
create index idx_products_category   on public.products(category);
create index idx_products_brand      on public.products(brand);
create index idx_products_is_active  on public.products(is_active);
create index idx_products_slug       on public.products(slug);
create index idx_variants_product    on public.product_variants(product_id);
create index idx_inventory_variant   on public.inventory(variant_id);
create index idx_inventory_branch    on public.inventory(branch_id);
create index idx_orders_customer     on public.orders(customer_id);
create index idx_orders_status       on public.orders(status);
create index idx_orders_branch       on public.orders(branch_id);
create index idx_order_items_order   on public.order_items(order_id);
create index idx_payments_order      on public.payments(order_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles       enable row level security;
alter table public.branches       enable row level security;
alter table public.products       enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory      enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.payments       enable row level security;

-- Helper function: get current user role
create or replace function public.get_my_role()
returns user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- Helper function: is admin or manager?
create or replace function public.is_staff()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('admin', 'manager', 'cashier')
  );
$$ language sql security definer stable;

create or replace function public.is_admin_or_manager()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('admin', 'manager')
  );
$$ language sql security definer stable;

-- ── profiles policies ────────────────────────────────────────
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin_or_manager());

create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.get_my_role() = 'admin');

-- ── branches policies ────────────────────────────────────────
create policy "Anyone can view branches"
  on public.branches for select
  using (true);

create policy "Only admins can modify branches"
  on public.branches for all
  using (public.get_my_role() = 'admin');

-- ── products policies ────────────────────────────────────────
create policy "Anyone can view active products"
  on public.products for select
  using (is_active = true);

create policy "Staff can view all products"
  on public.products for select
  using (public.is_staff());

create policy "Admins can manage products"
  on public.products for all
  using (public.is_admin_or_manager());

-- ── product_variants policies ────────────────────────────────
create policy "Anyone can view variants"
  on public.product_variants for select
  using (true);

create policy "Admins can manage variants"
  on public.product_variants for all
  using (public.is_admin_or_manager());

-- ── inventory policies ───────────────────────────────────────
create policy "Staff can view inventory"
  on public.inventory for select
  using (public.is_staff());

create policy "Staff can update inventory"
  on public.inventory for update
  using (public.is_staff());

create policy "Admins can manage inventory"
  on public.inventory for all
  using (public.is_admin_or_manager());

-- ── orders policies ──────────────────────────────────────────
create policy "Customers can view own orders"
  on public.orders for select
  using (auth.uid() = customer_id);

create policy "Customers can create orders"
  on public.orders for insert
  with check (auth.uid() = customer_id or customer_id is null);

create policy "Staff can view all orders"
  on public.orders for select
  using (public.is_staff());

create policy "Staff can update orders"
  on public.orders for update
  using (public.is_staff());

create policy "Admins can manage all orders"
  on public.orders for all
  using (public.is_admin_or_manager());

-- ── order_items policies ─────────────────────────────────────
create policy "Customers can view own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.customer_id = auth.uid()
    )
  );

create policy "Anyone can insert order items"
  on public.order_items for insert
  with check (true);

create policy "Staff can view all order items"
  on public.order_items for select
  using (public.is_staff());

-- ── payments policies ────────────────────────────────────────
create policy "Customers can view own payments"
  on public.payments for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = payments.order_id
      and orders.customer_id = auth.uid()
    )
  );

create policy "Anyone can insert payments"
  on public.payments for insert
  with check (true);

create policy "Staff can view all payments"
  on public.payments for select
  using (public.is_staff());

create policy "Admins can manage payments"
  on public.payments for all
  using (public.is_admin_or_manager());

-- ============================================================
-- STORAGE: product-images bucket
-- ============================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict do nothing;

create policy "Public can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Admins can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin_or_manager());

create policy "Admins can delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin_or_manager());

-- ============================================================
-- VIEWS for common queries
-- ============================================================

-- Products with variant count and price range
create or replace view public.products_with_variants as
select
  p.*,
  count(v.id) as variant_count,
  min(v.price) as min_price,
  max(v.price) as max_price
from public.products p
left join public.product_variants v on v.product_id = p.id
group by p.id;

-- Low stock alert view
create or replace view public.low_stock_alerts as
select
  i.id,
  i.branch_id,
  i.quantity,
  i.low_stock_threshold,
  v.name as variant_name,
  v.sku,
  p.name as product_name,
  p.brand,
  p.category
from public.inventory i
join public.product_variants v on v.id = i.variant_id
join public.products p on p.id = v.product_id
where i.quantity <= i.low_stock_threshold
order by i.quantity asc;

-- ============================================================
-- DONE — Schema created successfully
-- ============================================================
