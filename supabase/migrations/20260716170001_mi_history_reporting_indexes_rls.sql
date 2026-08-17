create index if not exists idx_mi_report_templates_scope on public.mi_report_templates(company_id, site_id, report_category, report_type);
create index if not exists idx_mi_generated_reports_scope on public.mi_generated_reports(company_id, site_id, report_category, report_type, status, created_at desc);
create index if not exists idx_mi_export_jobs_scope on public.mi_export_jobs(company_id, site_id, export_type, status, requested_at desc);
create index if not exists idx_mi_export_jobs_equipment on public.mi_export_jobs(company_id, equipment_id, requested_at desc);
create index if not exists idx_mi_export_packages_scope on public.mi_export_packages(company_id, site_id, package_type, status, created_at desc);
create index if not exists idx_mi_export_package_items_package on public.mi_export_package_items(company_id, package_id);
create index if not exists idx_mi_scheduled_reports_scope on public.mi_scheduled_reports(company_id, site_id, active, next_run_at);
create index if not exists idx_mi_history_event_views_scope on public.mi_history_event_views(company_id, site_id, event_at desc);
create index if not exists idx_mi_history_event_views_equipment on public.mi_history_event_views(company_id, equipment_id, event_at desc);
create index if not exists idx_mi_history_event_views_source on public.mi_history_event_views(company_id, source_module, source_record_id);
create index if not exists idx_mi_history_event_views_search on public.mi_history_event_views using gin (to_tsvector('simple', coalesce(searchable_text, '')));

alter table public.mi_report_templates enable row level security;
alter table public.mi_generated_reports enable row level security;
alter table public.mi_export_jobs enable row level security;
alter table public.mi_export_packages enable row level security;
alter table public.mi_export_package_items enable row level security;
alter table public.mi_scheduled_reports enable row level security;
alter table public.mi_history_event_views enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'mi_report_templates',
    'mi_generated_reports',
    'mi_export_jobs',
    'mi_export_packages',
    'mi_export_package_items',
    'mi_scheduled_reports',
    'mi_history_event_views'
  ]
  loop
    execute format('drop policy if exists "%1$s_service_role_all" on public.%1$I', table_name);
    execute format('create policy "%1$s_service_role_all" on public.%1$I for all to service_role using (true) with check (true)', table_name);
  end loop;
end $$;
