alter table if exists pssrs add column if not exists authorized_by text;
alter table if exists pssrs add column if not exists authorized_at timestamptz;
alter table if exists pssrs add column if not exists released_by text;
alter table if exists pssrs add column if not exists released_at timestamptz;

create table if not exists pssr_startup_authorizations (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  status text not null default 'Not Ready',
  readiness_percent numeric not null default 0,
  checklist_readiness_percent numeric not null default 0,
  field_readiness_percent numeric not null default 0,
  document_readiness_percent numeric not null default 0,
  training_readiness_percent numeric not null default 0,
  testing_readiness_percent numeric not null default 0,
  punch_readiness_percent numeric not null default 0,
  blockers_count integer not null default 0,
  category_a_open_count integer not null default 0,
  category_b_accepted_count integer not null default 0,
  signatures_required_count integer not null default 0,
  signatures_completed_count integer not null default 0,
  target_startup_at timestamptz,
  ready_for_authorization_at timestamptz,
  authorized_by text,
  authorized_at timestamptz,
  released_by text,
  released_at timestamptz,
  returned_by text,
  returned_at timestamptz,
  return_reason text,
  cancelled_by text,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_authorization_signatures (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  authorization_id text references pssr_startup_authorizations(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  signature_role text not null,
  required_reason text,
  assigned_user_id text,
  assigned_role_id text,
  status text not null default 'Pending',
  signed_by text,
  signed_at timestamptz,
  rejected_by text,
  rejected_at timestamptz,
  rejection_reason text,
  comment text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_startup_conditions (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  authorization_id text references pssr_startup_authorizations(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  condition_type text not null default 'Startup Condition',
  description text not null,
  required boolean not null default true,
  owner_id text,
  due_date date,
  status text not null default 'Open',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_startup_release_events (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  authorization_id text references pssr_startup_authorizations(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  event_type text not null,
  description text,
  released_by text,
  released_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table if exists pssr_history_events add column if not exists user_name text;
alter table if exists pssr_history_events add column if not exists user_role text;
alter table if exists pssr_history_events add column if not exists related_record_type text;
alter table if exists pssr_history_events add column if not exists related_record_id text;
alter table if exists pssr_history_events add column if not exists related_record_number text;
alter table if exists pssr_history_events add column if not exists metadata jsonb;
alter table if exists pssr_history_events add column if not exists ip_address text;
alter table if exists pssr_history_events add column if not exists user_agent text;

create table if not exists pssr_attachments (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  attachment_type text not null default 'Other',
  file_name text not null,
  file_key text,
  file_url text,
  mime_type text,
  file_size bigint,
  description text,
  related_section text,
  related_record_type text,
  related_record_id text,
  document_id text,
  document_version_id text,
  uploaded_by text,
  uploaded_at timestamptz not null default now(),
  deleted_by text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists pssr_attachments add column if not exists tenant_id text;
alter table if exists pssr_attachments add column if not exists company_id text;
alter table if exists pssr_attachments add column if not exists site_id text;
alter table if exists pssr_attachments add column if not exists description text;
alter table if exists pssr_attachments add column if not exists related_section text;
alter table if exists pssr_attachments add column if not exists related_record_type text;
alter table if exists pssr_attachments add column if not exists related_record_id text;
alter table if exists pssr_attachments add column if not exists document_id text;
alter table if exists pssr_attachments add column if not exists document_version_id text;
alter table if exists pssr_attachments add column if not exists uploaded_at timestamptz not null default now();
alter table if exists pssr_attachments add column if not exists deleted_by text;
alter table if exists pssr_attachments add column if not exists deleted_at timestamptz;

create unique index if not exists pssr_startup_authorization_one_active on pssr_startup_authorizations(pssr_id);
create unique index if not exists pssr_authorization_signature_role_idx on pssr_authorization_signatures(pssr_id, signature_role);
create index if not exists pssr_history_scope_filter_idx on pssr_history_events(tenant_id, site_id, pssr_id, event_category, event_type, created_at);
create index if not exists pssr_attachments_scope_idx on pssr_attachments(tenant_id, site_id, pssr_id, deleted_at);

insert into "Permission" (id, "tenantId", key, "moduleKey", label)
values
  ('perm_pssr_authorization_view', 'tenant_alkylation', 'pssr.authorization.view', 'pssr', 'View PSSR Startup Authorization'),
  ('perm_pssr_authorization_readiness_check', 'tenant_alkylation', 'pssr.authorization.readiness_check', 'pssr', 'Run PSSR Authorization Readiness Check'),
  ('perm_pssr_authorization_sign', 'tenant_alkylation', 'pssr.authorization.sign', 'pssr', 'Sign PSSR Authorization'),
  ('perm_pssr_authorization_reject', 'tenant_alkylation', 'pssr.authorization.reject', 'pssr', 'Reject PSSR Authorization Signature'),
  ('perm_pssr_authorization_waive_signature', 'tenant_alkylation', 'pssr.authorization.waive_signature', 'pssr', 'Waive PSSR Authorization Signature'),
  ('perm_pssr_authorization_manage_conditions', 'tenant_alkylation', 'pssr.authorization.manage_conditions', 'pssr', 'Manage PSSR Startup Conditions'),
  ('perm_pssr_authorization_mark_ready', 'tenant_alkylation', 'pssr.authorization.mark_ready', 'pssr', 'Mark PSSR Ready For Authorization'),
  ('perm_pssr_authorization_authorize', 'tenant_alkylation', 'pssr.authorization.authorize', 'pssr', 'Authorize PSSR Startup'),
  ('perm_pssr_authorization_release', 'tenant_alkylation', 'pssr.authorization.release', 'pssr', 'Release PSSR Startup'),
  ('perm_pssr_authorization_return_for_correction', 'tenant_alkylation', 'pssr.authorization.return_for_correction', 'pssr', 'Return PSSR For Correction'),
  ('perm_pssr_authorization_cancel', 'tenant_alkylation', 'pssr.authorization.cancel', 'pssr', 'Cancel PSSR Authorization'),
  ('perm_pssr_report_download', 'tenant_alkylation', 'pssr.report.download', 'pssr', 'Download PSSR Report'),
  ('perm_pssr_history_view', 'tenant_alkylation', 'pssr.history.view', 'pssr', 'View PSSR History'),
  ('perm_pssr_history_export', 'tenant_alkylation', 'pssr.history.export', 'pssr', 'Export PSSR History'),
  ('perm_pssr_attachments_view', 'tenant_alkylation', 'pssr.attachments.view', 'pssr', 'View PSSR Attachments'),
  ('perm_pssr_attachments_upload', 'tenant_alkylation', 'pssr.attachments.upload', 'pssr', 'Upload PSSR Attachments'),
  ('perm_pssr_attachments_preview', 'tenant_alkylation', 'pssr.attachments.preview', 'pssr', 'Preview PSSR Attachments'),
  ('perm_pssr_attachments_download', 'tenant_alkylation', 'pssr.attachments.download', 'pssr', 'Download PSSR Attachments'),
  ('perm_pssr_attachments_delete', 'tenant_alkylation', 'pssr.attachments.delete', 'pssr', 'Delete PSSR Attachments'),
  ('perm_pssr_attachments_link_document', 'tenant_alkylation', 'pssr.attachments.link_document', 'pssr', 'Link PSSR Attachment To Document Control')
on conflict (id) do update set key = excluded.key, label = excluded.label, "moduleKey" = excluded."moduleKey";

insert into "RolePermission" ("roleId", "permissionId")
select r.id, p.id
from "Role" r
join "Permission" p on p."tenantId" = r."tenantId"
where r."tenantId" = 'tenant_alkylation'
  and r.name in ('Platform Admin', 'Corporate Admin', 'Site Admin', 'Plant Manager', 'HSE Manager', 'Process Engineer', 'Operations Supervisor', 'Maintenance Supervisor')
  and (p.key like 'pssr.authorization.%' or p.key like 'pssr.history.%' or p.key like 'pssr.attachments.%' or p.key = 'pssr.report.download')
on conflict do nothing;
