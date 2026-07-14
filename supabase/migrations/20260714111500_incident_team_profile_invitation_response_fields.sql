alter table if exists public.incident_team_notifications
  add column if not exists responded_at timestamptz,
  add column if not exists decline_reason text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_incident_team_notifications_member_type_status
  on public.incident_team_notifications(tenant_id, member_id, notification_type, status);
