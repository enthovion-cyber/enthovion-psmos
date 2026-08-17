-- Mechanical Integrity Phase 5 - inspection/UT reading import jobs.

create table if not exists public.mi_inspection_record_import_jobs (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Company"(id) on delete cascade,
  site_id text not null references public."Site"(id) on delete cascade,
  equipment_id text null references public.mi_equipment(id) on delete cascade,
  inspection_record_id text null references public.mi_inspection_records(id) on delete set null,
  import_type text not null default 'UT Readings',
  uploaded_by text not null,
  file_name text null,
  file_key text null,
  status text not null default 'Uploaded',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  error_rows integer not null default 0,
  created_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  error_report_key text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mi_inspection_record_import_rows (
  id text primary key default gen_random_uuid()::text,
  job_id text not null references public.mi_inspection_record_import_jobs(id) on delete cascade,
  row_number integer not null,
  raw_data_json jsonb not null default '{}'::jsonb,
  normalized_data_json jsonb not null default '{}'::jsonb,
  validation_status text not null default 'Pending',
  validation_errors_json jsonb not null default '[]'::jsonb,
  created_record_id text null,
  updated_record_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
