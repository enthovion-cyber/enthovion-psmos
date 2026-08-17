create table if not exists public.mi_relief_device_import_jobs (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  file_name text,
  import_type text not null default 'Relief Device',
  status text not null default 'Uploaded',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  invalid_rows integer not null default 0,
  committed_rows integer not null default 0,
  uploaded_by text,
  committed_by text,
  committed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mi_relief_device_import_rows (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  job_id text not null references public.mi_relief_device_import_jobs(id) on delete cascade,
  row_number integer not null,
  raw_data_json jsonb not null default '{}'::jsonb,
  normalized_data_json jsonb not null default '{}'::jsonb,
  validation_status text not null default 'Pending',
  validation_errors_json jsonb not null default '[]'::jsonb,
  committed_record_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
