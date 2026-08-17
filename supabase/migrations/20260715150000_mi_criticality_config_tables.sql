-- Mechanical Integrity Phase 6 - criticality/risk matrix configuration.

create table if not exists public.mi_criticality_configs (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  config_name text not null,
  scope text not null default 'Company',
  version_number integer not null default 1,
  active boolean not null default false,
  matrix_size integer not null default 5,
  score_method text not null default 'matrix',
  consequence_method text not null default 'maximum',
  likelihood_method text not null default 'maximum',
  consequence_scale_json jsonb not null default '[]'::jsonb,
  likelihood_scale_json jsonb not null default '[]'::jsonb,
  consequence_dimensions_json jsonb not null default '[]'::jsonb,
  likelihood_dimensions_json jsonb not null default '[]'::jsonb,
  category_thresholds_json jsonb not null default '[]'::jsonb,
  review_frequency_json jsonb not null default '{}'::jsonb,
  approval_rules_json jsonb not null default '{}'::jsonb,
  auto_suggestion_rules_json jsonb not null default '{}'::jsonb,
  inspection_priority_mapping_json jsonb not null default '{}'::jsonb,
  scheduler_mapping_json jsonb not null default '{}'::jsonb,
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mi_criticality_config_versions (
  id text primary key default gen_random_uuid()::text,
  config_id text not null references public.mi_criticality_configs(id) on delete cascade,
  company_id text not null,
  site_id text,
  version_number integer not null,
  config_snapshot_json jsonb not null default '{}'::jsonb,
  change_reason text,
  impact_summary_json jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now()
);
