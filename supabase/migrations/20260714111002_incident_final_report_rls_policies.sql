alter table public.incident_report_templates enable row level security;
alter table public.incident_report_snapshots enable row level security;
alter table public.incident_reports enable row level security;
alter table public.incident_report_sections enable row level security;
alter table public.incident_report_exports enable row level security;
alter table public.incident_report_reviews enable row level security;
alter table public.incident_report_packages enable row level security;
alter table public.incident_report_package_items enable row level security;
alter table public.incident_report_distributions enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'incident_report_templates',
    'incident_report_snapshots',
    'incident_reports',
    'incident_report_sections',
    'incident_report_exports',
    'incident_report_reviews',
    'incident_report_packages',
    'incident_report_package_items',
    'incident_report_distributions'
  ]
  loop
    execute format('drop policy if exists %I_tenant_isolation on public.%I', table_name, table_name);
    execute format(
      'create policy %I_tenant_isolation on public.%I for all using (tenant_id = coalesce(auth.jwt() ->> ''tenantId'', auth.jwt() ->> ''tenant_id'')) with check (tenant_id = coalesce(auth.jwt() ->> ''tenantId'', auth.jwt() ->> ''tenant_id''))',
      table_name,
      table_name
    );
  end loop;
end $$;

grant select, insert, update, delete on public.incident_report_templates to authenticated;
grant select, insert, update, delete on public.incident_report_snapshots to authenticated;
grant select, insert, update, delete on public.incident_reports to authenticated;
grant select, insert, update, delete on public.incident_report_sections to authenticated;
grant select, insert, update, delete on public.incident_report_exports to authenticated;
grant select, insert, update, delete on public.incident_report_reviews to authenticated;
grant select, insert, update, delete on public.incident_report_packages to authenticated;
grant select, insert, update, delete on public.incident_report_package_items to authenticated;
grant select, insert, update, delete on public.incident_report_distributions to authenticated;
