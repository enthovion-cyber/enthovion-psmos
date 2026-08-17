-- Mechanical Integrity Phase 4 - inspection scope and CML/TML scope.

create table if not exists public.mi_inspection_plan_scopes (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  plan_id text not null references public.mi_inspection_plans(id) on delete cascade,
  equipment_id text not null references public.mi_equipment(id) on delete cascade,
  scope_statement text null,
  inspection_boundaries text null,
  included_components_json jsonb not null default '[]'::jsonb,
  excluded_components_json jsonb not null default '[]'::jsonb,
  internal_inspection_required boolean not null default false,
  external_inspection_required boolean not null default false,
  online_inspection_allowed boolean not null default true,
  shutdown_required boolean not null default false,
  entry_required boolean not null default false,
  confined_space_required boolean not null default false,
  isolation_required boolean not null default false,
  ptw_required boolean not null default false,
  loto_required boolean not null default false,
  ndt_required boolean not null default false,
  scaffolding_required boolean not null default false,
  insulation_removal_required boolean not null default false,
  cleaning_required boolean not null default false,
  special_safety_precautions text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mi_inspection_plan_scopes_unique unique (plan_id)
);

create table if not exists public.mi_inspection_plan_cml_scope (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  plan_id text not null references public.mi_inspection_plans(id) on delete cascade,
  equipment_id text not null references public.mi_equipment(id) on delete cascade,
  scope_mode text not null default 'none',
  include_all_active_cmls boolean not null default false,
  component_type_filter text null,
  corrosion_zone_filter text null,
  damage_mechanism_filter text null,
  alert_state_filter text null,
  selected_cml_ids_json jsonb null,
  selection_snapshot_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mi_inspection_plan_cml_scope_unique unique (plan_id)
);
