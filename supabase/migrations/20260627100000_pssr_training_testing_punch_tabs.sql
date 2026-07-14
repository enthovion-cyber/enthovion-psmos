alter table if exists pssrs add column if not exists training_readiness_status text not null default 'Not Started';
alter table if exists pssrs add column if not exists testing_readiness_status text not null default 'Not Started';
alter table if exists pssrs add column if not exists punch_readiness_status text not null default 'Clear';

create table if not exists pssr_training_requirements (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  title text not null,
  description text,
  training_type text not null,
  source text not null default 'Manual',
  source_record_id text,
  required_role_id text,
  required_department_id text,
  required_before_startup boolean not null default true,
  required_before_closure boolean not null default false,
  evidence_required boolean not null default false,
  verification_required boolean not null default true,
  due_date date,
  owner_id text,
  linked_training_record_id text,
  linked_action_id text,
  status text not null default 'Not Started',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_training_assignments (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  training_requirement_id text not null references pssr_training_requirements(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  user_id text,
  role_id text,
  department_id text,
  employer_type text not null default 'Employee',
  contractor_company_id text,
  status text not null default 'Assigned',
  completed_at timestamptz,
  verified_by text,
  verified_at timestamptz,
  rejected_by text,
  rejected_at timestamptz,
  rejection_reason text,
  waiver_reason text,
  waived_by text,
  waived_at timestamptz,
  reminder_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_training_evidence (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  training_assignment_id text references pssr_training_assignments(id) on delete cascade,
  training_requirement_id text references pssr_training_requirements(id) on delete cascade,
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_personnel_acknowledgements (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  user_id text,
  role_id text,
  acknowledgement_type text not null,
  required_before_startup boolean not null default true,
  status text not null default 'Pending',
  acknowledged_by text,
  acknowledged_at timestamptz,
  comment text,
  ip_address text,
  user_agent text,
  waiver_reason text,
  waived_by text,
  waived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_briefings (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  briefing_type text not null,
  title text not null,
  description text,
  conducted_by text,
  conducted_at timestamptz,
  attendees_count integer not null default 0,
  required_before_startup boolean not null default true,
  evidence_attachment_id text,
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_test_requirements (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  test_category text not null,
  test_title text not null,
  description text,
  source text not null default 'Manual',
  source_record_id text,
  equipment_id text,
  system_name text,
  owner_id text,
  due_date date,
  required_before_startup boolean not null default true,
  evidence_required boolean not null default true,
  verification_required boolean not null default true,
  acceptance_criteria text,
  startup_blocking boolean not null default true,
  status text not null default 'Not Started',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_test_records (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  test_requirement_id text references pssr_test_requirements(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  test_number text not null,
  test_title text not null,
  test_category text not null,
  equipment_id text,
  system_name text,
  planned_at timestamptz,
  completed_at timestamptz,
  performed_by text,
  result text,
  result_details text,
  acceptance_criteria_met boolean,
  status text not null default 'Scheduled',
  evidence_status text not null default 'Missing',
  verification_status text not null default 'Pending',
  failure_reason text,
  waiver_reason text,
  waived_by text,
  waived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_test_evidence (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  test_record_id text not null references pssr_test_records(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  evidence_type text not null default 'Certificate',
  file_name text,
  file_key text,
  file_url text,
  mime_type text,
  file_size bigint,
  note text,
  uploaded_by text,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_test_verifications (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  test_record_id text not null references pssr_test_records(id) on delete cascade,
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

create table if not exists pssr_punch_items (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  punch_number text not null,
  title text not null,
  description text,
  category text not null default 'B',
  source_module text not null default 'Manual',
  source_record_id text,
  related_equipment_id text,
  severity text not null default 'Medium',
  owner_id text,
  due_date date,
  priority text not null default 'Medium',
  status text not null default 'Open',
  startup_blocking boolean not null default false,
  evidence_required boolean not null default true,
  verification_required boolean not null default true,
  linked_action_id text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_by text,
  closed_at timestamptz
);

create table if not exists pssr_punch_item_links (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  punch_item_id text not null references pssr_punch_items(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  source_module text not null,
  source_record_id text,
  linked_action_id text,
  created_at timestamptz not null default now()
);

create table if not exists pssr_punch_item_evidence (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  punch_item_id text not null references pssr_punch_items(id) on delete cascade,
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_punch_item_verifications (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  punch_item_id text not null references pssr_punch_items(id) on delete cascade,
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

create table if not exists pssr_punch_item_deferrals (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  punch_item_id text not null references pssr_punch_items(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  justification text not null,
  risk_assessment text not null,
  temporary_controls text,
  approved_by text,
  approved_at timestamptz,
  due_date_after_startup date not null,
  startup_impact_statement text,
  status text not null default 'Pending Approval',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pssr_training_requirements_unique_source on pssr_training_requirements(pssr_id, source, coalesce(source_record_id, ''), title);
create unique index if not exists pssr_test_requirements_unique_source on pssr_test_requirements(pssr_id, source, coalesce(source_record_id, ''), test_title);
create unique index if not exists pssr_punch_unique_source on pssr_punch_items(pssr_id, source_module, coalesce(source_record_id, ''), title);
create index if not exists pssr_training_scope_idx on pssr_training_requirements(tenant_id, site_id, pssr_id);
create index if not exists pssr_testing_scope_idx on pssr_test_requirements(tenant_id, site_id, pssr_id);
create index if not exists pssr_punch_scope_idx on pssr_punch_items(tenant_id, site_id, pssr_id);

insert into "Permission" (id, "tenantId", key, "moduleKey", label)
values
  ('perm_pssr_training_view', 'tenant_alkylation', 'pssr.training.view', 'pssr', 'View PSSR Training Readiness'),
  ('perm_pssr_training_generate', 'tenant_alkylation', 'pssr.training.generate', 'pssr', 'Generate PSSR Training'),
  ('perm_pssr_training_assign', 'tenant_alkylation', 'pssr.training.assign', 'pssr', 'Assign PSSR Training'),
  ('perm_pssr_training_complete', 'tenant_alkylation', 'pssr.training.complete', 'pssr', 'Complete PSSR Training'),
  ('perm_pssr_training_verify', 'tenant_alkylation', 'pssr.training.verify', 'pssr', 'Verify PSSR Training'),
  ('perm_pssr_training_waive', 'tenant_alkylation', 'pssr.training.waive', 'pssr', 'Waive PSSR Training'),
  ('perm_pssr_training_evidence_upload', 'tenant_alkylation', 'pssr.training.evidence_upload', 'pssr', 'Upload PSSR Training Evidence'),
  ('perm_pssr_testing_view', 'tenant_alkylation', 'pssr.testing.view', 'pssr', 'View PSSR Testing'),
  ('perm_pssr_testing_generate', 'tenant_alkylation', 'pssr.testing.generate', 'pssr', 'Generate PSSR Testing'),
  ('perm_pssr_testing_create', 'tenant_alkylation', 'pssr.testing.create', 'pssr', 'Create PSSR Test'),
  ('perm_pssr_testing_edit', 'tenant_alkylation', 'pssr.testing.edit', 'pssr', 'Edit PSSR Test'),
  ('perm_pssr_testing_pass', 'tenant_alkylation', 'pssr.testing.pass', 'pssr', 'Pass PSSR Test'),
  ('perm_pssr_testing_fail', 'tenant_alkylation', 'pssr.testing.fail', 'pssr', 'Fail PSSR Test'),
  ('perm_pssr_testing_verify', 'tenant_alkylation', 'pssr.testing.verify', 'pssr', 'Verify PSSR Test'),
  ('perm_pssr_testing_waive', 'tenant_alkylation', 'pssr.testing.waive', 'pssr', 'Waive PSSR Test'),
  ('perm_pssr_testing_evidence_upload', 'tenant_alkylation', 'pssr.testing.evidence_upload', 'pssr', 'Upload PSSR Test Evidence'),
  ('perm_pssr_punch_view', 'tenant_alkylation', 'pssr.punch.view', 'pssr', 'View PSSR Punch List'),
  ('perm_pssr_punch_create', 'tenant_alkylation', 'pssr.punch.create', 'pssr', 'Create PSSR Punch Item'),
  ('perm_pssr_punch_edit', 'tenant_alkylation', 'pssr.punch.edit', 'pssr', 'Edit PSSR Punch Item'),
  ('perm_pssr_punch_close', 'tenant_alkylation', 'pssr.punch.close', 'pssr', 'Close PSSR Punch Item'),
  ('perm_pssr_punch_verify', 'tenant_alkylation', 'pssr.punch.verify', 'pssr', 'Verify PSSR Punch Item'),
  ('perm_pssr_punch_defer', 'tenant_alkylation', 'pssr.punch.defer', 'pssr', 'Defer PSSR Punch Item'),
  ('perm_pssr_punch_reopen', 'tenant_alkylation', 'pssr.punch.reopen', 'pssr', 'Reopen PSSR Punch Item'),
  ('perm_pssr_punch_sync', 'tenant_alkylation', 'pssr.punch.sync', 'pssr', 'Sync PSSR Punch Items'),
  ('perm_pssr_punch_evidence_upload', 'tenant_alkylation', 'pssr.punch.evidence_upload', 'pssr', 'Upload PSSR Punch Evidence')
on conflict (id) do update set key = excluded.key, label = excluded.label, "moduleKey" = excluded."moduleKey";

insert into "RolePermission" ("roleId", "permissionId")
select r.id, p.id
from "Role" r
join "Permission" p on p."tenantId" = r."tenantId"
where r."tenantId" = 'tenant_alkylation'
  and r.name in ('Platform Admin', 'Corporate Admin', 'Site Admin', 'Plant Manager', 'HSE Manager', 'Process Engineer', 'Operations Supervisor', 'Maintenance Supervisor')
  and p.key in (
    'pssr.training.view', 'pssr.training.generate', 'pssr.training.assign', 'pssr.training.complete', 'pssr.training.verify', 'pssr.training.waive', 'pssr.training.evidence_upload',
    'pssr.testing.view', 'pssr.testing.generate', 'pssr.testing.create', 'pssr.testing.edit', 'pssr.testing.pass', 'pssr.testing.fail', 'pssr.testing.verify', 'pssr.testing.waive', 'pssr.testing.evidence_upload',
    'pssr.punch.view', 'pssr.punch.create', 'pssr.punch.edit', 'pssr.punch.close', 'pssr.punch.verify', 'pssr.punch.defer', 'pssr.punch.reopen', 'pssr.punch.sync', 'pssr.punch.evidence_upload'
  )
on conflict do nothing;
