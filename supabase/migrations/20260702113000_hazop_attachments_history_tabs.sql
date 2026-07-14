alter table if exists public.hazop_attachments
  add column if not exists company_id text,
  add column if not exists site_id text,
  add column if not exists original_file_name text,
  add column if not exists mime_type text,
  add column if not exists storage_provider text default 'supabase',
  add column if not exists storage_key text,
  add column if not exists storage_url text,
  add column if not exists linked_section text default 'General',
  add column if not exists linked_node_id text,
  add column if not exists linked_scenario_id text,
  add column if not exists linked_recommendation_id text,
  add column if not exists linked_safeguard_id text,
  add column if not exists linked_session_id text,
  add column if not exists linked_record_id text,
  add column if not exists visibility text default 'Study Team',
  add column if not exists review_required boolean default false,
  add column if not exists review_status text default 'Not Required',
  add column if not exists version integer default 1,
  add column if not exists parent_attachment_id text,
  add column if not exists tags text[] default '{}',
  add column if not exists checksum text,
  add column if not exists scan_status text default 'Not Scanned',
  add column if not exists archived_by text,
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_by text,
  add column if not exists deleted_at timestamptz,
  add column if not exists updated_at timestamptz default now();

update public.hazop_attachments
set
  original_file_name = coalesce(original_file_name, file_name),
  mime_type = coalesce(mime_type, file_type),
  storage_key = coalesce(storage_key, storage_path),
  linked_section = coalesce(linked_section, 'General'),
  review_status = coalesce(review_status, case when review_required then 'Pending Review' else 'Not Required' end),
  visibility = coalesce(visibility, 'Study Team'),
  version = coalesce(version, 1),
  tags = coalesce(tags, '{}'),
  scan_status = coalesce(scan_status, 'Not Scanned')
where true;

create table if not exists public.hazop_attachment_access_logs (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null,
  attachment_id text not null,
  action text not null,
  user_id text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.hazop_attachment_versions (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null,
  attachment_id text not null,
  version integer not null,
  file_name text not null,
  storage_key text,
  file_size bigint,
  checksum text,
  uploaded_by text,
  uploaded_at timestamptz not null default now(),
  change_reason text,
  created_at timestamptz not null default now()
);

alter table if exists public.hazop_history_events
  add column if not exists company_id text,
  add column if not exists site_id text,
  add column if not exists event_category text,
  add column if not exists event_title text,
  add column if not exists event_description text,
  add column if not exists severity text default 'Info',
  add column if not exists actor_user_id text,
  add column if not exists actor_name_snapshot text,
  add column if not exists related_section text,
  add column if not exists related_record_type text,
  add column if not exists related_record_id text,
  add column if not exists related_record_number text,
  add column if not exists node_id text,
  add column if not exists scenario_id text,
  add column if not exists recommendation_id text,
  add column if not exists safeguard_id text,
  add column if not exists session_id text,
  add column if not exists attachment_id text,
  add column if not exists linked_record_id text,
  add column if not exists signoff_id text,
  add column if not exists workflow_instance_id text,
  add column if not exists audit_log_id text,
  add column if not exists before_values_json jsonb,
  add column if not exists after_values_json jsonb,
  add column if not exists metadata_json jsonb,
  add column if not exists ip_address text,
  add column if not exists user_agent text,
  add column if not exists safety_critical boolean default false,
  add column if not exists system_generated boolean default false;

update public.hazop_history_events
set
  event_title = coalesce(event_title, title),
  event_description = coalesce(event_description, description),
  actor_user_id = coalesce(actor_user_id, actor_id),
  metadata_json = coalesce(metadata_json, metadata),
  event_category = coalesce(event_category,
    case
      when event_type ilike '%ATTACHMENT%' then 'Attachment'
      when event_type ilike '%RISK%' or event_type ilike '%LOPA%' then 'Risk'
      when event_type ilike '%SAFEGUARD%' or event_type ilike '%IPL%' then 'Safeguard/IPL'
      when event_type ilike '%RECOMMENDATION%' or event_type ilike '%ACTION%' then 'Recommendation/Action'
      when event_type ilike '%SESSION%' or event_type ilike '%TEAM%' or event_type ilike '%ATTENDANCE%' then 'Team/Session'
      when event_type ilike '%LINKED_RECORD%' then 'Linked Record'
      when event_type ilike '%SIGNOFF%' or event_type ilike '%REVIEW%' or event_type ilike '%APPROVAL%' then 'Review/Sign-Off'
      when event_type ilike '%WORKFLOW%' then 'Workflow'
      else 'Study'
    end),
  severity = coalesce(severity,
    case
      when event_type ilike '%CRITICAL%' or event_type ilike '%LOPA%' or event_type ilike '%REJECTED%' then 'High'
      else 'Info'
    end),
  safety_critical = coalesce(safety_critical, event_type ilike '%LOPA%' or event_type ilike '%CRITICAL%' or event_type ilike '%REJECTED%' or event_type ilike '%BLOCK%')
where true;

create index if not exists idx_hazop_attachments_study_active on public.hazop_attachments (tenant_id, study_id, deleted_at, archived_at);
create index if not exists idx_hazop_attachment_versions_attachment on public.hazop_attachment_versions (tenant_id, attachment_id, version);
create index if not exists idx_hazop_attachment_access_logs_attachment on public.hazop_attachment_access_logs (tenant_id, attachment_id, created_at desc);
create index if not exists idx_hazop_history_events_study_category on public.hazop_history_events (tenant_id, study_id, event_category, created_at desc);
create index if not exists idx_hazop_history_events_safety on public.hazop_history_events (tenant_id, study_id, safety_critical, created_at desc);

alter table public.hazop_attachment_access_logs enable row level security;
alter table public.hazop_attachment_versions enable row level security;

grant select, insert, update, delete on public.hazop_attachment_access_logs to authenticated;
grant select, insert, update, delete on public.hazop_attachment_versions to authenticated;
