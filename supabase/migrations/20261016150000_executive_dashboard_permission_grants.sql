-- Give established management roles read access to the Executive Dashboard.
-- This is intentionally view-only: calculation, configuration, and archival
-- permissions remain explicitly assigned to the roles that need them.
do $$
declare
  management_role_names text[] := array[
    'super admin',
    'company admin',
    'site admin',
    'administrator',
    'admin',
    'hse manager',
    'process safety lead',
    'process safety engineer',
    'plant manager'
  ];
  view_permission_keys text[] := array[
    'executive.dashboard.view',
    'executive.kpi.view',
    'executive.kpi.detail.view',
    'executive.kpi.drilldown.view',
    'executive.kpi.snapshot.view',
    'executive.widget.view',
    'executive.layout.view',
    'executive.source_health.view',
    'executive.settings.view',
    'executive.aggregation.view',
    'executive.aggregation.history.view',
    'executive.module_health.view',
    'executive.module_health.detail.view',
    'executive.critical_alert.view',
    'executive.site_performance.view',
    'executive.unit_performance.view',
    'executive.source_trace.view',
    'executive.aggregation_error.view',
    'executive.performance.dashboard.view',
    'executive.performance.view',
    'executive.performance.company.view',
    'executive.performance.site.view',
    'executive.performance.department.view',
    'executive.performance.unit.view',
    'executive.performance.area.view',
    'executive.performance.equipment.view',
    'executive.performance.compare.view',
    'executive.performance.heatmap.view',
    'executive.performance.ranking.view',
    'executive.performance.drilldown.view',
    'executive.performance.source_trace.view',
    'executive.performance.snapshot.view',
    'executive.psm_element.view',
    'executive.psm_element.dashboard.view',
    'executive.psm_element.register.view',
    'executive.psm_element.detail.view',
    'executive.psm_element.mapping.view',
    'executive.psm_element.kpi_mapping.view',
    'executive.psm_element.heatmap.view',
    'executive.psm_element.site_breakdown.view',
    'executive.psm_element.unit_breakdown.view',
    'executive.psm_element.gap.view',
    'executive.psm_element.snapshot.view',
    'executive.psm_element.score.view',
    'executive.psm_element.source_trace.view'
  ];
begin
  insert into public."RolePermission" ("roleId", "permissionId")
  select role_row."id", permission_row."id"
  from public."Role" role_row
  join public."Permission" permission_row
    on permission_row."tenantId" = role_row."tenantId"
  where (
      lower(coalesce(role_row."name", '')) = any(management_role_names)
      or lower(replace(coalesce(role_row."key", ''), '_', ' ')) = any(management_role_names)
    )
    and permission_row."key" = any(view_permission_keys)
    and not exists (
      select 1
      from public."RolePermission" existing
      where existing."roleId" = role_row."id"
        and existing."permissionId" = permission_row."id"
    );
end $$;
