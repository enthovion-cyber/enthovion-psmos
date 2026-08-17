create table if not exists public.mi_relief_device_occurrences (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  relief_device_id text not null references public.mi_relief_devices(id) on delete cascade,
  equipment_id text references public.mi_equipment(id) on delete set null,
  occurrence_number text not null,
  due_date date not null,
  due_basis text,
  status text not null default 'Scheduled',
  completed_test_id text,
  completed_at timestamptz,
  completed_by text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
