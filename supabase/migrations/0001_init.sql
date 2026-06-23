-- Pengo Coffee Shop Manager — initial schema
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query),
-- or via the Supabase CLI. Safe to run once on a fresh project.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('manager', 'employee');
create type public.inventory_tx_type as enum ('restock', 'usage', 'adjustment');
create type public.shift_kind as enum ('opening', 'closing', 'anytime');
create type public.completion_status as enum ('todo', 'done');

-- ---------------------------------------------------------------------------
-- Profiles (one row per auth user)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  role       public.app_role not null default 'employee',
  created_at timestamptz not null default now()
);

-- Create a profile automatically when a new auth user signs up.
-- The very first user to sign up becomes the manager; everyone else is an employee.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  is_first boolean;
begin
  select count(*) = 0 into is_first from public.profiles;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when is_first then 'manager'::public.app_role else 'employee'::public.app_role end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used by RLS policies. SECURITY DEFINER avoids recursive RLS checks.
create or replace function public.is_manager()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'manager'
  );
$$;

-- ---------------------------------------------------------------------------
-- Inventory
-- ---------------------------------------------------------------------------
create table public.inventory_items (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  category            text,
  unit                text not null default 'pcs',
  current_qty         numeric not null default 0,
  low_stock_threshold numeric not null default 0,
  cost_per_unit       numeric,
  supplier            text,
  updated_at          timestamptz not null default now()
);

create table public.inventory_transactions (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references public.inventory_items (id) on delete cascade,
  change_qty numeric not null,
  type       public.inventory_tx_type not null,
  note       text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Keep inventory_items.current_qty in sync with the transaction log.
create or replace function public.apply_inventory_tx()
returns trigger
language plpgsql
as $$
begin
  update public.inventory_items
     set current_qty = current_qty + new.change_qty,
         updated_at = now()
   where id = new.item_id;
  return new;
end;
$$;

create trigger on_inventory_tx_insert
  after insert on public.inventory_transactions
  for each row execute function public.apply_inventory_tx();

-- ---------------------------------------------------------------------------
-- Recipes
-- ---------------------------------------------------------------------------
create table public.recipes (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text,
  description  text,
  image_url    text,
  instructions text,
  created_at   timestamptz not null default now()
);

create table public.recipe_ingredients (
  id        uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  item_id   uuid references public.inventory_items (id) on delete set null,
  name      text not null,
  quantity  numeric,
  unit      text
);

-- ---------------------------------------------------------------------------
-- Workflow / checklists
-- ---------------------------------------------------------------------------
create table public.workflow_tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  shift       public.shift_kind not null default 'anytime',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.task_completions (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references public.workflow_tasks (id) on delete cascade,
  business_date date not null default current_date,
  status        public.completion_status not null default 'done',
  completed_by  uuid references public.profiles (id) on delete set null,
  completed_at  timestamptz not null default now(),
  unique (task_id, business_date)
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles              enable row level security;
alter table public.inventory_items       enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.recipes               enable row level security;
alter table public.recipe_ingredients    enable row level security;
alter table public.workflow_tasks        enable row level security;
alter table public.task_completions      enable row level security;

-- Profiles: anyone signed in can read; you can update your own row; managers manage all.
create policy "profiles read"        on public.profiles for select to authenticated using (true);
create policy "profiles update self" on public.profiles for update to authenticated using (id = auth.uid());
create policy "profiles manager all" on public.profiles for all    to authenticated using (public.is_manager()) with check (public.is_manager());

-- Inventory items: all staff read; managers create/update/delete.
create policy "items read"        on public.inventory_items for select to authenticated using (true);
create policy "items manager all" on public.inventory_items for all    to authenticated using (public.is_manager()) with check (public.is_manager());

-- Inventory transactions: all staff read and insert (log restock/usage); managers full control.
create policy "tx read"        on public.inventory_transactions for select to authenticated using (true);
create policy "tx insert"      on public.inventory_transactions for insert to authenticated with check (true);
create policy "tx manager all" on public.inventory_transactions for all    to authenticated using (public.is_manager()) with check (public.is_manager());

-- Recipes: all staff read; managers create/update/delete.
create policy "recipes read"        on public.recipes for select to authenticated using (true);
create policy "recipes manager all" on public.recipes for all    to authenticated using (public.is_manager()) with check (public.is_manager());

create policy "ingredients read"        on public.recipe_ingredients for select to authenticated using (true);
create policy "ingredients manager all" on public.recipe_ingredients for all    to authenticated using (public.is_manager()) with check (public.is_manager());

-- Workflow templates: all staff read; managers manage.
create policy "tasks read"        on public.workflow_tasks for select to authenticated using (true);
create policy "tasks manager all" on public.workflow_tasks for all    to authenticated using (public.is_manager()) with check (public.is_manager());

-- Task completions: all staff read, insert and delete (check / uncheck items).
create policy "completions read"   on public.task_completions for select to authenticated using (true);
create policy "completions insert" on public.task_completions for insert to authenticated with check (true);
create policy "completions delete" on public.task_completions for delete to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Storage bucket for recipe images
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

create policy "recipe images public read"
  on storage.objects for select
  using (bucket_id = 'recipe-images');

create policy "recipe images manager write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'recipe-images' and public.is_manager());

create policy "recipe images manager update"
  on storage.objects for update to authenticated
  using (bucket_id = 'recipe-images' and public.is_manager());

create policy "recipe images manager delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'recipe-images' and public.is_manager());
