create table if not exists moc_engineering_packages (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  moc_id text not null references mocs(id) on delete cascade unique,
  company_id text,
  site_id text,
  status text not null default 'Not Started',
  readiness_status text not null default 'Not Ready',
  required_documents_count integer not null default 0,
  missing_required_documents_count integer not null default 0,
  approved_documents_count integer not null default 0,
  reviewed_by text,
  reviewed_at timestamptz,
  approved_by text,
  approved_at timestamptz,
  rejection_reason text,
  review_comments text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table moc_engineering_documents add column if not exists package_id text references moc_engineering_packages(id) on delete set null;
alter table moc_engineering_documents add column if not exists description text;
alter table moc_engineering_documents add column if not exists file_key text;
alter table moc_engineering_documents add column if not exists file_url text;
alter table moc_engineering_documents add column if not exists file_size integer;
alter table moc_engineering_documents add column if not exists controlled_document_id text;
alter table moc_engineering_documents add column if not exists controlled_document_version_id text;
alter table moc_engineering_documents add column if not exists version text;
alter table moc_engineering_documents add column if not exists status text not null default 'Uploaded';
alter table moc_engineering_documents add column if not exists is_required boolean not null default false;
alter table moc_engineering_documents add column if not exists required_before_approval boolean not null default false;
alter table moc_engineering_documents add column if not exists required_before_startup boolean not null default false;
alter table moc_engineering_documents add column if not exists required_before_closure boolean not null default true;
alter table moc_engineering_documents add column if not exists review_owner_id text;
alter table moc_engineering_documents add column if not exists review_due_date date;
alter table moc_engineering_documents add column if not exists reviewed_by text;
alter table moc_engineering_documents add column if not exists reviewed_at timestamptz;
alter table moc_engineering_documents add column if not exists approved_by text;
alter table moc_engineering_documents add column if not exists approved_at timestamptz;
alter table moc_engineering_documents add column if not exists rejection_reason text;
alter table moc_engineering_documents add column if not exists deleted_by text;
alter table moc_engineering_documents add column if not exists deleted_at timestamptz;
alter table moc_engineering_documents add column if not exists updated_at timestamptz not null default now();

update moc_engineering_documents
set
  file_key = coalesce(file_key, storage_key),
  file_size = coalesce(file_size, size_bytes),
  controlled_document_id = coalesce(controlled_document_id, document_id),
  version = coalesce(version, version_label),
  description = coalesce(description, justification);

create table if not exists moc_engineering_document_requirements (
  id text primary key,
  tenant_id text references "Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  change_type text,
  risk_level text,
  impact_area text,
  condition_rule jsonb not null default '{}'::jsonb,
  document_type text not null,
  is_required boolean not null default true,
  required_before_approval boolean not null default false,
  required_before_startup boolean not null default false,
  required_before_closure boolean not null default true,
  allow_justification boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists moc_engineering_reviews (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  moc_id text not null references mocs(id) on delete cascade,
  package_id text references moc_engineering_packages(id) on delete cascade,
  company_id text,
  site_id text,
  review_status text not null default 'Pending',
  reviewer_id text,
  comments text,
  decision text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table moc_required_actions add column if not exists source_type text;
alter table moc_required_actions add column if not exists source_record_id text;
alter table moc_required_actions add column if not exists source_question_key text;
alter table moc_required_actions add column if not exists action_title text;
alter table moc_required_actions add column if not exists owner_role_id text;
alter table moc_required_actions add column if not exists required_before_approval boolean not null default false;
alter table moc_required_actions add column if not exists evidence_required boolean not null default false;
alter table moc_required_actions add column if not exists verification_required boolean not null default true;
alter table moc_required_actions add column if not exists no_longer_required boolean not null default false;
alter table moc_required_actions add column if not exists no_longer_required_reason text;

update moc_required_actions
set
  source_type = coalesce(source_type, case when system_generated then 'Impact Assessment' else 'Manual' end),
  source_record_id = coalesce(source_record_id, moc_id),
  source_question_key = coalesce(source_question_key, source_impact_answer),
  action_title = coalesce(action_title, title),
  evidence_required = case when priority in ('HIGH', 'SAFETY_CRITICAL') then true else evidence_required end,
  verification_required = true;

create table if not exists moc_action_links (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  moc_id text not null references mocs(id) on delete cascade,
  action_id text not null,
  company_id text,
  site_id text,
  linked_module text,
  linked_record_id text,
  source_type text,
  created_at timestamptz not null default now(),
  unique (moc_id, action_id, source_type)
);

create table if not exists moc_closure_checklist (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  moc_id text not null references mocs(id) on delete cascade,
  company_id text,
  site_id text,
  checklist_key text not null,
  title text not null,
  status text not null default 'Not Required',
  required boolean not null default false,
  blocking_stage text,
  linked_action_id text,
  completed_at timestamptz,
  completed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (moc_id, checklist_key)
);

create index if not exists moc_engineering_packages_scope_idx on moc_engineering_packages(tenant_id, site_id, status);
create index if not exists moc_engineering_documents_moc_idx on moc_engineering_documents(tenant_id, moc_id, document_type, status);
create index if not exists moc_required_actions_blockers_idx on moc_required_actions(tenant_id, moc_id, required_before_startup, required_before_closure, status);
create index if not exists moc_action_links_moc_idx on moc_action_links(tenant_id, moc_id);
create index if not exists moc_closure_checklist_moc_idx on moc_closure_checklist(tenant_id, moc_id, status);

alter table moc_engineering_packages enable row level security;
alter table moc_engineering_document_requirements enable row level security;
alter table moc_engineering_reviews enable row level security;
alter table moc_action_links enable row level security;
alter table moc_closure_checklist enable row level security;

insert into "Permission" (id, "tenantId", key, "moduleKey", label)
values
  ('perm_moc_engineering_view', 'tenant_alkylation', 'moc.engineering.view', 'MOC', 'View MOC Engineering Package'),
  ('perm_moc_engineering_upload', 'tenant_alkylation', 'moc.engineering.upload', 'MOC', 'Upload MOC Engineering Documents'),
  ('perm_moc_engineering_link_document', 'tenant_alkylation', 'moc.engineering.link_document', 'MOC', 'Link MOC Engineering Documents'),
  ('perm_moc_engineering_review', 'tenant_alkylation', 'moc.engineering.review', 'MOC', 'Review MOC Engineering Package'),
  ('perm_moc_engineering_approve', 'tenant_alkylation', 'moc.engineering.approve', 'MOC', 'Approve MOC Engineering Package'),
  ('perm_moc_engineering_delete', 'tenant_alkylation', 'moc.engineering.delete', 'MOC', 'Delete MOC Engineering Documents'),
  ('perm_moc_actions_view', 'tenant_alkylation', 'moc.actions.view', 'MOC', 'View MOC Closed-Loop Actions'),
  ('perm_moc_actions_generate', 'tenant_alkylation', 'moc.actions.generate', 'MOC', 'Generate MOC Closed-Loop Actions'),
  ('perm_moc_actions_sync', 'tenant_alkylation', 'moc.actions.sync', 'MOC', 'Sync MOC Closed-Loop Actions'),
  ('perm_moc_actions_create_custom', 'tenant_alkylation', 'moc.actions.create_custom', 'MOC', 'Create Custom MOC Actions'),
  ('perm_moc_actions_mark_no_longer_required', 'tenant_alkylation', 'moc.actions.mark_no_longer_required', 'MOC', 'Mark MOC Action No Longer Required'),
  ('perm_moc_actions_view_blockers', 'tenant_alkylation', 'moc.actions.view_blockers', 'MOC', 'View MOC Action Blockers')
on conflict (id) do update set key = excluded.key, "moduleKey" = excluded."moduleKey", label = excluded.label;

insert into "RolePermission" ("roleId", "permissionId")
select r.id, p.id
from "Role" r
cross join "Permission" p
where r."tenantId" = 'tenant_alkylation'
  and r.name in ('Platform Admin', 'Corporate Admin', 'Site Admin', 'HSE Manager', 'Plant Manager', 'Process Engineer')
  and (p.key like 'moc.engineering.%' or p.key like 'moc.actions.%')
on conflict do nothing;
