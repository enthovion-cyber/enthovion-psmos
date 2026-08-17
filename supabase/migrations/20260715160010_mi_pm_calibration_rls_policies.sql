-- Mechanical Integrity Phase 7 - PM/calibration RLS policies.

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'mi_pm_plans',
    'mi_pm_plan_checklist_items',
    'mi_pm_plan_schedules',
    'mi_pm_occurrences',
    'mi_pm_records',
    'mi_pm_record_checklist_items',
    'mi_pm_record_findings',
    'mi_calibration_plans',
    'mi_calibration_plan_points',
    'mi_calibration_plan_schedules',
    'mi_calibration_occurrences',
    'mi_calibration_records',
    'mi_calibration_record_points',
    'mi_calibration_evaluations',
    'mi_pm_calibration_import_jobs',
    'mi_pm_calibration_import_rows',
    'mi_pm_calibration_history_events'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_service_role_all', table_name);
    execute format('create policy %I on public.%I for all to service_role using (true) with check (true)', table_name || '_service_role_all', table_name);
  end loop;
end $$;
