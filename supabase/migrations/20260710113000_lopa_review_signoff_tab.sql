create extension if not exists pgcrypto;

alter table public.lopa_studies
  add column if not exists review_status text not null default 'Draft',
  add column if not exists approval_status text not null default 'Not Requested',
  add column if not exists signature_status text not null default 'Not Required',
  add column if not exists current_review_step text,
  add column if not exists review_workflow_id text,
  add column if not exists locked boolean not null default false,
  add column if not exists locked_by text,
  add column if not exists locked_at timestamptz,
  add column if not exists review_submitted_at timestamptz,
  add column if not exists last_approved_at timestamptz,
  add column if not exists last_signed_at timestamptz;

create table if not exists public.lopa_review_workflows (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  workflow_instance_id text,
  workflow_status text not null default 'Draft',
  current_step text not null default 'Draft',
  submitted_by text,
  submitted_at timestamptz,
  review_started_at timestamptz,
  review_completed_at timestamptz,
  approval_status text not null default 'Not Requested',
  approved_by text,
  approved_at timestamptz,
  rejected_by text,
  rejected_at timestamptz,
  rejection_reason text,
  changes_requested_by text,
  changes_requested_at timestamptz,
  changes_requested_reason text,
  withdrawn_by text,
  withdrawn_at timestamptz,
  withdraw_reason text,
  closed_by text,
  closed_at timestamptz,
  reopened_by text,
  reopened_at timestamptz,
  reopen_reason text,
  superseded_by_workflow_id text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, lopa_study_id)
);

create table if not exists public.lopa_review_participants (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  workflow_id text not null references public.lopa_review_workflows(id) on delete cascade,
  user_id text not null,
  team_member_id text,
  review_role text not null,
  discipline text,
  required_reviewer boolean not null default true,
  approver boolean not null default false,
  signature_required boolean not null default false,
  review_sequence integer not null default 1,
  decision text not null default 'Pending',
  decision_reason text,
  due_date timestamptz,
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  signature_id text,
  signature_status text not null default 'Pending',
  reminder_sent_at timestamptz,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, workflow_id, user_id, review_role)
);

create table if not exists public.lopa_review_comments (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  workflow_id text not null references public.lopa_review_workflows(id) on delete cascade,
  comment_number text not null,
  comment_type text not null default 'General comment',
  related_tab text,
  related_record_type text,
  related_record_id text,
  title text not null,
  comment_text text not null,
  severity text not null default 'Medium',
  blocking boolean not null default false,
  status text not null default 'Open',
  owner_id text,
  due_date timestamptz,
  resolution_notes text,
  resolved_by text,
  resolved_at timestamptz,
  rejected_reason text,
  deferred_reason text,
  created_by text,
  updated_by text,
  deleted_by text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, lopa_study_id, comment_number)
);

create table if not exists public.lopa_review_comment_threads (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  comment_id text not null references public.lopa_review_comments(id) on delete cascade,
  parent_thread_id text,
  message text not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lopa_review_approval_snapshots (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  workflow_id text not null references public.lopa_review_workflows(id) on delete restrict,
  snapshot_version integer not null,
  snapshot_status text not null default 'Approved',
  snapshot_json jsonb not null,
  snapshot_hash text,
  calculation_version_id text,
  approval_comments text,
  approved_by text not null,
  approved_at timestamptz not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  superseded_by_snapshot_id text,
  unique (tenant_id, lopa_study_id, snapshot_version)
);

create table if not exists public.lopa_review_blockers (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  workflow_id text references public.lopa_review_workflows(id) on delete set null,
  blocker_key text not null,
  blocker_type text not null,
  source_tab text,
  source_record_type text,
  source_record_id text,
  blocker_title text not null,
  blocker_description text,
  severity text not null default 'Medium',
  blocking boolean not null default true,
  owner_id text,
  action_id text,
  accepted_exception boolean not null default false,
  exception_reason text,
  exception_approved_by text,
  exception_approved_at timestamptz,
  status text not null default 'Open',
  created_by text,
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, lopa_study_id, blocker_key)
);

