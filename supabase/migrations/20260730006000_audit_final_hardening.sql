create or replace function public.audit_jwt_claims()
returns jsonb
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
$$;

create or replace function public.audit_claim_text(primary_key text, fallback_key text default null)
returns text
language sql
stable
as $$
  select coalesce(
    public.audit_jwt_claims() #>> array['app_metadata', primary_key],
    public.audit_jwt_claims() ->> primary_key,
    case when fallback_key is null then null else public.audit_jwt_claims() #>> array['app_metadata', fallback_key] end,
    case when fallback_key is null then null else public.audit_jwt_claims() ->> fallback_key end
  );
$$;

create or replace function public.audit_claim_array(primary_key text, fallback_key text default null)
returns jsonb
language sql
stable
as $$
  with claims as (
    select public.audit_jwt_claims() as jwt
  ), raw_value as (
    select coalesce(
      jwt #> array['app_metadata', primary_key],
      jwt -> primary_key,
      case when fallback_key is null then null else jwt #> array['app_metadata', fallback_key] end,
      case when fallback_key is null then null else jwt -> fallback_key end,
      '[]'::jsonb
    ) as value
    from claims
  )
  select case
    when jsonb_typeof(value) = 'array' then value
    when jsonb_typeof(value) = 'string' then jsonb_build_array(value #>> '{}')
    else '[]'::jsonb
  end
  from raw_value;
$$;

create or replace function public.audit_can_access_company(target_company_id text)
returns boolean
language sql
stable
as $$
  select target_company_id is not null
    and (
      target_company_id = public.audit_claim_text('tenantId', 'activeCompanyId')
      or target_company_id = public.audit_claim_text('activeCompanyId', 'tenantId')
      or exists (
        select 1
        from jsonb_array_elements_text(public.audit_claim_array('companyIds', 'company_ids')) as company_id(value)
        where company_id.value = target_company_id
      )
    );
$$;

create or replace function public.audit_can_access_site(target_site_id text)
returns boolean
language sql
stable
as $$
  select target_site_id is null
    or target_site_id = public.audit_claim_text('selectedSiteId', 'activeSiteId')
    or target_site_id = public.audit_claim_text('activeSiteId', 'selectedSiteId')
    or exists (
      select 1
      from jsonb_array_elements_text(public.audit_claim_array('siteIds', 'site_ids')) as site_id(value)
      where site_id.value = target_site_id
    );
$$;

do $$
declare
  table_row record;
  policy_row record;
  has_company boolean;
  has_site boolean;
  scope_predicate text;
  immutable_direct_table boolean;
begin
  for table_row in
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
      and table_name like 'audit\_%' escape '\'
  loop
    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = table_row.table_name and column_name = 'company_id'
    ) into has_company;

    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = table_row.table_name and column_name = 'site_id'
    ) into has_site;

    execute format('alter table public.%I enable row level security', table_row.table_name);

    for policy_row in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = table_row.table_name
    loop
      execute format('drop policy if exists %I on public.%I', policy_row.policyname, table_row.table_name);
    end loop;

    if has_company then
      scope_predicate := 'public.audit_can_access_company(company_id)';
      if has_site then
        scope_predicate := scope_predicate || ' and public.audit_can_access_site(site_id)';
      end if;
    else
      scope_predicate := 'false';
    end if;

    execute format(
      'create policy %I on public.%I for select to authenticated using (%s)',
      table_row.table_name || '_tenant_site_select',
      table_row.table_name,
      scope_predicate
    );

    immutable_direct_table :=
      table_row.table_name like '%history%'
      or table_row.table_name like '%\_events' escape '\'
      or table_row.table_name like '%\_snapshots' escape '\'
      or table_row.table_name in (
        'audit_trend_source_records',
        'audit_trend_metric_points',
        'audit_score_input_records',
        'audit_score_rule_results',
        'audit_report_download_events',
        'audit_report_access_events',
        'audit_evidence_access_events',
        'audit_evidence_chain_of_custody_events'
      );

    if not immutable_direct_table then
      execute format(
        'create policy %I on public.%I for insert to authenticated with check (%s)',
        table_row.table_name || '_tenant_site_insert',
        table_row.table_name,
        scope_predicate
      );
      execute format(
        'create policy %I on public.%I for update to authenticated using (%s) with check (%s)',
        table_row.table_name || '_tenant_site_update',
        table_row.table_name,
        scope_predicate,
        scope_predicate
      );
      execute format(
        'create policy %I on public.%I for delete to authenticated using (%s)',
        table_row.table_name || '_tenant_site_delete',
        table_row.table_name,
        scope_predicate
      );
    end if;
  end loop;
end $$;

do $$
declare
  tenant_row record;
  permission_pair text[];
  permission_key text;
  permission_label text;
begin
  for tenant_row in select id from public."Tenant" loop
    foreach permission_pair slice 1 in array array[
      array['audit.final_hardening.view','View Audit final hardening status'],
      array['audit.final_hardening.verify','Verify Audit final hardening checklist'],
      array['audit.final_hardening.security_test','Run Audit security hardening tests'],
      array['audit.final_hardening.e2e_test','Run Audit end-to-end hardening tests'],
      array['audit.settings.summary.view','View consolidated Audit settings summary'],
      array['audit.notification.settings.view','View Audit notification settings'],
      array['audit.notification.settings.edit','Edit Audit notification settings'],
      array['audit.retention.settings.view','View Audit retention settings'],
      array['audit.retention.settings.edit','Edit Audit retention settings'],
      array['audit.global_search.index','Index Audit records in Global Search']
    ] loop
      permission_key := permission_pair[1];
      permission_label := permission_pair[2];
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_key, 'AUDIT', permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_row.id and "key" = permission_key
      );
    end loop;
  end loop;
end $$;
