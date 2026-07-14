do $$
begin
  if to_regclass('public.mocs') is not null then
    execute 'create index if not exists mocs_dashboard_idx on mocs(tenant_id, site_id, status, risk_level, change_type, updated_at desc)';
  end if;

  if to_regclass('public.moc_required_actions') is not null and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'moc_required_actions' and column_name = 'site_id') then
    execute 'create index if not exists moc_required_actions_dashboard_idx on moc_required_actions(tenant_id, site_id, moc_id, status, due_date)';
  end if;

  if to_regclass('public.moc_temporary_controls') is not null and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'moc_temporary_controls' and column_name = 'site_id') then
    execute 'create index if not exists moc_temporary_controls_dashboard_idx on moc_temporary_controls(tenant_id, site_id, expiry_date, status)';
  end if;

  if to_regclass('public.moc_emergency_controls') is not null and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'moc_emergency_controls' and column_name = 'site_id') then
    execute 'create index if not exists moc_emergency_controls_dashboard_idx on moc_emergency_controls(tenant_id, site_id, review_due_at, review_status)';
  end if;

  if to_regclass('public.moc_pssr_requirements') is not null and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'moc_pssr_requirements' and column_name = 'site_id') then
    execute 'create index if not exists moc_pssr_requirements_dashboard_idx on moc_pssr_requirements(tenant_id, site_id, moc_id, status)';
  end if;

  if to_regclass('public.moc_history_events') is not null and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'moc_history_events' and column_name = 'site_id') then
    execute 'create index if not exists moc_history_events_dashboard_idx on moc_history_events(tenant_id, site_id, created_at desc)';
  end if;
end $$;

insert into "Permission" (id, "tenantId", key, "moduleKey", label)
values
  ('perm_moc_export', 'tenant_alkylation', 'moc.export', 'moc', 'Export MOC Dashboard'),
  ('perm_moc_dashboard_view', 'tenant_alkylation', 'moc.dashboard.view', 'moc', 'View MOC Dashboard'),
  ('perm_moc_approval_queue_view', 'tenant_alkylation', 'moc.approval_queue.view', 'moc', 'View MOC Approval Queue'),
  ('perm_moc_temporary_dashboard_view', 'tenant_alkylation', 'moc.temporary_dashboard.view', 'moc', 'View MOC Temporary Dashboard'),
  ('perm_moc_emergency_dashboard_view', 'tenant_alkylation', 'moc.emergency_dashboard.view', 'moc', 'View MOC Emergency Dashboard'),
  ('perm_moc_risk_dashboard_view', 'tenant_alkylation', 'moc.risk_dashboard.view', 'moc', 'View MOC Risk Dashboard')
on conflict (id) do update set key = excluded.key, label = excluded.label, "moduleKey" = excluded."moduleKey";

insert into "RolePermission" ("roleId", "permissionId")
select r.id, p.id
from "Role" r
join "Permission" p on p."tenantId" = r."tenantId"
where r."tenantId" = 'tenant_alkylation'
  and r.name in ('Platform Admin', 'Corporate Admin', 'Site Admin', 'Plant Manager', 'HSE Manager', 'Process Engineer', 'Operations Supervisor')
  and p.key in ('moc.export', 'moc.dashboard.view', 'moc.approval_queue.view', 'moc.temporary_dashboard.view', 'moc.emergency_dashboard.view', 'moc.risk_dashboard.view')
on conflict do nothing;
