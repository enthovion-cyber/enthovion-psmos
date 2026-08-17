-- Mechanical Integrity Phase 1 - history and audit foundation.

create table if not exists public.mi_equipment_history_events (
  id text primary key default gen_random_uuid()::text,
  equipment_id text null,
  company_id text not null,
  site_id text not null,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  source_module text null,
  source_record_id text null,
  actor_user_id text null,
  created_at timestamptz not null default now()
);

create table if not exists public.mi_equipment_audit_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text null,
  equipment_id text null,
  actor_user_id text null,
  action text not null,
  target_type text null,
  target_id text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  ip_address text null,
  user_agent text null,
  created_at timestamptz not null default now()
);
