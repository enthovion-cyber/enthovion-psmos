create table if not exists workflow_templates (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text references "Site"(id) on delete cascade,
  module text not null,
  name text not null,
  description text,
  status text not null default 'DRAFT',
  is_default boolean not null default false,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workflow_template_steps (
  id text primary key,
  template_id text not null references workflow_templates(id) on delete cascade,
  step_name text not null,
  step_type text not null default 'Approval',
  sequence integer not null,
  assigned_role_id text references "Role"(id) on delete set null,
  assigned_user_id text references "User"(id) on delete set null,
  assigned_department_id text references "Department"(id) on delete set null,
  approval_mode text not null default 'Single',
  parallel_group text,
  condition_rule jsonb,
  sla_hours integer,
  is_required boolean not null default true,
  can_reject boolean not null default true,
  can_override boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(template_id, sequence, step_name)
);

create table if not exists workflow_instances (
  id text primary key,
  template_id text references workflow_templates(id) on delete set null,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text references "Site"(id) on delete set null,
  module text not null,
  record_id text not null,
  record_number text not null,
  context_data jsonb not null default '{}'::jsonb,
  status text not null default 'Draft',
  started_by text references "User"(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists workflow_instance_steps (
  id text primary key,
  workflow_instance_id text not null references workflow_instances(id) on delete cascade,
  template_step_id text references workflow_template_steps(id) on delete set null,
  step_name text not null,
  step_type text not null default 'Approval',
  sequence integer not null,
  assigned_to_user_id text references "User"(id) on delete set null,
  assigned_to_role_id text references "Role"(id) on delete set null,
  assigned_to_department_id text references "Department"(id) on delete set null,
  approval_mode text not null default 'Single',
  parallel_group text,
  is_required boolean not null default true,
  can_reject boolean not null default true,
  can_override boolean not null default false,
  status text not null default 'Pending',
  due_at timestamptz,
  completed_by text references "User"(id) on delete set null,
  completed_at timestamptz,
  comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workflow_approvals (
  id text primary key,
  workflow_instance_id text not null references workflow_instances(id) on delete cascade,
  workflow_step_id text not null references workflow_instance_steps(id) on delete cascade,
  approver_id text not null references "User"(id) on delete cascade,
  decision text not null,
  comment text,
  ip_address text,
  created_at timestamptz not null default now(),
  unique(workflow_step_id, approver_id, decision)
);

create table if not exists workflow_comments (
  id text primary key,
  workflow_instance_id text not null references workflow_instances(id) on delete cascade,
  workflow_step_id text references workflow_instance_steps(id) on delete cascade,
  author_id text references "User"(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workflow_history (
  id text primary key,
  workflow_instance_id text not null references workflow_instances(id) on delete cascade,
  event_type text not null,
  description text not null,
  user_id text references "User"(id) on delete set null,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);

create table if not exists workflow_escalations (
  id text primary key,
  workflow_instance_id text not null references workflow_instances(id) on delete cascade,
  workflow_step_id text not null references workflow_instance_steps(id) on delete cascade,
  escalated_to text references "User"(id) on delete set null,
  escalation_level integer not null default 1,
  reason text not null,
  escalated_at timestamptz not null default now()
);

create index if not exists workflow_templates_tenant_module_idx on workflow_templates(tenant_id, module);
create unique index if not exists workflow_templates_default_idx on workflow_templates(tenant_id, site_id, module) where is_default = true and status = 'ACTIVE';
create index if not exists workflow_template_steps_template_idx on workflow_template_steps(template_id, sequence);
create index if not exists workflow_instances_record_idx on workflow_instances(tenant_id, module, record_id);
create index if not exists workflow_instances_site_status_idx on workflow_instances(tenant_id, site_id, status);
create index if not exists workflow_instance_steps_active_idx on workflow_instance_steps(workflow_instance_id, status, due_at);
create index if not exists workflow_history_instance_idx on workflow_history(workflow_instance_id, created_at desc);

alter table workflow_templates enable row level security;
alter table workflow_template_steps enable row level security;
alter table workflow_instances enable row level security;
alter table workflow_instance_steps enable row level security;
alter table workflow_approvals enable row level security;
alter table workflow_comments enable row level security;
alter table workflow_history enable row level security;
alter table workflow_escalations enable row level security;

insert into "Permission" (id, "tenantId", key, "moduleKey", label)
values
  ('perm_workflow_view', 'tenant_alkylation', 'workflow.view', 'workflows', 'View Workflow Engine'),
  ('perm_workflow_create', 'tenant_alkylation', 'workflow.create', 'workflows', 'Start Workflows'),
  ('perm_workflow_edit', 'tenant_alkylation', 'workflow.edit', 'workflows', 'Edit Workflows'),
  ('perm_workflow_delete', 'tenant_alkylation', 'workflow.delete', 'workflows', 'Delete Workflow Templates'),
  ('perm_workflow_approve', 'tenant_alkylation', 'workflow.approve', 'workflows', 'Approve Workflow Steps'),
  ('perm_workflow_reject', 'tenant_alkylation', 'workflow.reject', 'workflows', 'Reject Workflow Steps'),
  ('perm_workflow_override', 'tenant_alkylation', 'workflow.override', 'workflows', 'Override Workflows'),
  ('perm_workflow_manage_templates', 'tenant_alkylation', 'workflow.manage_templates', 'workflows', 'Manage Workflow Templates')
on conflict (id) do update set key = excluded.key, label = excluded.label;

insert into "RolePermission" ("roleId", "permissionId")
select r.id, p.id
from "Role" r
cross join "Permission" p
where r.id in ('role_platform_admin', 'role_corporate_admin', 'role_site_admin', 'role_hse_manager')
  and p.id in ('perm_workflow_view', 'perm_workflow_create', 'perm_workflow_edit', 'perm_workflow_delete', 'perm_workflow_approve', 'perm_workflow_reject', 'perm_workflow_override', 'perm_workflow_manage_templates')
on conflict do nothing;

insert into workflow_templates (id, tenant_id, company_id, site_id, module, name, description, status, is_default, created_by)
values
  ('wf_tpl_moc_standard', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'MOC', 'MOC Standard Approval', 'Originator to process engineering, operations, HSE, and plant manager with conditional high risk routing.', 'ACTIVE', true, 'user_imran_shah'),
  ('wf_tpl_ptw_standard', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'PTW', 'PTW Standard Permit Approval', 'Requester, permit issuer, and area authority approval chain.', 'ACTIVE', true, 'user_imran_shah'),
  ('wf_tpl_pssr_standard', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'PSSR', 'PSSR Startup Authorization', 'Engineering, operations, maintenance, HSE, and plant manager startup authorization.', 'ACTIVE', true, 'user_imran_shah'),
  ('wf_tpl_document_approval', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'DOCUMENTS', 'Document Approval', 'Author, reviewer, and approver document control workflow.', 'ACTIVE', true, 'user_imran_shah')
on conflict (id) do update set status = excluded.status, is_default = excluded.is_default, updated_at = now();

insert into workflow_template_steps (id, template_id, step_name, step_type, sequence, assigned_role_id, approval_mode, parallel_group, condition_rule, sla_hours, is_required, can_reject, can_override)
values
  ('wf_step_moc_1', 'wf_tpl_moc_standard', 'Process Engineer Review', 'Review', 1, 'role_process_engineer', 'Single', null, null, 24, true, true, false),
  ('wf_step_moc_2', 'wf_tpl_moc_standard', 'Operations Review', 'Approval', 2, 'role_operations_supervisor', 'Single', 'moc_parallel_review', null, 24, true, true, false),
  ('wf_step_moc_3', 'wf_tpl_moc_standard', 'HSE Manager Review', 'Approval', 2, 'role_hse_manager', 'Single', 'moc_parallel_review', null, 24, true, true, false),
  ('wf_step_moc_4', 'wf_tpl_moc_standard', 'HSE Director Review', 'Approval', 3, null, 'Single', null, '{"field":"riskLevel","operator":"in","value":["High","Critical"]}', 24, false, true, true),
  ('wf_step_moc_5', 'wf_tpl_moc_standard', 'Plant Manager Final Approval', 'Signoff', 4, 'role_plant_manager', 'Single', null, '{"field":"riskLevel","operator":"in","value":["High","Critical"]}', 24, true, true, true),
  ('wf_step_ptw_1', 'wf_tpl_ptw_standard', 'Permit Issuer Review', 'Approval', 1, 'role_permit_issuer', 'Single', null, null, 4, true, true, false),
  ('wf_step_ptw_2', 'wf_tpl_ptw_standard', 'Area Authority Approval', 'Approval', 2, 'role_operations_supervisor', 'Single', null, null, 4, true, true, false),
  ('wf_step_ptw_3', 'wf_tpl_ptw_standard', 'Gas Tester Approval', 'Review', 3, 'role_hse_manager', 'Single', null, '{"field":"permitType","operator":"eq","value":"Confined Space"}', 2, false, true, false),
  ('wf_step_pssr_1', 'wf_tpl_pssr_standard', 'Engineering Signoff', 'Signoff', 1, 'role_process_engineer', 'Single', 'pssr_parallel_signoff', null, 24, true, true, false),
  ('wf_step_pssr_2', 'wf_tpl_pssr_standard', 'Operations Signoff', 'Signoff', 1, 'role_operations_supervisor', 'Single', 'pssr_parallel_signoff', null, 24, true, true, false),
  ('wf_step_pssr_3', 'wf_tpl_pssr_standard', 'Maintenance Signoff', 'Signoff', 1, 'role_maintenance_supervisor', 'Single', 'pssr_parallel_signoff', null, 24, true, true, false),
  ('wf_step_pssr_4', 'wf_tpl_pssr_standard', 'HSE Signoff', 'Signoff', 2, 'role_hse_manager', 'Single', null, null, 24, true, true, false),
  ('wf_step_pssr_5', 'wf_tpl_pssr_standard', 'Plant Manager Authorization', 'Signoff', 3, 'role_plant_manager', 'Single', null, null, 24, true, true, true),
  ('wf_step_doc_1', 'wf_tpl_document_approval', 'Reviewer Check', 'Review', 1, 'role_process_engineer', 'Single', null, null, 24, true, true, false),
  ('wf_step_doc_2', 'wf_tpl_document_approval', 'Approver Signoff', 'Approval', 2, 'role_hse_manager', 'Single', null, null, 24, true, true, false),
  ('wf_step_doc_3', 'wf_tpl_document_approval', 'Operations Manager Approval', 'Approval', 3, 'role_operations_supervisor', 'Single', null, '{"field":"documentType","operator":"eq","value":"SOP"}', 24, false, true, false)
on conflict (id) do update set step_name = excluded.step_name, sequence = excluded.sequence, condition_rule = excluded.condition_rule, updated_at = now();
