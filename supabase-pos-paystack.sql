-- ============================================================
-- POS PIN login + Paystack — run once in Supabase SQL Editor
-- ============================================================

-- ── 1. Check for staff sharing a PIN ─────────────────────────
-- Run this SELECT first. If it returns rows, give those people
-- new PINs in Admin → Team, then run step 2.
select pos_pin, string_agg(coalesce(full_name, email), ', ') as shared_by
from public.profiles
where pos_pin is not null
group by pos_pin
having count(*) > 1;

-- ── 2. One PIN per person ────────────────────────────────────
create unique index if not exists profiles_pos_pin_unique
  on public.profiles (pos_pin)
  where pos_pin is not null;

-- ── 3. Faster activity lookups (PIN lockout + Activity tab) ──
create index if not exists idx_activity_log_action_created
  on public.activity_log (action, created_at desc);

-- ── 4. Faster payment lookups by Paystack reference ──────────
create index if not exists idx_payments_order on public.payments (order_id);
