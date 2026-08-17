create table if not exists public.mi_safeguard_impairment_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  impairment_id text not null,
  equipment_id text,
  safeguard_type text,
  safeguard_id text,
  event_type text not null,
  event_title text not null,
  event_description text,
  before_value_json jsonb,
  after_value_json jsonb,
  actor_user_id text,
  source_module text not null default 'Mechanical Integrity',
  source_record_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.mi_safeguard_impairment_import_jobs (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  uploaded_by text not null,
  file_name text not null,
  file_key text,
  status text not null default 'Uploaded',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  error_rows integer not null default 0,
  created_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  error_report_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mi_safeguard_impairment_import_rows (
  id text primary key default gen_random_uuid()::text,
  job_id text not null references public.mi_safeguard_impairment_import_jobs(id) on delete cascade,
  row_number integer not null,
  raw_data_json jsonb not null default '{}'::jsonb,
  normalized_data_json jsonb not null default '{}'::jsonb,
  validation_status text not null default 'Pending',
  validation_errors_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
