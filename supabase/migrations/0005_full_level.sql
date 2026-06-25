-- Pengo migration 0005 — per-item "full" (par) level for double-tap restock.
-- Run AFTER 0004. Safe to run more than once.

alter table public.inventory_items
  add column if not exists full_level numeric not null default 0;

-- Start every item at a sensible default the manager can tune per item.
update public.inventory_items set full_level = 6 where full_level = 0;
