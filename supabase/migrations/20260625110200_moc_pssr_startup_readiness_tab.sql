alter table moc_pssr_requirements add column if not exists pssr_required boolean not null default true;
alter table moc_pssr_requirements add column if not exists trigger_reasons jsonb not null default '[]'::jsonb;
alter table moc_pssr_requirements add column if not exists linked_pssr_number text;
alter table moc_pssr_requirements add column if not exists pssr_status text;
alter table moc_pssr_requirements add column if not exists pssr_owner_id text;
alter table moc_pssr_requirements add column if not exists checklist_completion_percent integer not null default 0;
alter table moc_pssr_requirements add column if not exists open_punch_items_count integer not null default 0;
alter table moc_pssr_requirements add column if not exists critical_punch_items_count integer not null default 0;
alter table moc_pssr_requirements add column if not exists completed_at timestamptz;

create table if not exists moc_startup_readiness_checks (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  moc_id text not null references mocs(id) on delete cascade,
  status text not null default 'Not Ready',
  readiness_score integer not null default 0,
  blockers_count integer not null default 0,
  checklist jsonb not null default '[]'::jsonb,
  checked_by text,
  checked_at timestamptz,
  released_by text,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists moc_startup_blockers (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  moc_id text not null references mocs(id) on delete cascade,
  blocker_type text not null,
  blocker_title text not null,
  blocker_description text,
  source_module text,
  source_record_id text,
  severity text not null default 'Medium',
  status text not null default 'Open',
  blocking boolean not null default true,
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists moc_startup_readiness_checks_moc_idx on moc_startup_readiness_checks(tenant_id, moc_id, checked_at desc);
create index if not exists moc_startup_blockers_moc_idx on moc_startup_blockers(tenant_id, moc_id, status, blocking);

alter table moc_startup_readiness_checks enable row level security;
alter table moc_startup_blockers enable row level security;

insert into "Permission" (id, "tenantId", key, "moduleKey", label)
values
  ('perm_moc_pssr_view', 'tenant_alkylation', 'moc.pssr.view', 'moc', 'View MOC PSSR Readiness'),
  ('perm_moc_pssr_sync', 'tenant_alkylation', 'moc.pssr.sync', 'moc', 'Sync MOC PSSR Status'),
  ('perm_moc_startup_view', 'tenant_alkylation', 'moc.startup.view', 'moc', 'View MOC Startup Readiness'),
  ('perm_moc_startup_check', 'tenant_alkylation', 'moc.startup.check', 'moc', 'Run Startup Readiness Check'),
  ('perm_moc_release_for_startup', 'tenant_alkylation', 'moc.release_for_startup', 'moc', 'Release MOC For Startup'),
  ('perm_moc_return_to_implementation', 'tenant_alkylation', 'moc.return_to_implementation', 'moc', 'Return MOC To Implementation')
on conflict (id) do update set key = excluded.key, label = excluded.label, "moduleKey" = excluded."moduleKey";

insert into "RolePermission" ("roleId", "permissionId")
select r.id, p.id
from "Role" r
join "Permission" p on p."tenantId" = r."tenantId"
where r."tenantId" = 'tenant_alkylation'
  and r.name in ('Platform Admin', 'Corporate Admin', 'Site Admin', 'Plant Manager', 'HSE Manager', 'Process Engineer', 'Operations Supervisor')
  and (p.key like 'moc.pssr.%' or p.key like 'moc.startup.%' or p.key in ('moc.release_for_startup', 'moc.return_to_implementation'))
on conflict do nothing;
