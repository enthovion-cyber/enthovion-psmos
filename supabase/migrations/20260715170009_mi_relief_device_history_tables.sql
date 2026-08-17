create table if not exists public.mi_relief_device_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  relief_device_id text references public.mi_relief_devices(id) on delete cascade,
  equipment_id text references public.mi_equipment(id) on delete set null,
  event_type text not null,
  event_title text not null,
  event_description text,
  related_record_type text,
  related_record_id text,
  actor_user_id text,
  before_values_json jsonb,
  after_values_json jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
