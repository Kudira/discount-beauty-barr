# Old SQL files (history only)

These are the scripts used to build the database over time. **Do not run them
again on the live database.** Several of them create wide-open policies (for
example `with check (true)`), which `supabase-stock-and-security-fixes.sql`
(in the project root) removes on purpose. Running one of these afterwards would
bring the holes back.

The live database in Supabase is the source of truth.
