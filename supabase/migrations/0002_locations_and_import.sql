-- Pengo migration 0002 — locations, per-location stock, and data import
-- Run AFTER 0001_init.sql. Paste into Supabase SQL Editor and Run.

-- 1. Locations -------------------------------------------------------------
create table if not exists public.locations (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  name       text not null,
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);
insert into public.locations (code, name, sort_order) values
  ('MV', 'Mission Viejo', 1),
  ('LH', 'Laguna Hills', 2),
  ('LF', 'Lake Forest', 3),
  ('AP', 'Pengo Alicia', 4)
on conflict (code) do update set name = excluded.name, sort_order = excluded.sort_order;

-- 2. Per-location stock counts --------------------------------------------
create table if not exists public.item_stock (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.inventory_items (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete cascade,
  qty         numeric not null default 0,
  updated_at  timestamptz not null default now(),
  unique (item_id, location_id)
);
-- current_qty on inventory_items becomes the TOTAL across locations.
create or replace function public.recompute_item_total()
returns trigger
language plpgsql
as $$
declare
  iid uuid;
begin
  iid := coalesce(new.item_id, old.item_id);
  update public.inventory_items
     set current_qty = coalesce((select sum(qty) from public.item_stock where item_id = iid), 0),
         updated_at = now()
   where id = iid;
  return null;
end;
$$;

drop trigger if exists on_item_stock_change on public.item_stock;
create trigger on_item_stock_change
  after insert or update or delete on public.item_stock
  for each row execute function public.recompute_item_total();

-- Stop the old transaction trigger from also writing current_qty (location
-- counts are now the single source of truth).
drop trigger if exists on_inventory_tx_insert on public.inventory_transactions;

-- 3. Row Level Security ---------------------------------------------------
alter table public.locations  enable row level security;
alter table public.item_stock enable row level security;

drop policy if exists "locations read"        on public.locations;
drop policy if exists "locations manager all" on public.locations;
create policy "locations read"        on public.locations  for select to authenticated using (true);
create policy "locations manager all" on public.locations  for all    to authenticated using (public.is_manager()) with check (public.is_manager());

-- Any signed-in staff member can read and update stock counts for their location.
drop policy if exists "stock read"   on public.item_stock;
drop policy if exists "stock insert" on public.item_stock;
drop policy if exists "stock update" on public.item_stock;
drop policy if exists "stock delete" on public.item_stock;
create policy "stock read"   on public.item_stock for select to authenticated using (true);
create policy "stock insert" on public.item_stock for insert to authenticated with check (true);
create policy "stock update" on public.item_stock for update to authenticated using (true) with check (true);
create policy "stock delete" on public.item_stock for delete to authenticated using (true);

-- 4. Import items from the Master Check List ------------------------------
-- Re-runnable: clears previously imported rows first.
delete from public.inventory_items where supplier in ('Costco','Restaurant Depot','Monin','Lollicup','Le Chef');

with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Strawberry', 'Fruit', 'Costco', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',12),('LH',8),('LF',2),('AP',8)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Raspberry', 'Fruit', 'Costco', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',2),('LF',1),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Mango', 'Fruit', 'Costco', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',6),('LH',1),('LF',0),('AP',2)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Kiwi', 'Fruit', 'Costco', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',2),('LF',2),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Pineapple', 'Fruit', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',8),('LH',5),('LF',2),('AP',3)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Peach', 'Fruit', 'Costco', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',2),('LH',2),('LF',2),('AP',2)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Dragon Fruit', 'Fruit', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',8),('LH',2),('LF',6),('AP',3)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Lime Juice', 'Fruit', 'Costco', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',1),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Lemon', 'Fruit', 'Costco', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Orange', 'Fruit', 'Costco', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Avocado', 'Fruit', 'Costco', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',1),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Watermelon', 'Fruit', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',12),('LH',6),('LF',5),('AP',6)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Banana', 'Fruit', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',1),('LF',1),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('2% Milk', 'Dairy', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',6),('LH',8),('LF',0),('AP',6)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Mocha Mix', 'Dairy', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',2),('LH',4),('LF',5),('AP',5)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Half & Half', 'Dairy', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',8),('LH',4),('LF',5),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Heavy Cream', 'Dairy', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',7),('LH',4),('LF',1),('AP',2)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Almond Milk', 'Dairy', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',1),('LF',1),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Soy Milk', 'Dairy', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',12),('LH',2),('LF',0),('AP',3)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Coconut Milk', 'Dairy', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Oat Milk', 'Dairy', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',4),('AP',4)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Hazelnut Creamer', 'Dairy', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',1),('LF',0),('AP',3)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Yogurt', 'Dairy', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',6),('LH',3),('LF',1),('AP',3)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Apple Juice', 'Juice', 'Costco', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',12),('LH',4),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Mango Juice', 'Juice', 'Costco', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Lemonade Juice', 'Juice', 'Costco', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',4),('LF',2),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Hershey Chocolate', 'Misc', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',4),('LH',2),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Oreo Cookie', 'Misc', 'Costco', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',5),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Sparkling Water', 'Misc', 'Costco', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',11),('LH',0),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Vanilla Coffee', 'Misc', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',7),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('French Roast Coffee', 'Misc', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Matcha Powder', 'Misc', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',1),('LH',1),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Honey', 'Misc', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',6),('LF',0),('AP',6)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Vanilla Extract', 'Misc', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',1),('LH',1),('LF',6),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Salt', 'Misc', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Vanilla Protein Powder', 'Misc', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',1),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Chia Seeds', 'Misc', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',2),('LH',0),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Toilet Paper (Small) - MV', 'Restroom/Cleaning', 'Costco', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Toilet Paper (Big)', 'Restroom/Cleaning', 'Costco', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',1),('LF',1),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Hand Soap', 'Restroom/Cleaning', 'Costco', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',1),('LH',0),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Seat Cover', 'Restroom/Cleaning', 'Costco', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',1),('LH',0),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Toilet Bowl Cleaner', 'Restroom/Cleaning', 'Costco', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',1),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Trash Bag', 'Restroom/Cleaning', 'Costco', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',1),('LH',0),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Dish Soap', 'Restroom/Cleaning', 'Costco', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Fabulosa', 'Restroom/Cleaning', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',1),('LF',0),('AP',2)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Sanitizer', 'Restroom/Cleaning', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Windex', 'Restroom/Cleaning', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',1),('LH',0),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Simple Green', 'Restroom/Cleaning', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Clorox', 'Restroom/Cleaning', 'Costco', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',1),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Mocha Mix', null, 'Restaurant Depot', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',2),('LH',4),('LF',5),('AP',5)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Egg Yolks', null, 'Restaurant Depot', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',3),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Mint', null, 'Restaurant Depot', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',1),('LH',0),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Lime Juice', null, 'Restaurant Depot', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',1),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('FR Straw Bag', null, 'Restaurant Depot', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',2),('LF',0),('AP',2)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('FR Mango Bag', null, 'Restaurant Depot', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',2),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('FR Pineapple', null, 'Restaurant Depot', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',1),('LH',3),('LF',0),('AP',2)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('IC Vanilla', null, 'Restaurant Depot', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',7),('LF',3),('AP',8)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('White Sugar', null, 'Restaurant Depot', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',6),('LF',0),('AP',6)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Brown Sugar', null, 'Restaurant Depot', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',3),('LF',5),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Garlic Fries', null, 'Restaurant Depot', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',5)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Sweet Potato Fries', null, 'Restaurant Depot', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',6),('AP',4)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Popcorn Chicken', null, 'Restaurant Depot', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',8)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Calamari', null, 'Restaurant Depot', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',2),('LH',0),('LF',2),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Sweet Chili Sauce', null, 'Restaurant Depot', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',1),('LH',0),('LF',1),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Buffalo Sauce', null, 'Restaurant Depot', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',1),('LH',0),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Spicy Mayo', null, 'Restaurant Depot', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Korean BBQ Sauce', null, 'Restaurant Depot', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',1),('LH',0),('LF',1),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Kethchup', null, 'Restaurant Depot', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Ranch', null, 'Restaurant Depot', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Pumpkin', 'Syrup', 'Monin', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',3),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Coconut', 'Syrup', 'Monin', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Chai', 'Syrup', 'Monin', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Strawberry', 'Syrup', 'Monin', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',11),('LH',12),('LF',0),('AP',7)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Raspberry', 'Syrup', 'Monin', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',6),('LH',8),('LF',9),('AP',2)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Blue Curacao', 'Syrup', 'Monin', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',6),('LH',6),('LF',8),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Mango', 'Syrup', 'Monin', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',7),('LH',5),('LF',3),('AP',6)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Kiwi', 'Syrup', 'Monin', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',2),('LF',0),('AP',2)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Pineapple', 'Syrup', 'Monin', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',4),('LH',2),('LF',1),('AP',3)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Peach', 'Syrup', 'Monin', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',5),('LF',1),('AP',2)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Passion Fruit', 'Syrup', 'Monin', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',3),('LH',3),('LF',1),('AP',3)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Dragon Fruit', 'Syrup', 'Monin', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',6),('LH',3),('LF',4),('AP',3)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Boba', null, 'Lollicup', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',7),('LH',4),('LF',0),('AP',2)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Strawberry Popping Boba', null, 'Lollicup', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',5),('LF',0),('AP',4)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Aloe Vera', null, 'Lollicup', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',5),('LH',0),('LF',5),('AP',3)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Rainbow Jelly', null, 'Lollicup', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',4),('LH',4),('LF',6),('AP',5)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Rainbow Popping', null, 'Lollicup', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',5),('LF',6),('AP',3)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Coffee Jelly', null, 'Lollicup', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',3),('LH',4),('LF',1),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Lychee Jelly', null, 'Lollicup', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',8),('LH',2),('LF',0),('AP',3)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Crystal Boba', null, 'Lollicup', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',4),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Dark Brown Sugar', null, 'Lollicup', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',4),('LH',4),('LF',2),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Jasmine Green Tea', null, 'Lollicup', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',2),('LH',1),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Red (Black) Tea', null, 'Lollicup', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Thai Tea', null, 'Lollicup', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Non-Dairy Creamer', null, 'Lollicup', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Taro Mix', null, 'Lollicup', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',2),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Sea Salt Powder', null, 'Lollicup', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',6),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Custard Pudding', null, 'Lollicup', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',2)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Milk Pudding', null, 'Lollicup', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',1),('LH',1),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Disposable Gloves', null, 'Lollicup', 'Unit', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',2),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Aqua Color Straw', null, 'Lollicup', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',6),('LH',3),('LF',5),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Small Straw', null, 'Lollicup', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',1),('LH',1),('LF',4),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('1-Cup Holder Bags', null, 'Lollicup', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',1),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('2-Cup Holder Bags', null, 'Lollicup', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',1),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('4-Cup Holder Bags', null, 'Lollicup', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Hot Drink Cup', null, 'Lollicup', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',1),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Hot Drink Lid', null, 'Lollicup', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',1),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Napkins', null, 'Lollicup', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',1),('LH',0),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Paper Towel (Fold)', null, 'Lollicup', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',1),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Paper Towel Roll', null, 'Lollicup', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Chocolate Mousse Cup', 'Bakery', 'Le Chef', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',7),('LH',2),('LF',2),('AP',2)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Cheesecake Bite', 'Bakery', 'Le Chef', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',2),('LH',0),('LF',2),('AP',2)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Tiramisu Cup', 'Bakery', 'Le Chef', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',3),('LF',2),('AP',2)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Strawberry Tres Leches', 'Bakery', 'Le Chef', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',1),('LH',1),('LF',0),('AP',2)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Cappuccino Hazelnut Cup', 'Bakery', 'Le Chef', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',2)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Chocolate Chip Cookie', 'Bakery', 'Le Chef', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Chocolate Brownie', 'Bakery', 'Le Chef', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('S''more Bar', 'Bakery', 'Le Chef', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Strawberry Croissant', 'Bakery', 'Le Chef', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',1),('LH',0),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Chocolate Croissant', 'Bakery', 'Le Chef', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Fantasy Chocolate Cake', 'Bakery', 'Le Chef', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Tiramisu Cake', 'Bakery', 'Le Chef', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Cheese Danish', 'Bakery', 'Le Chef', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Brioche', 'Bakery', 'Le Chef', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',1),('AP',1)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Pretzel', 'Bakery', 'Le Chef', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',1),('LH',0),('LF',1),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
with ni as (
  insert into public.inventory_items (name, category, supplier, unit, low_stock_threshold)
  values ('Ciabatta', 'Bakery', 'Le Chef', 'Case', 3) returning id
)
insert into public.item_stock (item_id, location_id, qty)
select ni.id, l.id, s.qty from ni
  join (values ('MV',0),('LH',0),('LF',0),('AP',0)) as s(code, qty) on true
  join public.locations l on l.code = s.code;
