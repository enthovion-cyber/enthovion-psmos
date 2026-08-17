create table if not exists public.mi_work_order_history_events (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public."Tenant"("id") on delete cascade,
  site_id text not null,
  work_order_id uuid not null references public.mi_work_orders(id) on delete cascade,
  equipment_id text null,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text not null,
  source_module text null,
  source_record_id text null,
  created_at timestamptz not null default now()
);

create table if not exists public.mi_work_order_import_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public."Tenant"("id") on delete cascade,
  site_id text null,
  uploaded_by text not null,
  file_name text not null,
  file_key text not null,
  status text not null default 'Pending',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  error_rows integer not null default 0,
  created_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  error_report_key text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mi_work_order_import_jobs_status_check check (status in ('Pending','Processing','Completed','Completed With Errors','Failed','Cancelled'))
);
