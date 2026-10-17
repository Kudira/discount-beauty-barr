-- ============================================================================
-- STOCK + SECURITY FIXES  (run ONCE in the Supabase SQL Editor, BEFORE the new
-- code is deployed / the branch is merged)
--
-- What it does
--   1. Allows negative stock (POS can sell an item the system thinks is at 0).
--   2. change_stock(): one atomic way to add/remove stock (no lost updates).
--   3. Automatic SKU numbers: sequence + next_skus() that continues PREFIX-NNNN.
--   4. Super admins count as admins in every policy (is_staff / is_admin_or_manager).
--   5. Stops customers/cashiers from changing their own role, branch or POS PIN.
--   6. Removes the wide-open policies (anyone could read the activity log, edit
--      inventory/brands/orders, or insert orders/payments straight from a browser).
--   7. low_stock_alerts now includes negative stock.
--
-- It does NOT touch how the till PIN works.
-- Safe to run twice.
-- ============================================================================

-- 1. Negative stock -----------------------------------------------------------
alter table public.inventory drop constraint if exists inventory_quantity_check;

-- 2. Atomic stock changes -------------------------------------------------------
-- p_delta is added to the current quantity (use a negative number to remove).
-- Creates the row if that branch has none. Returns the new quantity.
create or replace function public.change_stock(p_variant uuid, p_branch public.branch_id, p_delta integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_qty integer;
begin
  insert into public.inventory as i (variant_id, branch_id, quantity, low_stock_threshold)
  values (p_variant, p_branch, p_delta, 5)
  on conflict (variant_id, branch_id)
  do update set quantity = i.quantity + p_delta, updated_at = now()
  returning i.quantity into new_qty;
  return new_qty;
end;
$$;

revoke all on function public.change_stock(uuid, public.branch_id, integer) from public, anon, authenticated;
grant execute on function public.change_stock(uuid, public.branch_id, integer) to service_role;

-- 3. Automatic SKUs (PREFIX-NNNN, one shared counter like the existing ones) ----
create sequence if not exists public.sku_counter;

select setval(
  'public.sku_counter',
  greatest(
    coalesce((select max(substring(sku from '-([0-9]{4})$')::int)
              from public.product_variants
              where sku ~ '^[A-Za-z0-9]+-[0-9]{4}$'), 0),
    (select last_value from public.sku_counter)
  )
);

create or replace function public.next_skus(p_prefix text, p_count integer default 1)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  prefix text := upper(regexp_replace(coalesce(p_prefix, ''), '[^A-Za-z0-9]', '', 'g'));
  result text[] := '{}';
  candidate text;
  i integer := 0;
begin
  if prefix = '' then prefix := 'SKU'; end if;
  if p_count < 1 or p_count > 100 then raise exception 'p_count must be 1 to 100'; end if;
  while i < p_count loop
    candidate := prefix || '-' || lpad(nextval('public.sku_counter')::text, 4, '0');
    if not exists (select 1 from public.product_variants where sku = candidate) then
      result := result || candidate;
      i := i + 1;
    end if;
  end loop;
  return result;
end;
$$;

revoke all on function public.next_skus(text, integer) from public, anon, authenticated;
grant execute on function public.next_skus(text, integer) to service_role;

-- 4. Super admins are admins everywhere -------------------------------------------
create or replace function public.is_admin_or_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role::text in ('super_admin', 'admin', 'manager')
  );
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role::text in ('super_admin', 'admin', 'manager', 'cashier')
  );
$$;

-- 5. Nobody can promote themselves ---------------------------------------------------
-- The "Users can update own profile" policy lets a user edit their whole row.
-- This trigger blocks role / branch / PIN changes unless they come from the server
-- (service role), the SQL editor, or a super admin.
create or replace function public.guard_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_is_super boolean := false;
begin
  if auth.uid() is null or coalesce(auth.role(), '') = 'service_role' then
    return new; -- SQL editor / server
  end if;

  select exists (select 1 from public.profiles where id = auth.uid() and role::text = 'super_admin')
    into caller_is_super;

  if not caller_is_super and (
       new.role is distinct from old.role
    or new.branch_id is distinct from old.branch_id
    or new.pos_pin is distinct from old.pos_pin
  ) then
    raise exception 'You are not allowed to change role, branch or PIN.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_columns on public.profiles;
create trigger guard_profile_columns
  before update on public.profiles
  for each row execute function public.guard_profile_columns();

-- 6. Close the open policies ------------------------------------------------------------
-- Reading the activity log (contains contact messages, emails, who did what)
drop policy if exists "Admins read activity" on public.activity_log;
drop policy if exists "Admins view activity" on public.activity_log;
-- (kept: "Admins can view activity log" -> is_admin_or_manager())

-- Inserts from a browser. The app now writes these from the server only.
drop policy if exists "Anyone can insert activity" on public.activity_log;
drop policy if exists "Anyone inserts activity" on public.activity_log;
drop policy if exists "Anyone insert email log" on public.email_log;
drop policy if exists "Anyone inserts email log" on public.email_log;
drop policy if exists "Service can insert email log" on public.email_log;
drop policy if exists "Anyone can create orders" on public.orders;
drop policy if exists "Customers can create orders" on public.orders;
drop policy if exists "Anyone can insert order items" on public.order_items;
drop policy if exists "Anyone can insert payments" on public.payments;

-- Staff edits that used "true"
drop policy if exists "Staff can manage inventory" on public.inventory;
drop policy if exists "Admins manage brands" on public.brands;
drop policy if exists "Staff can update orders" on public.orders;
drop policy if exists "Admins can manage variants" on public.product_variants;
drop policy if exists "Admins can manage products" on public.products;

create policy "Admins manage brands" on public.brands
  for all using (public.is_admin_or_manager()) with check (public.is_admin_or_manager());
create policy "Admins can manage variants" on public.product_variants
  for all using (public.is_admin_or_manager()) with check (public.is_admin_or_manager());
create policy "Admins can manage products" on public.products
  for all using (public.is_admin_or_manager()) with check (public.is_admin_or_manager());
create policy "Staff can update orders" on public.orders
  for update using (public.is_admin_or_manager());

-- Duplicate policies
drop policy if exists "Anyone reads brands" on public.brands;
drop policy if exists "Users manage own wishlist" on public.wishlists;
drop policy if exists "Users manage wishlist" on public.wishlists;

-- Branch + profile admin policies that ignored super_admin
drop policy if exists "Only admins can modify branches" on public.branches;
create policy "Only admins can modify branches" on public.branches
  for all using (public.is_admin_or_manager()) with check (public.is_admin_or_manager());

-- 7. Low stock now includes negative stock -------------------------------------------------
create or replace view public.low_stock_alerts as
select i.id, p.name as product_name, pv.name as variant_name, i.branch_id,
       i.quantity, i.low_stock_threshold, pv.sku
from public.inventory i
join public.product_variants pv on pv.id = i.variant_id
join public.products p on p.id = pv.product_id
where i.quantity <= i.low_stock_threshold
  and i.quantity <> 0 -- 0 can mean "not entered yet"; negative or 1..threshold is a real warning
  and p.is_active = true
order by i.quantity;

select 'Stock + security fixes applied' as result;
