-- Mechanical Integrity Phase 3 - technical data revision workflow.

alter table public.mi_equipment_technical_data
  add column if not exists operating_mode text null,
  add column if not exists process_service text null,
  add column if not exists internal_coating text null,
  add column if not exists external_coating text null,
  add column if not exists damage_mechanisms text[] null,
  add column if not exists corrosion_loop text null,
  add column if not exists geometry_json jsonb not null default '{}'::jsonb,
  add column if not exists code_rating_json jsonb not null default '{}'::jsonb,
  add column if not exists relief_protection_json jsonb not null default '{}'::jsonb,
  add column if not exists drawings_json jsonb not null default '{}'::jsonb,
  add column if not exists safety_critical_json jsonb not null default '{}'::jsonb,
  add column if not exists custom_fields_json jsonb not null default '{}'::jsonb,
  add column if not exists completeness_status text not null default 'Incomplete',
  add column if not exists completeness_score numeric(5,2) not null default 0,
  add column if not exists revised_by text null,
  add column if not exists revision_reason text null;

create table if not exists public.mi_equipment_technical_data_revisions (
  id text primary key default gen_random_uuid()::text,
  equipment_id text not null references public.mi_equipment(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  revision_number integer not null,
  change_reason text not null,
  changed_fields text[] not null default '{}'::text[],
  before_value_json jsonb null,
  after_value_json jsonb null,
  impact_json jsonb not null default '{}'::jsonb,
  created_by text null,
  created_at timestamptz not null default now(),
  constraint mi_equipment_technical_data_revisions_unique unique (equipment_id, revision_number)
);
