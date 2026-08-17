-- Mechanical Integrity Phase 6 - criticality import jobs.

create table if not exists public.mi_criticality_import_jobs (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  file_name text,
  file_key text,
  status text not null default 'Uploaded',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  error_rows integer not null default 0,
  created_count integer not null default 0,
  updated_count integer not null default 0,
  uploaded_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mi_criticality_import_rows (
  id text primary key default gen_random_uuid()::text,
  job_id text not null references public.mi_criticality_import_jobs(id) on delete cascade,
  row_number integer not null,
  raw_data_json jsonb not null default '{}'::jsonb,
  normalized_data_json jsonb not null default '{}'::jsonb,
  validation_status text not null default 'Pending',
  validation_errors_json jsonb not null default '[]'::jsonb,
  created_assessment_id text,
  updated_assessment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
