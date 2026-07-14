alter table permit_attachments
  add column if not exists attachment_type text,
  add column if not exists file_key text,
  add column if not exists file_url text,
  add column if not exists file_size bigint,
  add column if not exists description text,
  add column if not exists related_section text,
  add column if not exists is_evidence boolean not null default false,
  add column if not exists is_required boolean not null default false,
  add column if not exists visibility text not null default 'Internal',
  add column if not exists document_id text,
  add column if not exists document_version_id text,
  add column if not exists uploaded_at timestamptz,
  add column if not exists deleted_by text references "User"(id) on delete set null,
  add column if not exists deleted_at timestamptz;

update permit_attachments
set
  file_key = coalesce(file_key, storage_key),
  file_size = coalesce(file_size, size_bytes),
  uploaded_at = coalesce(uploaded_at, created_at),
  attachment_type = coalesce(attachment_type, title, 'Other')
where file_key is null or file_size is null or uploaded_at is null or attachment_type is null;

alter table permit_history
  add column if not exists event_category text,
  add column if not exists event_title text,
  add column if not exists user_id text references "User"(id) on delete set null,
  add column if not exists user_name text,
  add column if not exists user_role text,
  add column if not exists related_record_type text,
  add column if not exists related_record_id text,
  add column if not exists related_record_number text,
  add column if not exists before_value jsonb,
  add column if not exists after_value jsonb,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists is_safety_critical boolean not null default false,
  add column if not exists ip_address text,
  add column if not exists user_agent text;

update permit_history
set
  event_title = coalesce(event_title, title),
  user_id = coalesce(user_id, actor_id),
  before_value = coalesce(before_value, before_data),
  after_value = coalesce(after_value, after_data),
  event_category = coalesce(event_category,
    case
      when event_type like 'PERMIT_%' then 'Lifecycle'
      when event_type like 'ISOLATION_%' or event_type like 'DE_ISOLATION%' then 'Isolation'
      when event_type like 'GAS_%' then 'Gas Test'
      when event_type like 'WORKFORCE_%' then 'Workforce'
      when event_type like '%HANDOVER%' then 'Handover'
      when event_type like 'CONFLICT_%' or event_type like 'SIMOPS_%' then 'Conflicts'
      when event_type like 'SIGNATURE_%' then 'Signatures'
      when event_type like 'ATTACHMENT_%' then 'Attachments'
      when event_type like '%CERTIFICATE%' then 'Certificates'
      else 'System'
    end),
  is_safety_critical = case
    when event_type like '%FAILED%' or event_type like '%OVERDUE%' or event_type like '%SUSPENDED%' or event_type like '%CONFLICT%' or event_type like '%REJECTED%' then true
    else is_safety_critical
  end
where event_title is null or user_id is null or before_value is null or after_value is null or event_category is null;

create table if not exists permit_attachment_requirements (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text references "Site"(id) on delete cascade,
  permit_type text,
  risk_level text,
  condition_rule jsonb not null default '{}'::jsonb,
  attachment_type text not null,
  is_required boolean not null default true,
  description text,
  is_active boolean not null default true,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists permit_attachments_active_idx on permit_attachments(tenant_id, permit_id, deleted_at, attachment_type);
create index if not exists permit_attachment_requirements_scope_idx on permit_attachment_requirements(tenant_id, site_id, permit_type, is_active);
create index if not exists permit_history_filter_idx on permit_history(tenant_id, permit_id, event_category, event_type, created_at desc);

alter table permit_attachment_requirements enable row level security;

notify pgrst, 'reload schema';
