alter table public.hazop_linked_records add column if not exists company_id text;
alter table public.hazop_linked_records add column if not exists site_id text;
alter table public.hazop_linked_records add column if not exists linked_module text;
alter table public.hazop_linked_records add column if not exists linked_record_type text;
alter table public.hazop_linked_records add column if not exists linked_record_id text;
alter table public.hazop_linked_records add column if not exists linked_record_number text;
alter table public.hazop_linked_records add column if not exists linked_record_title text;
alter table public.hazop_linked_records add column if not exists relationship_type text not null default 'Related';
alter table public.hazop_linked_records add column if not exists dependency_direction text not null default 'Reference only';
alter table public.hazop_linked_records add column if not exists blocking_rule text not null default 'Not blocking';
alter table public.hazop_linked_records add column if not exists blocking_status text not null default 'Not Blocking';
alter table public.hazop_linked_records add column if not exists link_reason text;
alter table public.hazop_linked_records add column if not exists notes text;
alter table public.hazop_linked_records add column if not exists owner_id text;
alter table public.hazop_linked_records add column if not exists equipment_tag text;
alter table public.hazop_linked_records add column if not exists document_version text;
alter table public.hazop_linked_records add column if not exists record_status text;
alter table public.hazop_linked_records add column if not exists last_synced_at timestamptz;
alter table public.hazop_linked_records add column if not exists updated_by text;
alter table public.hazop_linked_records add column if not exists updated_at timestamptz not null default now();

update public.hazop_linked_records
set linked_module = coalesce(linked_module, record_type),
    linked_record_type = coalesce(linked_record_type, record_type),
    linked_record_id = coalesce(linked_record_id, record_id),
    linked_record_number = coalesce(linked_record_number, record_number),
    linked_record_title = coalesce(linked_record_title, title),
    link_reason = coalesce(link_reason, relationship_type)
where linked_record_id is null or linked_module is null;

create unique index if not exists hazop_linked_records_unique_record
on public.hazop_linked_records(study_id, coalesce(linked_module, record_type), coalesce(linked_record_id, record_id));

create table if not exists public.hazop_linked_record_blockers (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  linked_record_id text references public.hazop_linked_records(id) on delete cascade,
  blocker_type text not null,
  blocker_description text not null,
  severity text not null default 'Medium',
  status text not null default 'Open',
  source_module text,
  source_record_id text,
  owner_id text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text
);

alter table public.hazop_signoffs add column if not exists company_id text;
alter table public.hazop_signoffs add column if not exists site_id text;
alter table public.hazop_signoffs add column if not exists signoff_role text;
alter table public.hazop_signoffs add column if not exists signature_role text;
alter table public.hazop_signoffs add column if not exists required boolean not null default true;
alter table public.hazop_signoffs add column if not exists assigned_user_id text;
alter table public.hazop_signoffs add column if not exists signer_user_id text;
alter table public.hazop_signoffs add column if not exists discipline text;
alter table public.hazop_signoffs add column if not exists sequence_order integer not null default 100;
alter table public.hazop_signoffs add column if not exists requested_by text;
alter table public.hazop_signoffs add column if not exists requested_at timestamptz;
alter table public.hazop_signoffs add column if not exists signed_by text;
alter table public.hazop_signoffs add column if not exists signed_at timestamptz;
alter table public.hazop_signoffs add column if not exists rejected_by text;
alter table public.hazop_signoffs add column if not exists rejected_at timestamptz;
alter table public.hazop_signoffs add column if not exists rejection_reason text;
alter table public.hazop_signoffs add column if not exists comment text;
alter table public.hazop_signoffs add column if not exists e_signature_id text;
alter table public.hazop_signoffs add column if not exists signature_snapshot jsonb;
alter table public.hazop_signoffs add column if not exists superseded_at timestamptz;
alter table public.hazop_signoffs add column if not exists superseded_by_change_id text;
alter table public.hazop_signoffs add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hazop_signoffs' and column_name = 'role'
  ) then
    execute 'update public.hazop_signoffs
      set signoff_role = coalesce(signoff_role, role),
          signature_role = coalesce(signature_role, role)
      where signoff_role is null or signature_role is null';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hazop_signoffs' and column_name = 'user_id'
  ) then
    execute 'update public.hazop_signoffs
      set assigned_user_id = coalesce(assigned_user_id, user_id),
          signer_user_id = coalesce(signer_user_id, user_id),
          signed_by = coalesce(signed_by, user_id)
      where assigned_user_id is null or signer_user_id is null or signed_by is null';
  end if;

  update public.hazop_signoffs
  set signoff_role = coalesce(signoff_role, signature_role, 'HAZOP Sign-off'),
      signature_role = coalesce(signature_role, signoff_role, 'HAZOP Sign-off'),
      assigned_user_id = coalesce(assigned_user_id, signer_user_id),
      signer_user_id = coalesce(signer_user_id, assigned_user_id),
      signed_by = coalesce(signed_by, signer_user_id),
      updated_at = coalesce(updated_at, now())
  where signoff_role is null
     or signature_role is null
     or assigned_user_id is null
     or signer_user_id is null
     or signed_by is null
     or updated_at is null;
