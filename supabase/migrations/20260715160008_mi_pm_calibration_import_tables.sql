-- Mechanical Integrity Phase 7 - PM/calibration import jobs and history.

create table if not exists public.mi_pm_calibration_import_jobs (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  import_type text not null,
  file_name text,
  file_key text,
  status text not null default 'Uploaded',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  error_rows integer not null default 0,
  uploaded_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mi_pm_calibration_import_rows (
  id text primary key default gen_random_uuid()::text,
  job_id text not null references public.mi_pm_calibration_import_jobs(id) on delete cascade,
  row_number integer not null,
  row_json jsonb not null default '{}'::jsonb,
  validation_status text not null default 'Pending',
  validation_errors_json jsonb not null default '[]'::jsonb,
  created_record_id text,
  updated_record_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mi_pm_calibration_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  equipment_id text not null,
  plan_id text,
  record_id text,
  occurrence_id text,
  event_type text not null,
  event_title text not null,
  event_description text,
  before_value_json jsonb,
  after_value_json jsonb,
  actor_user_id text,
  source_module text not null default 'MechanicalIntegrityPmCalibration',
  source_record_id text,
  created_at timestamptz not null default now()
);
