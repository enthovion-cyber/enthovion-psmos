alter table mocs add column if not exists workflow_instance_id text;
alter table mocs add column if not exists released_for_startup_at timestamptz;
alter table mocs add column if not exists released_for_startup_by text;

create table if not exists moc_workflow_blocker_snapshots (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  moc_id text not null references mocs(id) on delete cascade,
  workflow_instance_id text,
  blocker_type text not null,
  blocker_title text not null,
  blocker_description text,
  source_module text,
  source_record_id text,
  severity text not null default 'Medium',
  blocking boolean not null default true,
  status text not null default 'Open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists moc_workflow_blocker_snapshots_moc_idx on moc_workflow_blocker_snapshots(tenant_id, moc_id, status, blocking);

alter table moc_workflow_blocker_snapshots enable row level security;

insert into "Permission" (id, "tenantId", key, "moduleKey", label)
values
  ('perm_moc_workflow_view', 'tenant_alkylation', 'moc.workflow.view', 'moc', 'View MOC Approval Workflow'),
  ('perm_moc_workflow_start', 'tenant_alkylation', 'moc.workflow.start', 'moc', 'Start MOC Approval Workflow'),
  ('perm_moc_workflow_approve', 'tenant_alkylation', 'moc.workflow.approve', 'moc', 'Approve MOC Workflow Step'),
  ('perm_moc_workflow_reject', 'tenant_alkylation', 'moc.workflow.reject', 'moc', 'Reject MOC Workflow Step'),
  ('perm_moc_workflow_return', 'tenant_alkylation', 'moc.workflow.return', 'moc', 'Return MOC Workflow Step'),
  ('perm_moc_workflow_delegate', 'tenant_alkylation', 'moc.workflow.delegate', 'moc', 'Delegate MOC Workflow Step'),
  ('perm_moc_workflow_escalate', 'tenant_alkylation', 'moc.workflow.escalate', 'moc', 'Escalate MOC Workflow'),
  ('perm_moc_workflow_restart', 'tenant_alkylation', 'moc.workflow.restart', 'moc', 'Restart MOC Workflow')
on conflict (id) do update set key = excluded.key, label = excluded.label, "moduleKey" = excluded."moduleKey";

insert into "RolePermission" ("roleId", "permissionId")
select r.id, p.id
from "Role" r
join "Permission" p on p."tenantId" = r."tenantId"
where r."tenantId" = 'tenant_alkylation'
  and r.name in ('Platform Admin', 'Corporate Admin', 'Site Admin', 'Plant Manager', 'HSE Manager', 'Process Engineer')
  and p.key like 'moc.workflow.%'
on conflict do nothing;
