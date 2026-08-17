create table if not exists public.mi_safeguard_import_jobs (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  import_type text not null,
  uploaded_by text,
  file_name text,
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

create table if not exists public.mi_safeguard_import_rows (
  id text primary key default gen_random_uuid()::text,
  job_id text not null references public.mi_safeguard_import_jobs(id) on delete cascade,
  row_number integer not null,
  raw_data_json jsonb not null default '{}'::jsonb,
  normalized_data_json jsonb not null default '{}'::jsonb,
  validation_status text not null default 'Pending',
  validation_errors_json jsonb not null default '[]'::jsonb,
  created_record_id text,
  updated_record_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
