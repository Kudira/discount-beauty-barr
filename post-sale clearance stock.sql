-- ============================================================================
-- AFTER THE CLEARANCE SALE: keep clearance-only products and give them stock
-- Run in the Supabase SQL Editor AFTER the sale closes (19 Oct 2026, 23:59:59).
-- Nothing in this file changes anything until the sale has ended.
--
-- What it does
--   A clearance product is treated as "already in the shops" when a LIVE shop
--   product (is_active = true, not a CLR- product) has the same brand and a
--   matching name. Those are left completely alone.
--   Every other clearance product is KEPT (it stays in Admin > Products) and
--   gets stock of 5 at EVERY active branch. You adjust from Admin > Inventory.
--
-- Safe rules
--   - It never lowers or overwrites stock someone has already entered:
--     only branches with no stock record, or a record at 0, are set to 5.
--   - Products stay hidden from the shop (is_active stays false). Publishing is
--     a separate choice, see the optional step at the bottom.
--   - Safe to run twice.
--
-- Do these in order: STEP 1 (look), STEP 2 (skip list, optional), STEP 3 (apply).
-- ============================================================================

-- STEP 1: REVIEW -------------------------------------------------------------
-- Every clearance variant, with the shop product it matched (if any).
-- "matched_shop_product" empty = will be kept and given stock.
-- If a row says empty but you DO sell it in the shops (different spelling), put
-- its SKU in the skip list in STEP 3. If one matched wrongly, nothing to do:
-- it is only skipped, never changed.
with clr as (
  select pv.id as variant_id, pv.sku, p.name, p.brand, p.is_active,
         regexp_replace(lower(p.brand), '[^a-z0-9]', '', 'g') as nbrand,
         regexp_replace(lower(p.name),  '[^a-z0-9]', '', 'g') as nname
  from public.product_variants pv
  join public.products p on p.id = pv.product_id
  where pv.sku like 'CLR-%'
),
shop as (
  select p.id, p.name,
         regexp_replace(lower(p.brand), '[^a-z0-9]', '', 'g') as nbrand,
         regexp_replace(lower(p.name),  '[^a-z0-9]', '', 'g') as nname
  from public.products p
  where p.is_active = true
    and not exists (select 1 from public.product_variants x where x.product_id = p.id and x.sku like 'CLR-%')
)
select c.sku, c.brand, c.name as clearance_name,
       (select string_agg(s.name, ' | ') from shop s
         where s.nbrand = c.nbrand
           and (s.nname like '%' || c.nname || '%' or c.nname like '%' || s.nname || '%')) as matched_shop_product
from clr c
order by (select count(*) from shop s
           where s.nbrand = c.nbrand
             and (s.nname like '%' || c.nname || '%' or c.nname like '%' || s.nname || '%')) desc,
         c.sku;

-- STEP 2: YOUR SKIP LIST (optional) ------------------------------------------
-- Clearance SKUs you already sell in the shops under a different name, e.g.
-- ('CLR-007'), ('CLR-023'). Leave the single dummy row if there are none.
-- Paste the same list into STEP 3 below.

-- STEP 3: APPLY ----------------------------------------------------------------
-- Quantity is 5 per branch. Change both "5"s if you want a different number.
-- Replace 'NONE' in the skip list below with your SKUs from STEP 2.

-- 3a. Branches that already have a stock record sitting at 0 -> 5
with ended as (
  select 1 from public.sale_campaigns where slug = 'october-clearance' and ends_at < now()
),
targets as (
  select pv.id as variant_id
  from public.product_variants pv
  join public.products p on p.id = pv.product_id
  where pv.sku like 'CLR-%'
    and pv.sku not in ('NONE')
    and not exists (
      select 1 from public.products s
      where s.is_active = true
        and s.id <> p.id
        and not exists (select 1 from public.product_variants x where x.product_id = s.id and x.sku like 'CLR-%')
        and regexp_replace(lower(s.brand), '[^a-z0-9]', '', 'g') = regexp_replace(lower(p.brand), '[^a-z0-9]', '', 'g')
        and (regexp_replace(lower(s.name), '[^a-z0-9]', '', 'g') like '%' || regexp_replace(lower(p.name), '[^a-z0-9]', '', 'g') || '%'
          or regexp_replace(lower(p.name), '[^a-z0-9]', '', 'g') like '%' || regexp_replace(lower(s.name), '[^a-z0-9]', '', 'g') || '%')
    )
)
update public.inventory i
set quantity = 5
where i.quantity = 0
  and i.variant_id in (select variant_id from targets)
  and i.branch_id in (select id from public.branches where is_active = true)
  and exists (select 1 from ended);

-- 3b. Branches with no stock record at all -> create it with 5
with ended as (
  select 1 from public.sale_campaigns where slug = 'october-clearance' and ends_at < now()
),
targets as (
  select pv.id as variant_id
  from public.product_variants pv
  join public.products p on p.id = pv.product_id
  where pv.sku like 'CLR-%'
    and pv.sku not in ('NONE')
    and not exists (
      select 1 from public.products s
      where s.is_active = true
        and s.id <> p.id
        and not exists (select 1 from public.product_variants x where x.product_id = s.id and x.sku like 'CLR-%')
        and regexp_replace(lower(s.brand), '[^a-z0-9]', '', 'g') = regexp_replace(lower(p.brand), '[^a-z0-9]', '', 'g')
        and (regexp_replace(lower(s.name), '[^a-z0-9]', '', 'g') like '%' || regexp_replace(lower(p.name), '[^a-z0-9]', '', 'g') || '%'
          or regexp_replace(lower(p.name), '[^a-z0-9]', '', 'g') like '%' || regexp_replace(lower(s.name), '[^a-z0-9]', '', 'g') || '%')
    )
)
insert into public.inventory (variant_id, branch_id, quantity, low_stock_threshold)
select t.variant_id, b.id, 5, 5
from targets t
cross join public.branches b
where b.is_active = true
  and exists (select 1 from ended)
  and not exists (
    select 1 from public.inventory i where i.variant_id = t.variant_id and i.branch_id = b.id
  );

-- 3c. Check the result. Before the sale ends this shows 0 rows (nothing ran).
select pv.sku, p.brand, p.name, i.branch_id, i.quantity
from public.inventory i
join public.product_variants pv on pv.id = i.variant_id
join public.products p on p.id = pv.product_id
where pv.sku like 'CLR-%'
order by pv.sku, i.branch_id;

-- OPTIONAL: put the kept clearance products on the live shop --------------------
-- Not run by default: they have no photos yet and the shop would show them.
-- To publish one, in Admin > Products open it and switch it on, or run:
--   update public.products set is_active = true
--   where id in (select product_id from public.product_variants where sku in ('CLR-001','CLR-002'));
