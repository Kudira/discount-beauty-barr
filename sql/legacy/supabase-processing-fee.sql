-- ============================================================================
-- DISCOUNT BEAUTY BARR - 1.95% card / mobile money processing fee
-- Run once in the Supabase SQL Editor (before or right after deploying).
-- Safe to re-run.
--
-- Orders keep the fee in its own column so reports can separate it from sales.
-- orders.total already INCLUDES the fee (it is what the customer paid).
--   goods and delivery  = total - processing_fee
-- ============================================================================
alter table public.orders
  add column if not exists processing_fee numeric(10,2) not null default 0;

-- Check: orders that carried a fee
select order_number, subtotal, delivery_fee, discount, processing_fee, total, created_at
from public.orders
where processing_fee > 0
order by created_at desc
limit 20;
