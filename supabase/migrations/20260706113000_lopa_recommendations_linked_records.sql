alter table public.lopa_studies
  add column if not exists recommendation_status text not null default 'Not Started',
  add column if not exists action_status text not null default 'Not Started',
  add column if not exists linked_record_status text not null default 'Not Started',
  add column if not exists review_readiness_status text not null default 'Not Ready',
  add column if not exists open_recommendations_count integer not null default 0,
  add column if not exists open_actions_count integer not null default 0,
  add column if not exists linked_records_count integer not null default 0;

create table if not exists public.lopa_recommendations (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  recommendation_number text not null,
  title text not null,
  description text not null,
  source_type text not null,
  source_tab text,
  source_record_id text,
  source_snapshot_json jsonb not null default '{}'::jsonb,
  recommendation_type text,
  priority text not null default 'Medium',
  risk_relevance text,
  blocking boolean not null default false,
  owner_id text,
  responsible_discipline text,
  due_date date,
  required_before_review boolean not null default false,
  required_before_startup boolean not null default false,
  required_before_closure boolean not null default false,
  status text not null default 'Draft',
  rejection_reason text,
  defer_reason text,
  closure_notes text,
  closure_evidence_status text not null default 'Not Required',
  verification_required boolean not null default false,
  verified_by text,
  verified_at timestamptz,
  verification_notes text,
  created_by text,
  updated_by text,
  deleted_by text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, lopa_study_id, recommendation_number)
);

create table if not exists public.lopa_recommendation_action_links (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  recommendation_id text references public.lopa_recommendations(id) on delete cascade,
  action_id text not null,
  relationship_type text not null default 'Linked Action',
  blocking boolean not null default true,
  linked_by text,
  linked_at timestamptz not null default now(),
  unlinked_by text,
  unlinked_at timestamptz,
  unlink_reason text
);

create table if not exists public.lopa_recommendation_evidence_links (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  recommendation_id text references public.lopa_recommendations(id) on delete cascade,
  evidence_type text not null,
  source_module text,
  source_record_id text,
  document_id text,
  relationship_type text,
  required boolean not null default false,
  status text not null default 'Linked',
  linked_by text,
  linked_at timestamptz not null default now(),
  notes text
);

create table if not exists public.lopa_linked_records (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  record_type text not null,
  source_module text not null,
  source_record_id text not null,
  record_number text,
  record_title text,
  relationship_type text not null,
  required boolean not null default false,
  blocking boolean not null default false,
  access_status text not null default 'Accessible',
  source_status text,
  snapshot_status text not null default 'Current',
  source_changed boolean not null default false,
  source_snapshot_json jsonb not null default '{}'::jsonb,
  current_source_summary_json jsonb not null default '{}'::jsonb,
  change_summary_json jsonb not null default '{}'::jsonb,
  impact_level text not null default 'None',
  last_checked_at timestamptz,
  linked_by text,
  linked_at timestamptz not null default now(),
  updated_by text,
  updated_at timestamptz not null default now(),
  unlinked_by text,
  unlinked_at timestamptz,
  unlink_reason text,
  notes text
);

create table if not exists public.lopa_linked_record_history (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  linked_record_id text references public.lopa_linked_records(id) on delete cascade,
  event_type text not null,
  event_title text not null,
  event_description text,
  actor_user_id text,
  before_values_json jsonb,
  after_values_json jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lopa_recommendations_study_idx on public.lopa_recommendations (tenant_id, lopa_study_id, status, priority, blocking);
create index if not exists lopa_recommendation_action_links_study_idx on public.lopa_recommendation_action_links (tenant_id, lopa_study_id, recommendation_id, action_id);
create index if not exists lopa_recommendation_evidence_links_study_idx on public.lopa_recommendation_evidence_links (tenant_id, lopa_study_id, recommendation_id, status);
create index if not exists lopa_linked_records_study_idx on public.lopa_linked_records (tenant_id, lopa_study_id, source_module, record_type, required, blocking, source_changed);
create index if not exists lopa_linked_record_history_link_idx on public.lopa_linked_record_history (tenant_id, linked_record_id, created_at);

alter table public.lopa_recommendations enable row level security;
alter table public.lopa_recommendation_action_links enable row level security;
alter table public.lopa_recommendation_evidence_links enable row level security;
alter table public.lopa_linked_records enable row level security;
alter table public.lopa_linked_record_history enable row level security;

grant select, insert, update, delete on public.lopa_recommendations to authenticated;
grant select, insert, update, delete on public.lopa_recommendation_action_links to authenticated;
grant select, insert, update, delete on public.lopa_recommendation_evidence_links to authenticated;
grant select, insert, update, delete on public.lopa_linked_records to authenticated;
grant select, insert, update, delete on public.lopa_linked_record_history to authenticated;

do $$
declare
  permission_key text;
  permission_keys text[] := array[
    'lopa.recommendations.view',
    'lopa.recommendations.create',
    'lopa.recommendations.edit',
    'lopa.recommendations.delete',
    'lopa.recommendations.change_status',
    'lopa.recommendations.verify',
    'lopa.recommendations.reopen',
    'lopa.recommendations.export',
    'lopa.actions.view',
    'lopa.actions.create',
    'lopa.actions.link',
    'lopa.actions.unlink',
    'lopa.actions.sync',
    'lopa.actions.verify_closure',
    'lopa.actions.escalate',
    'lopa.actions.send_reminder',
    'lopa.linked_records.view',
    'lopa.linked_records.create',
    'lopa.linked_records.edit',
    'lopa.linked_records.delete',
    'lopa.linked_records.sync',
    'lopa.linked_records.compare',
    'lopa.linked_records.export',
    'lopa.linked_records.manage_required',
    'lopa.linked_records.manage_blocking'
  ];
begin
  foreach permission_key in array permission_keys loop
    if to_regclass('public."Permission"') is not null then
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, t."id", permission_key, 'lopa', permission_key
      from public."Tenant" t
      where not exists (select 1 from public."Permission" p where p."tenantId" = t."id" and p."key" = permission_key);
    elsif to_regclass('public.permissions') is not null then
      if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'permissions' and column_name = 'module') then
        insert into public.permissions (id, key, module, name, description)
        values (gen_random_uuid()::text, permission_key, 'LOPA', permission_key, permission_key)
        on conflict (key) do nothing;
      else
        insert into public.permissions (id, key, name, description)
        values (gen_random_uuid()::text, permission_key, permission_key, permission_key)
        on conflict (key) do nothing;
      end if;
    end if;
  end loop;

  if to_regclass('public."RolePermission"') is not null and to_regclass('public."Role"') is not null and to_regclass('public."Permission"') is not null then
    insert into public."RolePermission" ("roleId", "permissionId")
    select r."id", p."id"
    from public."Role" r
    join public."Permission" p on p."tenantId" = r."tenantId"
    where p."key" = any(permission_keys)
      and lower(r."name") in ('super admin', 'company admin', 'site admin', 'hse manager', 'process safety lead', 'process safety engineer', 'plant manager')
      and not exists (
        select 1
        from public."RolePermission" rp
        where rp."roleId" = r."id"
          and rp."permissionId" = p."id"
      );
  end if;
end $$;