create index if not exists idx_lopa_review_workflows_study on public.lopa_review_workflows (tenant_id, lopa_study_id);
create index if not exists idx_lopa_review_participants_workflow on public.lopa_review_participants (tenant_id, workflow_id, review_sequence);
create index if not exists idx_lopa_review_comments_study on public.lopa_review_comments (tenant_id, lopa_study_id, status);
create index if not exists idx_lopa_review_blockers_study on public.lopa_review_blockers (tenant_id, lopa_study_id, status);

alter table public.lopa_review_workflows enable row level security;
alter table public.lopa_review_participants enable row level security;
alter table public.lopa_review_comments enable row level security;
alter table public.lopa_review_comment_threads enable row level security;
alter table public.lopa_review_approval_snapshots enable row level security;
alter table public.lopa_review_blockers enable row level security;

grant select, insert, update, delete on public.lopa_review_workflows to authenticated;
grant select, insert, update, delete on public.lopa_review_participants to authenticated;
grant select, insert, update, delete on public.lopa_review_comments to authenticated;
grant select, insert, update, delete on public.lopa_review_comment_threads to authenticated;
grant select, insert, update, delete on public.lopa_review_approval_snapshots to authenticated;
grant select, insert, update, delete on public.lopa_review_blockers to authenticated;

do $$
declare
  permission_key text;
  permission_label text;
  permission_id text;
  role_row record;
  tenant_row record;
  permission_keys text[] := array[
    'lopa.review_signoff.view', 'lopa.review_signoff.submit', 'lopa.review_signoff.withdraw',
    'lopa.review_signoff.request_changes', 'lopa.review_signoff.approve', 'lopa.review_signoff.reject',
    'lopa.review_signoff.reopen', 'lopa.review_signoff.override_blockers', 'lopa.review_signoff.export',
    'lopa.review_participants.manage', 'lopa.review_comments.create', 'lopa.review_comments.edit',
    'lopa.review_comments.resolve', 'lopa.review_comments.reopen', 'lopa.review_comments.delete',
    'lopa.review_signatures.request', 'lopa.review_signatures.sign', 'lopa.review_signatures.view',
    'lopa.approval_snapshots.view', 'lopa.review_blockers.manage', 'lopa.review_notifications.send'
  ];
begin
  foreach permission_key in array permission_keys loop
    permission_label := initcap(replace(replace(permission_key, 'lopa.', 'LOPA '), '.', ' '));
    if to_regclass('public."Permission"') is not null and to_regclass('public."Tenant"') is not null then
      for tenant_row in select "id" from public."Tenant" loop
        if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'Permission' and column_name = 'moduleKey') then
          insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
          select gen_random_uuid()::text, tenant_row."id", permission_key, 'LOPA', permission_label
          where not exists (
            select 1 from public."Permission"
            where "tenantId" = tenant_row."id" and "key" = permission_key
          );
        else
          insert into public."Permission" ("id", "tenantId", "key", "label")
          select gen_random_uuid()::text, tenant_row."id", permission_key, permission_label
          where not exists (
            select 1 from public."Permission"
            where "tenantId" = tenant_row."id" and "key" = permission_key
          );
        end if;
        select "id" into permission_id from public."Permission" where "tenantId" = tenant_row."id" and "key" = permission_key limit 1;
        if permission_id is not null and to_regclass('public."RolePermission"') is not null then
          for role_row in select "id" from public."Role" where "tenantId" = tenant_row."id" and (lower(coalesce("name", '')) in ('super admin','company admin','site admin','process safety lead','process safety engineer','hse manager','plant manager') or lower(coalesce("key", '')) in ('super_admin','company_admin','site_admin','process_safety_lead','process_safety_engineer','hse_manager','plant_manager')) loop
            insert into public."RolePermission" ("roleId", "permissionId") values (role_row."id", permission_id) on conflict do nothing;
          end loop;
        end if;
      end loop;
    end if;
  end loop;
end $$;
