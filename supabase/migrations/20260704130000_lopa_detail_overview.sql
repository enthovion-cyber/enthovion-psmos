alter table public.lopa_studies
  add column if not exists conditional_modifiers_status text not null default 'Not Started',
  add column if not exists total_pfdavg numeric,
  add column if not exists total_rrf numeric,
  add column if not exists required_rrf numeric,
  add column if not exists required_pfdavg numeric,
  add column if not exists pass_fail text,
  add column if not exists calculation_locked boolean not null default false,
  add column if not exists calculation_version text,
  add column if not exists last_calculated_by text,
  add column if not exists last_calculated_at timestamptz,
  add column if not exists installed_sil text,
  add column if not exists alarp_category text,
  add column if not exists existing_sif_id text,
  add column if not exists new_sif_required boolean not null default false,
  add column if not exists moc_required boolean not null default false,
  add column if not exists mi_proof_test_required boolean not null default false,
  add column if not exists sil_determination_status text not null default 'Not Determined',
  add column if not exists review_readiness_status text not null default 'Not Ready',
  add column if not exists closure_blockers_count integer not null default 0;

alter table public.lopa_source_snapshots
  add column if not exists source_updated_at timestamptz,
  add column if not exists source_changed_after_snapshot boolean not null default false;

alter table public.lopa_consequences
  add column if not exists endpoint text,
  add column if not exists personnel_impact boolean not null default false,
  add column if not exists environmental_impact boolean not null default false,
  add column if not exists asset_impact boolean not null default false,
  add column if not exists community_impact boolean not null default false,
  add column if not exists completion_status text not null default 'Incomplete';

alter table public.lopa_initiating_events
  add column if not exists failure_mode text,
  add column if not exists basis text,
  add column if not exists low_estimate numeric,
  add column if not exists high_estimate numeric,
  add column if not exists confidence_level text,
  add column if not exists site_modifier numeric,
  add column if not exists engineering_justification text,
  add column if not exists enabling_condition_status text not null default 'Not Reviewed',
  add column if not exists completion_status text not null default 'Incomplete';

alter table public.lopa_imported_safeguards
  add column if not exists initial_checks jsonb not null default '{}'::jsonb,
  add column if not exists pfdavg numeric,
  add column if not exists rrf numeric,
  add column if not exists pfd_rrf_status text not null default 'Pending',
  add column if not exists source text not null default 'HAZOP';

do $$
declare
  permission_key text;
  permission_keys text[] := array[
    'lopa.overview.view',
    'lopa.source_sync',
    'lopa.readiness.view',
    'lopa.blockers.view',
    'lopa.actions.view',
    'lopa.linked_records.view',
    'lopa.history.view'
  ];
begin
  foreach permission_key in array permission_keys loop
    if to_regclass('public."Permission"') is not null then
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label", "action", "description")
      select gen_random_uuid()::text, t."id", permission_key, 'lopa', permission_key, split_part(permission_key, '.', array_length(string_to_array(permission_key, '.'), 1)), permission_key
      from public."Tenant" t
      where not exists (
        select 1 from public."Permission" p
        where p."tenantId" = t."id" and p."key" = permission_key
      );
    elsif to_regclass('public.permissions') is not null then
      insert into public.permissions (id, key, module, name, description)
      values (gen_random_uuid()::text, permission_key, 'LOPA', permission_key, permission_key)
      on conflict (key) do nothing;
    end if;
  end loop;
  if to_regclass('public."RolePermission"') is not null and to_regclass('public."Role"') is not null and to_regclass('public."Permission"') is not null then
    insert into public."RolePermission" ("roleId", "permissionId")
    select r."id", p."id"
    from public."Role" r
    join public."Permission" p on p."tenantId" = r."tenantId"
    where r."key" in ('platform_admin', 'corporate_admin', 'site_admin', 'super_admin', 'hse_manager', 'process_engineer', 'operations_supervisor', 'plant_manager')
      and p."key" = any(permission_keys)
    on conflict ("roleId", "permissionId") do nothing;
  end if;
end $$;
