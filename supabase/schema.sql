create extension if not exists "pgcrypto";

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  company text,
  designation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists phases (
  id text primary key,
  user_id uuid not null,
  name text not null,
  priority text not null,
  planned_start date,
  planned_end date,
  created_at timestamptz not null default now()
);

create table if not exists timeline_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  phase text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id text primary key,
  user_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists materials (
  id text primary key,
  user_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists other_debts (
  id text primary key,
  user_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists laborers (
  id text primary key,
  user_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists vendors (
  id text primary key,
  user_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists site_progress (
  id bigint primary key,
  user_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id bigint primary key,
  user_id uuid not null,
  payload jsonb not null,
  file_path text,
  created_at timestamptz not null default now()
);

create table if not exists cashflow (
  id bigint primary key,
  user_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists custom_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  list_key text not null,
  option_value text not null,
  created_at timestamptz not null default now(),
  unique (user_id, list_key, option_value)
);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  due_at timestamptz not null,
  status text not null default 'pending',
  source_module text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create table if not exists boq_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists running_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists change_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists snag_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists payment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists bank_reconcile_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table projects enable row level security;
alter table profiles enable row level security;
alter table phases enable row level security;
alter table timeline_entries enable row level security;
alter table expenses enable row level security;
alter table materials enable row level security;
alter table other_debts enable row level security;
alter table laborers enable row level security;
alter table vendors enable row level security;
alter table site_progress enable row level security;
alter table documents enable row level security;
alter table cashflow enable row level security;
alter table custom_lists enable row level security;
alter table reminders enable row level security;
alter table audit_events enable row level security;
alter table boq_items enable row level security;
alter table purchase_orders enable row level security;
alter table running_bills enable row level security;
alter table change_orders enable row level security;
alter table snag_items enable row level security;
alter table payment_events enable row level security;
alter table bank_reconcile_entries enable row level security;

drop policy if exists owner_full_access_projects on projects;
create policy owner_full_access_projects on projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists owner_full_access_profiles on profiles;
create policy owner_full_access_profiles on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists owner_full_access_phases on phases;
create policy owner_full_access_phases on phases for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists owner_full_access_timeline_entries on timeline_entries;
create policy owner_full_access_timeline_entries on timeline_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists owner_full_access_expenses on expenses;
create policy owner_full_access_expenses on expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists owner_full_access_materials on materials;
create policy owner_full_access_materials on materials for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists owner_full_access_other_debts on other_debts;
create policy owner_full_access_other_debts on other_debts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists owner_full_access_laborers on laborers;
create policy owner_full_access_laborers on laborers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists owner_full_access_vendors on vendors;
create policy owner_full_access_vendors on vendors for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists owner_full_access_site_progress on site_progress;
create policy owner_full_access_site_progress on site_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists owner_full_access_documents on documents;
create policy owner_full_access_documents on documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists owner_full_access_cashflow on cashflow;
create policy owner_full_access_cashflow on cashflow for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists owner_full_access_custom_lists on custom_lists;
create policy owner_full_access_custom_lists on custom_lists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists owner_full_access_reminders on reminders;
create policy owner_full_access_reminders on reminders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists owner_full_access_audit_events on audit_events;
create policy owner_full_access_audit_events on audit_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists owner_full_access_boq_items on boq_items;
create policy owner_full_access_boq_items on boq_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists owner_full_access_purchase_orders on purchase_orders;
create policy owner_full_access_purchase_orders on purchase_orders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists owner_full_access_running_bills on running_bills;
create policy owner_full_access_running_bills on running_bills for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists owner_full_access_change_orders on change_orders;
create policy owner_full_access_change_orders on change_orders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists owner_full_access_snag_items on snag_items;
create policy owner_full_access_snag_items on snag_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists owner_full_access_payment_events on payment_events;
create policy owner_full_access_payment_events on payment_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists owner_full_access_bank_reconcile_entries on bank_reconcile_entries;
create policy owner_full_access_bank_reconcile_entries on bank_reconcile_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

