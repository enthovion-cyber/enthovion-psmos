alter table moc_temporary_controls add column if not exists status text not null default 'Active';
alter table moc_temporary_controls add column if not exists max_duration_days integer not null default 90;
alter table moc_temporary_controls add column if not exists current_duration_days integer;
alter table moc_temporary_controls add column if not exists temporary_operating_limits text;
alter table moc_temporary_controls add column if not exists temporary_procedure_reference text;
alter table moc_temporary_controls add column if not exists review_frequency text;
alter table moc_temporary_controls add column if not exists responsible_owner_id text;
alter table moc_temporary_controls add column if not exists removal_verification_required boolean not null default true;
alter table moc_temporary_controls add column if not exists removal_completed boolean not null default false;
alter table moc_temporary_controls add column if not exists removal_completed_by text;
alter table moc_temporary_controls add column if not exists removal_completed_at timestamptz;
alter table moc_temporary_controls add column if not exists removal_evidence_attachment_id text;
alter table moc_temporary_controls add column if not exists normalization_risk boolean not null default false;
alter table moc_temporary_controls add column if not exists extension_count integer not null default 0;

create table if not exists moc_temporary_extensions (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  moc_id text not null references mocs(id) on delete cascade,
  old_expiry_date date,
  requested_expiry_date date not null,
  approved_expiry_date date,
  justification text not null,
  risk_reassessment text,
  status text not null default 'Pending Re-Approval',
  requested_by text,
  approved_by text,
  approved_at timestamptz,
  workflow_instance_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table moc_emergency_controls add column if not exists bypass_reason text;
alter table moc_emergency_controls add column if not exists immediate_controls text;
alter table moc_emergency_controls add column if not exists immediate_risk_controls text;
alter table moc_emergency_controls add column if not exists implemented_at timestamptz;
alter table moc_emergency_controls add column if not exists implementation_datetime timestamptz;
alter table moc_emergency_controls add column if not exists affected_equipment_area text;
alter table moc_emergency_controls add column if not exists initial_approval_authority_id text;
alter table moc_emergency_controls add column if not exists review_due_at timestamptz;
alter table moc_emergency_controls add column if not exists post_review_due_date timestamptz;
alter table moc_emergency_controls add column if not exists permanent_moc_required boolean not null default false;

create table if not exists moc_emergency_reviews (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  moc_id text not null references mocs(id) on delete cascade,
  review_findings text not null,
  additional_actions_required boolean not null default false,
  completed_by text,
  completed_at timestamptz,
  status text not null default 'Completed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists moc_temporary_extensions_moc_idx on moc_temporary_extensions(tenant_id, moc_id, status);
create index if not exists moc_temporary_controls_expiry_idx on moc_temporary_controls(tenant_id, site_id, expiry_date, status);
create index if not exists moc_emergency_reviews_moc_idx on moc_emergency_reviews(tenant_id, moc_id, status);
create index if not exists moc_emergency_controls_review_idx on moc_emergency_controls(tenant_id, site_id, review_due_at, review_status);

alter table moc_temporary_extensions enable row level security;
alter table moc_emergency_reviews enable row level security;

insert into "Permission" (id, "tenantId", key, "moduleKey", label)
values
  ('perm_moc_temporary_view', 'tenant_alkylation', 'moc.temporary.view', 'moc', 'View Temporary MOC Controls'),
  ('perm_moc_temporary_edit', 'tenant_alkylation', 'moc.temporary.edit', 'moc', 'Edit Temporary MOC Controls'),
  ('perm_moc_temporary_approve_extension', 'tenant_alkylation', 'moc.temporary.approve_extension', 'moc', 'Approve Temporary MOC Extension'),
  ('perm_moc_temporary_close', 'tenant_alkylation', 'moc.temporary.close', 'moc', 'Close Temporary MOC'),
  ('perm_moc_emergency_view', 'tenant_alkylation', 'moc.emergency.view', 'moc', 'View Emergency MOC Controls'),
  ('perm_moc_emergency_edit', 'tenant_alkylation', 'moc.emergency.edit', 'moc', 'Edit Emergency MOC Controls'),
  ('perm_moc_emergency_review', 'tenant_alkylation', 'moc.emergency.review', 'moc', 'Complete Emergency MOC Review'),
  ('perm_moc_emergency_convert', 'tenant_alkylation', 'moc.emergency.convert', 'moc', 'Convert Emergency MOC')
on conflict (id) do update set key = excluded.key, label = excluded.label, "moduleKey" = excluded."moduleKey";

insert into "RolePermission" ("roleId", "permissionId")
select r.id, p.id
from "Role" r
join "Permission" p on p."tenantId" = r."tenantId"
where r."tenantId" = 'tenant_alkylation'
  and r.name in ('Platform Admin', 'Corporate Admin', 'Site Admin', 'Plant Manager', 'HSE Manager', 'Process Engineer', 'Operations Supervisor')
  and (p.key like 'moc.temporary.%' or p.key like 'moc.emergency.%')
on conflict do nothing;
