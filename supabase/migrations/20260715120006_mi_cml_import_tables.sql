-- Mechanical Integrity Phase 3 - CML/TML import jobs.

create table if not exists public.mi_cml_import_jobs (
  id text primary key default gen_random_uuid()::text,
  equipment_id text not null references public.mi_equipment(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  import_type text not null,
  file_name text null,
  status text not null default 'Draft',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  error_rows integer not null default 0,
  created_by text null,
  committed_by text null,
  committed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mi_cml_import_rows (
  id text primary key default gen_random_uuid()::text,
  job_id text not null references public.mi_cml_import_jobs(id) on delete cascade,
  row_number integer not null,
  row_json jsonb not null default '{}'::jsonb,
  validation_status text not null default 'Pending',
  validation_errors text[] not null default '{}'::text[],
  created_record_id text null,
  created_at timestamptz not null default now()
);