end $$;

create table if not exists public.hazop_review_comments (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  comment_type text not null default 'General',
  comment_text text not null,
  linked_node_id text,
  linked_scenario_id text,
  linked_recommendation_id text,
  linked_safeguard_id text,
  assigned_to text,
  due_date date,
  status text not null default 'Open',
  resolved_by text,
  resolved_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hazop_readiness_checks (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  check_key text not null,
  check_label text not null,
  check_group text not null,
  status text not null default 'Incomplete',
  severity text not null default 'Medium',
  related_record_type text,
  related_record_id text,
  blocker boolean not null default false,
  message text,
  last_checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, study_id, check_key)
);

create table if not exists public.hazop_approval_workflows (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  workflow_instance_id text,
  status text not null default 'Not Started',
  started_by text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, study_id)
);

create table if not exists public.hazop_closure_blockers (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  blocker_source text not null,
  blocker_type text not null,
  description text not null,
  severity text not null default 'Medium',
  related_record_type text,
  related_record_id text,
  owner_id text,
  status text not null default 'Open',
  resolved_by text,
  resolved_at timestamptz,
  override_reason text,
  overridden_by text,
  overridden_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hazop_linked_record_blockers_study_idx on public.hazop_linked_record_blockers(tenant_id, study_id, status);
create index if not exists hazop_review_comments_study_idx on public.hazop_review_comments(tenant_id, study_id, status);
create index if not exists hazop_readiness_checks_study_idx on public.hazop_readiness_checks(tenant_id, study_id, status);
create index if not exists hazop_closure_blockers_study_idx on public.hazop_closure_blockers(tenant_id, study_id, status);

alter table public.hazop_linked_record_blockers enable row level security;
alter table public.hazop_review_comments enable row level security;
alter table public.hazop_readiness_checks enable row level security;
alter table public.hazop_approval_workflows enable row level security;
alter table public.hazop_closure_blockers enable row level security;

grant select, insert, update, delete on public.hazop_linked_record_blockers to authenticated;
grant select, insert, update, delete on public.hazop_review_comments to authenticated;
grant select, insert, update, delete on public.hazop_readiness_checks to authenticated;
grant select, insert, update, delete on public.hazop_approval_workflows to authenticated;
grant select, insert, update, delete on public.hazop_closure_blockers to authenticated;

do $$
declare
  permission_key text;
begin
  if to_regclass('public."Permission"') is not null then
    foreach permission_key in array array[
      'hazop.linked_records.view',
      'hazop.linked_records.create',
      'hazop.linked_records.edit',
      'hazop.linked_records.delete',
      'hazop.linked_records.sync',
      'hazop.linked_records.export',
      'hazop.review.view',
      'hazop.review.start',
      'hazop.review.request_approval',
      'hazop.review.approve',
      'hazop.review.reject',
      'hazop.review.return_for_rework',
      'hazop.review.close',
      'hazop.review.reopen',
      'hazop.review.comments.create',
      'hazop.review.comments.resolve',
      'hazop.review.export_package',
      'hazop.signoff.view',
      'hazop.signoff.request',
      'hazop.signoff.sign',
      'hazop.signoff.reject',
      'hazop.signoff.delegate'
    ] loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label", "action", "description")
      select gen_random_uuid()::text, t."id", permission_key, 'hazop', initcap(replace(permission_key, '.', ' ')), split_part(permission_key, '.', array_length(string_to_array(permission_key, '.'), 1)), permission_key
      from public."Tenant" t
      where not exists (
        select 1 from public."Permission" p
        where p."tenantId" = t."id" and p."key" = permission_key
      );
    end loop;

    insert into public."RolePermission" ("roleId", "permissionId")
    select r."id", p."id"
    from public."Role" r
    join public."Permission" p on p."tenantId" = r."tenantId"
    where p."key" in (
      'hazop.linked_records.view',
      'hazop.linked_records.create',
      'hazop.linked_records.edit',
      'hazop.linked_records.delete',
      'hazop.linked_records.sync',
      'hazop.linked_records.export',
      'hazop.review.view',
      'hazop.review.start',
      'hazop.review.request_approval',
      'hazop.review.approve',
      'hazop.review.reject',
      'hazop.review.return_for_rework',
      'hazop.review.close',
      'hazop.review.reopen',
      'hazop.review.comments.create',
      'hazop.review.comments.resolve',
      'hazop.review.export_package',
      'hazop.signoff.view',
      'hazop.signoff.request',
      'hazop.signoff.sign',
      'hazop.signoff.reject',
      'hazop.signoff.delegate'
    )
    and (
      lower(r."key") in ('super_admin', 'company_admin', 'site_admin', 'plant_manager', 'hse_manager', 'process_engineer')
      or lower(r."name") in ('super admin', 'company admin', 'site admin', 'plant manager', 'hse manager', 'process engineer')
    )
    and not exists (
      select 1 from public."RolePermission" rp
      where rp."roleId" = r."id" and rp."permissionId" = p."id"
    );
  end if;
end $$;
