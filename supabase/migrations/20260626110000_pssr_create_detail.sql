create table if not exists pssrs (
  id text primary key,
  pssr_number text not null unique,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  department_id text,
  unit_id text,
  area_id text,
  title text not null,
  description text,
  pssr_type text not null,
  startup_type text not null,
  trigger_source text not null default 'Manual',
  status text not null default 'Draft',
  risk_level text not null default 'Medium',
  target_startup_at timestamptz,
  requested_startup_at timestamptz,
  coordinator_id text,
  originator_id text,
  startup_scope jsonb not null default '{}'::jsonb,
  startup_boundaries text,
  startup_hazards text,
  startup_prerequisites text,
  temporary_controls text,
  readiness_status text not null default 'Not Ready',
  readiness_percent integer not null default 0,
  checklist_completion_percent integer not null default 0,
  document_readiness_percent integer not null default 0,
  training_readiness_percent integer not null default 0,
  testing_readiness_percent integer not null default 0,
  punch_item_readiness_percent integer not null default 0,
  authorization_status text not null default 'Not Authorized',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  closed_at timestamptz
);

create table if not exists pssr_linked_mocs (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  moc_id text not null,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  relationship_type text not null default 'Trigger Source',
  trigger_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pssr_linked_mocs_moc_idx on pssr_linked_mocs(moc_id);

create table if not exists pssr_affected_equipment (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  equipment_id text,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  is_primary boolean not null default false,
  equipment_tag_snapshot text,
  equipment_name_snapshot text,
  equipment_type_snapshot text,
  equipment_criticality_snapshot text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_checklist_items (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  group_name text not null,
  item_title text not null,
  item_description text,
  required boolean not null default true,
  required_before_startup boolean not null default true,
  evidence_required boolean not null default false,
  verification_required boolean not null default true,
  owner_role_id text,
  owner_id text,
  status text not null default 'Open',
  evidence_status text not null default 'Not Uploaded',
  verification_status text not null default 'Not Verified',
  source text not null default 'System Generated',
  source_record_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_startup_blockers (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  blocker_type text not null,
  blocker_title text not null,
  blocker_description text,
  source_module text,
  source_record_id text,
  severity text not null default 'Medium',
  blocking boolean not null default true,
  status text not null default 'Open',
  owner_id text,
  due_date date,
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_readiness_checks (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  readiness_status text not null,
  readiness_percent integer not null default 0,
  checklist_status text,
  document_status text,
  training_status text,
  testing_status text,
  punch_status text,
  authorization_status text,
  blockers_count integer not null default 0,
  checked_by text,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_history_events (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  event_category text not null,
  event_type text not null,
  event_title text not null,
  description text,
  user_id text,
  related_record_type text,
  related_record_id text,
  before_value jsonb,
  after_value jsonb,
  metadata jsonb,
  is_safety_critical boolean not null default false,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists pssr_attachments (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  attachment_type text not null,
  file_name text not null,
  file_key text,
  file_url text,
  mime_type text,
  file_size bigint,
  description text,
  related_section text,
  uploaded_by text,
  uploaded_at timestamptz,
  deleted_by text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pssrs_scope_idx on pssrs(tenant_id, company_id, site_id, status, risk_level, updated_at desc);
create index if not exists pssr_checklist_scope_idx on pssr_checklist_items(tenant_id, site_id, pssr_id, status);
create index if not exists pssr_blockers_scope_idx on pssr_startup_blockers(tenant_id, site_id, pssr_id, status, severity);
create index if not exists pssr_history_scope_idx on pssr_history_events(tenant_id, site_id, pssr_id, created_at desc);

insert into "Permission" (id, "tenantId", key, "moduleKey", label)
values
  ('perm_pssr_view', 'tenant_alkylation', 'pssr.view', 'pssr', 'View PSSR'),
  ('perm_pssr_create', 'tenant_alkylation', 'pssr.create', 'pssr', 'Create PSSR'),
  ('perm_pssr_edit', 'tenant_alkylation', 'pssr.edit', 'pssr', 'Edit PSSR'),
  ('perm_pssr_submit', 'tenant_alkylation', 'pssr.submit', 'pssr', 'Submit PSSR'),
  ('perm_pssr_trigger_from_moc', 'tenant_alkylation', 'pssr.trigger_from_moc', 'pssr', 'Trigger PSSR from MOC'),
  ('perm_pssr_readiness_check', 'tenant_alkylation', 'pssr.readiness_check', 'pssr', 'Run PSSR Readiness Check'),
  ('perm_pssr_authorize_startup', 'tenant_alkylation', 'pssr.authorize_startup', 'pssr', 'Authorize Startup'),
  ('perm_pssr_release_startup', 'tenant_alkylation', 'pssr.release_startup', 'pssr', 'Release Startup'),
  ('perm_pssr_close', 'tenant_alkylation', 'pssr.close', 'pssr', 'Close PSSR'),
  ('perm_pssr_cancel', 'tenant_alkylation', 'pssr.cancel', 'pssr', 'Cancel PSSR'),
  ('perm_pssr_report_download', 'tenant_alkylation', 'pssr.report.download', 'pssr', 'Download PSSR Report')
on conflict (id) do update set key = excluded.key, label = excluded.label, "moduleKey" = excluded."moduleKey";

insert into "RolePermission" ("roleId", "permissionId")
select r.id, p.id
from "Role" r
join "Permission" p on p."tenantId" = r."tenantId"
where r."tenantId" = 'tenant_alkylation'
  and r.name in ('Platform Admin', 'Corporate Admin', 'Site Admin', 'Plant Manager', 'HSE Manager', 'Process Engineer', 'Operations Supervisor', 'Maintenance Supervisor')
  and p.key like 'pssr.%'
on conflict do nothing;
