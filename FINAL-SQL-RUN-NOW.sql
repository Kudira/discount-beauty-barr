-- ============================================================
-- RUN THIS ENTIRE FILE IN SUPABASE SQL EDITOR
-- One time only — safe to run again if needed
-- ============================================================

-- ── 1. Add missing columns to orders ─────────────────────────
alter table public.orders add column if not exists source text default 'online';
alter table public.orders add column if not exists promo_code text;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists delivery_address text;
alter table public.orders add column if not exists delivery_city text;

-- ── 2. Create brands table ───────────────────────────────────
create table if not exists public.brands (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null unique,
  slug       text not null unique,
  sku_prefix text not null,
  created_at timestamptz not null default now()
);
alter table public.brands enable row level security;
drop policy if exists "Anyone reads brands" on public.brands;
create policy "Anyone reads brands" on public.brands for select using (true);
drop policy if exists "Admins manage brands" on public.brands;
create policy "Admins manage brands" on public.brands for all using (true) with check (true);

-- Seed common brands
insert into public.brands (name, slug, sku_prefix) values
  ('La Roche-Posay',  'la-roche-posay', 'LRP'),
  ('The Ordinary',    'the-ordinary',   'ORD'),
  ('CeraVe',          'cerave',         'CVE'),
  ('Fenty Beauty',    'fenty-beauty',   'FTY'),
  ('MAC Cosmetics',   'mac',            'MAC'),
  ('NYX',             'nyx',            'NYX'),
  ('Neutrogena',      'neutrogena',     'NEU'),
  ('Garnier',         'garnier',        'GAR'),
  ('L''Oréal',        'loreal',         'LOR'),
  ('Maybelline',      'maybelline',     'MAY'),
  ('OGX',             'ogx',            'OGX'),
  ('Dove',            'dove',           'DOV')
on conflict (name) do nothing;

-- ── 3. Ensure activity_log table exists ──────────────────────
create table if not exists public.activity_log (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete set null,
  user_email  text, user_role text,
  action      text not null,
  entity_type text, entity_id text,
  details     jsonb default '{}',
  created_at  timestamptz not null default now()
);
alter table public.activity_log enable row level security;
drop policy if exists "Anyone inserts activity" on public.activity_log;
create policy "Anyone inserts activity" on public.activity_log for insert with check (true);
drop policy if exists "Admins read activity" on public.activity_log;
create policy "Admins read activity" on public.activity_log for select using (true);

-- ── 4. Ensure wishlists table exists ─────────────────────────
create table if not exists public.wishlists (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  product_id text not null,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);
alter table public.wishlists enable row level security;
drop policy if exists "Users manage wishlist" on public.wishlists;
create policy "Users manage wishlist" on public.wishlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 5. Ensure email_log table exists ─────────────────────────
create table if not exists public.email_log (
  id         uuid primary key default uuid_generate_v4(),
  to_email   text not null, subject text not null, template text not null,
  status     text not null default 'pending',
  order_id   uuid references public.orders(id) on delete set null,
  error      text, created_at timestamptz not null default now()
);
alter table public.email_log enable row level security;
drop policy if exists "Anyone inserts email log" on public.email_log;
create policy "Anyone inserts email log" on public.email_log for insert with check (true);

-- ── 6. Add super_admin + read_only roles ─────────────────────
do $$ begin
  begin alter type user_role add value 'super_admin'; exception when duplicate_object then null; end;
  begin alter type user_role add value 'read_only';   exception when duplicate_object then null; end;
end $$;

-- ── 7. Create inventory rows for variants missing them ────────
insert into public.inventory (variant_id, branch_id, quantity, low_stock_threshold)
select pv.id, 'osu', 0, 5 from public.product_variants pv
where not exists (select 1 from public.inventory i where i.variant_id = pv.id and i.branch_id = 'osu');

insert into public.inventory (variant_id, branch_id, quantity, low_stock_threshold)
select pv.id, 'east-legon', 0, 5 from public.product_variants pv
where not exists (select 1 from public.inventory i where i.variant_id = pv.id and i.branch_id = 'east-legon');

-- ── 8. Fix low_stock_alerts view ─────────────────────────────
drop view if exists public.low_stock_alerts;
create view public.low_stock_alerts as
select i.id, p.name as product_name, pv.name as variant_name,
  i.branch_id, i.quantity, i.low_stock_threshold, pv.sku
from public.inventory i
join public.product_variants pv on pv.id = i.variant_id
join public.products p on p.id = pv.product_id
where i.quantity > 0 and i.quantity <= i.low_stock_threshold and p.is_active = true
order by i.quantity asc;

-- ── 9. Fix profiles trigger ───────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 10. Storage buckets ───────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('product-images', 'product-images', true, 5242880) on conflict (id) do update set public = true;
insert into storage.buckets (id, name, public, file_size_limit)
values ('page-banners', 'page-banners', true, 5242880) on conflict (id) do update set public = true;

-- ── UPGRADE YOURSELF TO SUPER ADMIN ──────────────────────────
-- Uncomment and replace with your email, then run:
-- update public.profiles set role = 'super_admin' where email = 'YOUR_EMAIL_HERE';

select 'All done ✓' as result;

-- ── Add pos_pin to profiles ───────────────────────────────────
alter table public.profiles add column if not exists pos_pin text;
-- Note: In production, hash this. For now storing plain text for simplicity.

select 'POS PIN column added ✓' as result;
