create extension if not exists "pgcrypto";

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists phases (
  id text primary key,
  name text not null,
  priority text not null,
  planned_start date,
  planned_end date,
  created_at timestamptz not null default now()
);

create table if not exists timeline_entries (
  id uuid primary key default gen_random_uuid(),
  phase text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id text primary key,
  payload jsonb not null,
  amount numeric generated always as ((payload->>'amount')::numeric) stored,
  date date generated always as ((payload->>'date')::date) stored,
  created_at timestamptz not null default now()
);

create table if not exists materials (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists laborers (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists vendors (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists site_progress (
  id bigint primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id bigint primary key,
  payload jsonb not null,
  file_path text,
  created_at timestamptz not null default now()
);

create table if not exists cashflow (
  id bigint primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists custom_lists (
  id uuid primary key default gen_random_uuid(),
  list_key text not null,
  option_value text not null,
  created_at timestamptz not null default now(),
  unique (list_key, option_value)
);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  due_at timestamptz not null,
  status text not null default 'pending',
  source_module text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  action text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create table if not exists boq_items (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists running_bills (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists change_orders (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists snag_items (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists payment_events (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists bank_reconcile_entries (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

