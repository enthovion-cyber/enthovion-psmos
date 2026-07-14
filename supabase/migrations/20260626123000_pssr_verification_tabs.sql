alter table if exists pssr_checklist_items add column if not exists due_date date;
alter table if exists pssr_checklist_items add column if not exists related_equipment_id text;
alter table if exists pssr_checklist_items add column if not exists related_document_id text;
alter table if exists pssr_checklist_items add column if not exists related_moc_id text;
alter table if exists pssr_checklist_items add column if not exists startup_blocking boolean not null default true;
alter table if exists pssr_checklist_items add column if not exists waiver_required boolean not null default false;
alter table if exists pssr_checklist_items add column if not exists waiver_reason text;
alter table if exists pssr_checklist_items add column if not exists waived_by text;
alter table if exists pssr_checklist_items add column if not exists waived_at timestamptz;
alter table if exists pssr_checklist_items add column if not exists no_longer_required boolean not null default false;
alter table if exists pssr_checklist_items add column if not exists no_longer_required_reason text;
alter table if exists pssr_checklist_items add column if not exists created_by text;

create table if not exists pssr_checklist_item_evidence (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  checklist_item_id text not null references pssr_checklist_items(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  evidence_type text not null default 'File',
  file_name text,
  file_key text,
  file_url text,
  mime_type text,
  file_size bigint,
  note text,
  uploaded_by text,
  uploaded_at timestamptz not null default now(),
  accepted_by text,
  accepted_at timestamptz,
  rejected_by text,
  rejected_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_checklist_verifications (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  checklist_item_id text not null references pssr_checklist_items(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  status text not null default 'Pending',
  verified_by text,
  verified_at timestamptz,
  rejected_by text,
  rejected_at timestamptz,
  rejection_reason text,
  comment text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_checklist_history (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  checklist_item_id text references pssr_checklist_items(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  event_type text not null,
  title text not null,
  description text,
  before_value jsonb,
  after_value jsonb,
  user_id text,
  created_at timestamptz not null default now()
);

create table if not exists pssr_field_verifications (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  status text not null default 'Not Started',
  completion_percent integer not null default 0,
  blockers_count integer not null default 0,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_equipment_verifications (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  affected_equipment_id text references pssr_affected_equipment(id) on delete cascade,
  equipment_id text,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  equipment_tag_snapshot text,
  equipment_name_snapshot text,
  equipment_type_snapshot text,
  equipment_criticality_snapshot text,
  status text not null default 'Not Started',
  installation_status text not null default 'Pending',
  tag_verified boolean not null default false,
  qr_verified boolean not null default false,
  photo_required boolean not null default false,
  evidence_status text not null default 'Missing',
  verified_by text,
  verified_at timestamptz,
  failed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_field_checklist_items (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  equipment_verification_id text not null references pssr_equipment_verifications(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  checklist_key text not null,
  title text not null,
  description text,
  status text not null default 'Needs Action',
  required boolean not null default true,
  startup_blocking boolean not null default true,
  evidence_required boolean not null default false,
  verification_required boolean not null default true,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_field_evidence (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  equipment_verification_id text references pssr_equipment_verifications(id) on delete cascade,
  field_checklist_item_id text references pssr_field_checklist_items(id) on delete set null,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  evidence_type text not null default 'Photo',
  file_name text,
  file_key text,
  file_url text,
  caption text,
  gps_latitude numeric,
  gps_longitude numeric,
  uploaded_by text,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_field_signoffs (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  signoff_role text not null,
  required boolean not null default true,
  status text not null default 'Pending',
  signed_by text,
  signed_at timestamptz,
  comment text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_document_requirements (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  document_type text not null,
  document_title text not null,
  required boolean not null default true,
  required_before_startup boolean not null default true,
  source text not null default 'PSSR',
  source_record_id text,
  allow_justification boolean not null default true,
  owner_id text,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_document_readiness (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  requirement_id text not null references pssr_document_requirements(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  controlled_document_id text,
  controlled_document_version_id text,
  document_number text,
  document_title text,
  current_version text,
  required_version text,
  status text not null default 'Missing',
  readiness_status text not null default 'Blocked',
  startup_blocking boolean not null default true,
  justification text,
  justified_by text,
  justified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_document_verifications (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  document_readiness_id text not null references pssr_document_readiness(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  status text not null default 'Pending',
  verified_by text,
  verified_at timestamptz,
  rejected_by text,
  rejected_at timestamptz,
  rejection_reason text,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pssr_checklist_evidence_scope_idx on pssr_checklist_item_evidence(tenant_id, site_id, pssr_id, checklist_item_id);
create index if not exists pssr_checklist_verifications_scope_idx on pssr_checklist_verifications(tenant_id, site_id, pssr_id, checklist_item_id);
create index if not exists pssr_field_equipment_scope_idx on pssr_equipment_verifications(tenant_id, site_id, pssr_id);
create index if not exists pssr_field_checklist_scope_idx on pssr_field_checklist_items(tenant_id, site_id, pssr_id, equipment_verification_id);
create index if not exists pssr_document_readiness_scope_idx on pssr_document_readiness(tenant_id, site_id, pssr_id);

insert into "Permission" (id, "tenantId", key, "moduleKey", label)
values
  ('perm_pssr_checklist_view', 'tenant_alkylation', 'pssr.checklist.view', 'pssr', 'View PSSR Checklist'),
  ('perm_pssr_checklist_generate', 'tenant_alkylation', 'pssr.checklist.generate', 'pssr', 'Generate PSSR Checklist'),
  ('perm_pssr_checklist_edit', 'tenant_alkylation', 'pssr.checklist.edit', 'pssr', 'Edit PSSR Checklist'),
  ('perm_pssr_checklist_complete', 'tenant_alkylation', 'pssr.checklist.complete', 'pssr', 'Complete PSSR Checklist'),
  ('perm_pssr_checklist_verify', 'tenant_alkylation', 'pssr.checklist.verify', 'pssr', 'Verify PSSR Checklist'),
  ('perm_pssr_checklist_waive', 'tenant_alkylation', 'pssr.checklist.waive', 'pssr', 'Waive PSSR Checklist'),
  ('perm_pssr_field_view', 'tenant_alkylation', 'pssr.field.view', 'pssr', 'View PSSR Field Verification'),
  ('perm_pssr_field_verify', 'tenant_alkylation', 'pssr.field.verify', 'pssr', 'Verify PSSR Field'),
  ('perm_pssr_field_signoff', 'tenant_alkylation', 'pssr.field.signoff', 'pssr', 'Signoff PSSR Field'),
  ('perm_pssr_field_upload_evidence', 'tenant_alkylation', 'pssr.field.upload_evidence', 'pssr', 'Upload PSSR Field Evidence'),
  ('perm_pssr_field_scan_equipment', 'tenant_alkylation', 'pssr.field.scan_equipment', 'pssr', 'Scan PSSR Equipment'),
  ('perm_pssr_documents_view', 'tenant_alkylation', 'pssr.documents.view', 'pssr', 'View PSSR Documents'),
  ('perm_pssr_documents_generate', 'tenant_alkylation', 'pssr.documents.generate', 'pssr', 'Generate PSSR Documents'),
  ('perm_pssr_documents_link', 'tenant_alkylation', 'pssr.documents.link', 'pssr', 'Link PSSR Documents'),
  ('perm_pssr_documents_verify', 'tenant_alkylation', 'pssr.documents.verify', 'pssr', 'Verify PSSR Documents'),
  ('perm_pssr_documents_justify', 'tenant_alkylation', 'pssr.documents.justify', 'pssr', 'Justify PSSR Documents'),
  ('perm_pssr_documents_request_revision', 'tenant_alkylation', 'pssr.documents.request_revision', 'pssr', 'Request PSSR Document Revision')
on conflict (id) do update set key = excluded.key, label = excluded.label, "moduleKey" = excluded."moduleKey";

insert into "RolePermission" ("roleId", "permissionId")
select r.id, p.id
from "Role" r
join "Permission" p on p."tenantId" = r."tenantId"
where r."tenantId" = 'tenant_alkylation'
  and r.name in ('Platform Admin', 'Corporate Admin', 'Site Admin', 'Plant Manager', 'HSE Manager', 'Process Engineer', 'Operations Supervisor', 'Maintenance Supervisor')
  and p.key like 'pssr.%'
on conflict do nothing;
