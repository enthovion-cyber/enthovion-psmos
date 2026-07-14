create table if not exists moc_stakeholders (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  moc_id text not null references mocs(id) on delete cascade,
  stakeholder_type text not null default 'Other',
  department_id text,
  role_id text,
  user_id text,
  group_id text,
  acknowledgement_required boolean not null default true,
  training_required boolean not null default false,
  required_before_startup boolean not null default false,
  required_before_closure boolean not null default false,
  notes text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists moc_communication_plans (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  moc_id text not null references mocs(id) on delete cascade unique,
  objective text,
  message_summary text,
  key_change_points text,
  safety_precautions text,
  operational_restrictions text,
  procedure_reference text,
  effective_date date,
  communication_owner_id text,
  planned_date timestamptz,
  method text,
  status text not null default 'Not Started',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists moc_communication_logs (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  moc_id text not null references mocs(id) on delete cascade,
  communication_number text,
  method text not null default 'In-app notification',
  subject text not null,
  message text,
  sent_to jsonb not null default '[]'::jsonb,
  sent_by text,
  sent_at timestamptz,
  status text not null default 'Draft',
  notification_id text,
  acknowledgement_required boolean not null default false,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists moc_acknowledgements (
  id text primary key,
  tenant_id text not null,
  moc_id text not null references mocs(id) on delete cascade,
  communication_log_id text references moc_communication_logs(id) on delete set null,
  stakeholder_id text references moc_stakeholders(id) on delete cascade,
  company_id text,
  site_id text,
  user_id text,
  role_id text,
  status text not null default 'Pending',
  acknowledged_by text,
  acknowledged_at timestamptz,
  ip_address text,
  user_agent text,
  comment text,
  waiver_reason text,
  waived_by text,
  waived_at timestamptz,
  reminder_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table moc_training_requirements add column if not exists title text;
alter table moc_training_requirements add column if not exists description text;
alter table moc_training_requirements add column if not exists training_type text;
alter table moc_training_requirements add column if not exists required_role_id text;
alter table moc_training_requirements add column if not exists required_department_id text;
alter table moc_training_requirements add column if not exists owner_id text;
alter table moc_training_requirements add column if not exists due_date date;
alter table moc_training_requirements add column if not exists required_before_closure boolean not null default false;
alter table moc_training_requirements add column if not exists evidence_required boolean not null default false;
alter table moc_training_requirements add column if not exists verification_required boolean not null default false;
alter table moc_training_requirements add column if not exists linked_action_id text;
update moc_training_requirements set title = coalesce(title, training_topic), training_type = coalesce(training_type, 'General awareness') where title is null or training_type is null;

create table if not exists moc_training_assignments (
  id text primary key,
  tenant_id text not null,
  moc_id text not null references mocs(id) on delete cascade,
  training_requirement_id text not null references moc_training_requirements(id) on delete cascade,
  company_id text,
  site_id text,
  user_id text,
  role_id text,
  department_id text,
  status text not null default 'Assigned',
  completed_at timestamptz,
  evidence_attachment_id text,
  verified_by text,
  verified_at timestamptz,
  waiver_reason text,
  waived_by text,
  waived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table moc_history_events add column if not exists company_id text;
alter table moc_history_events add column if not exists site_id text;
alter table moc_history_events add column if not exists event_category text;
alter table moc_history_events add column if not exists event_title text;
alter table moc_history_events add column if not exists user_id text;
alter table moc_history_events add column if not exists user_name text;
alter table moc_history_events add column if not exists user_role text;
alter table moc_history_events add column if not exists related_record_type text;
alter table moc_history_events add column if not exists related_record_id text;
alter table moc_history_events add column if not exists related_record_number text;
alter table moc_history_events add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table moc_history_events add column if not exists is_safety_critical boolean not null default false;
alter table moc_history_events add column if not exists ip_address text;
alter table moc_history_events add column if not exists user_agent text;
update moc_history_events set event_title = coalesce(event_title, title), user_id = coalesce(user_id, actor_id), event_category = coalesce(event_category, split_part(event_type, '_', 2)) where event_title is null or user_id is null or event_category is null;

alter table moc_attachments add column if not exists file_key text;
alter table moc_attachments add column if not exists file_url text;
alter table moc_attachments add column if not exists file_size integer;
alter table moc_attachments add column if not exists description text;
alter table moc_attachments add column if not exists related_section text;
alter table moc_attachments add column if not exists related_record_type text;
alter table moc_attachments add column if not exists related_record_id text;
alter table moc_attachments add column if not exists document_version_id text;
alter table moc_attachments add column if not exists deleted_by text;
alter table moc_attachments add column if not exists deleted_at timestamptz;
update moc_attachments set file_key = coalesce(file_key, storage_key), file_size = coalesce(file_size, size_bytes) where file_key is null or file_size is null;

create index if not exists moc_stakeholders_moc_idx on moc_stakeholders(tenant_id, moc_id, stakeholder_type);
create index if not exists moc_communication_plans_moc_idx on moc_communication_plans(tenant_id, moc_id, status);
create index if not exists moc_communication_logs_moc_idx on moc_communication_logs(tenant_id, moc_id, sent_at desc, status);
create index if not exists moc_acknowledgements_moc_idx on moc_acknowledgements(tenant_id, moc_id, status);
create index if not exists moc_training_assignments_moc_idx on moc_training_assignments(tenant_id, moc_id, status);
create index if not exists moc_history_events_filter_idx on moc_history_events(tenant_id, moc_id, event_category, event_type, created_at desc);
create index if not exists moc_attachments_active_idx on moc_attachments(tenant_id, moc_id, deleted_at, uploaded_at desc);

alter table moc_stakeholders enable row level security;
alter table moc_communication_plans enable row level security;
alter table moc_communication_logs enable row level security;
alter table moc_acknowledgements enable row level security;
alter table moc_training_assignments enable row level security;

insert into "Permission" (id, "tenantId", key, "moduleKey", label)
values
  ('perm_moc_communication_view', 'tenant_alkylation', 'moc.communication.view', 'moc', 'View MOC Communication'),
  ('perm_moc_communication_edit', 'tenant_alkylation', 'moc.communication.edit', 'moc', 'Edit MOC Communication'),
  ('perm_moc_communication_send', 'tenant_alkylation', 'moc.communication.send', 'moc', 'Send MOC Communication'),
  ('perm_moc_acknowledgement_view', 'tenant_alkylation', 'moc.acknowledgement.view', 'moc', 'View MOC Acknowledgements'),
  ('perm_moc_acknowledgement_acknowledge', 'tenant_alkylation', 'moc.acknowledgement.acknowledge', 'moc', 'Acknowledge MOC'),
  ('perm_moc_acknowledgement_waive', 'tenant_alkylation', 'moc.acknowledgement.waive', 'moc', 'Waive MOC Acknowledgement'),
  ('perm_moc_training_view', 'tenant_alkylation', 'moc.training.view', 'moc', 'View MOC Training'),
  ('perm_moc_training_create', 'tenant_alkylation', 'moc.training.create', 'moc', 'Create MOC Training'),
  ('perm_moc_training_complete', 'tenant_alkylation', 'moc.training.complete', 'moc', 'Complete MOC Training'),
  ('perm_moc_training_verify', 'tenant_alkylation', 'moc.training.verify', 'moc', 'Verify MOC Training'),
  ('perm_moc_training_waive', 'tenant_alkylation', 'moc.training.waive', 'moc', 'Waive MOC Training'),
  ('perm_moc_history_view', 'tenant_alkylation', 'moc.history.view', 'moc', 'View MOC History'),
  ('perm_moc_history_export', 'tenant_alkylation', 'moc.history.export', 'moc', 'Export MOC History'),
  ('perm_moc_attachments_view', 'tenant_alkylation', 'moc.attachments.view', 'moc', 'View MOC Attachments'),
  ('perm_moc_attachments_preview', 'tenant_alkylation', 'moc.attachments.preview', 'moc', 'Preview MOC Attachments'),
  ('perm_moc_attachments_download', 'tenant_alkylation', 'moc.attachments.download', 'moc', 'Download MOC Attachments'),
  ('perm_moc_attachments_delete', 'tenant_alkylation', 'moc.attachments.delete', 'moc', 'Delete MOC Attachments'),
  ('perm_moc_attachments_link_document', 'tenant_alkylation', 'moc.attachments.link_document', 'moc', 'Link MOC Attachment Document')
on conflict (id) do update set key = excluded.key, label = excluded.label, "moduleKey" = excluded."moduleKey";

insert into "RolePermission" ("roleId", "permissionId")
select r.id, p.id
from "Role" r
join "Permission" p on p."tenantId" = r."tenantId"
where r."tenantId" = 'tenant_alkylation'
  and r.name in ('Platform Admin', 'Corporate Admin', 'Site Admin', 'Plant Manager', 'HSE Manager', 'Process Engineer', 'Operations Supervisor')
  and (p.key like 'moc.communication.%' or p.key like 'moc.acknowledgement.%' or p.key like 'moc.training.%' or p.key like 'moc.history.%' or p.key like 'moc.attachments.%')
on conflict do nothing;
