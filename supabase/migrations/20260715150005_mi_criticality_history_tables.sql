-- Mechanical Integrity Phase 6 - criticality history events.

create table if not exists public.mi_criticality_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  equipment_id text not null,
  assessment_id text,
  event_type text not null,
  event_title text not null,
  event_description text,
  before_value_json jsonb,
  after_value_json jsonb,
  source_module text not null default 'MechanicalIntegrityCriticality',
  source_record_id text,
  actor_user_id text,
  created_at timestamptz not null default now()
);
