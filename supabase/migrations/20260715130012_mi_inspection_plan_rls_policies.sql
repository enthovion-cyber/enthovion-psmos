-- Mechanical Integrity Phase 4 - inspection plan RLS placeholders.
-- The API uses the service role and enforces tenant/company/site/equipment scope in services.

alter table public.mi_inspection_plans enable row level security;
alter table public.mi_inspection_plan_scopes enable row level security;
alter table public.mi_inspection_plan_cml_scope enable row level security;
alter table public.mi_inspection_plan_checklist_items enable row level security;
alter table public.mi_inspection_plan_acceptance_criteria enable row level security;
alter table public.mi_inspection_schedule_rules enable row level security;
alter table public.mi_inspection_plan_schedules enable row level security;
alter table public.mi_inspection_due_date_evaluations enable row level security;
alter table public.mi_inspection_schedule_occurrences enable row level security;
alter table public.mi_inspection_scheduler_runs enable row level security;
alter table public.mi_inspection_plan_revisions enable row level security;
alter table public.mi_inspection_plan_documents enable row level security;
alter table public.mi_inspection_plan_import_jobs enable row level security;
alter table public.mi_inspection_plan_import_rows enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'mi_inspection_plans',
    'mi_inspection_plan_scopes',
    'mi_inspection_plan_cml_scope',
    'mi_inspection_plan_checklist_items',
    'mi_inspection_plan_acceptance_criteria',
    'mi_inspection_schedule_rules',
    'mi_inspection_plan_schedules',
    'mi_inspection_due_date_evaluations',
    'mi_inspection_schedule_occurrences',
    'mi_inspection_scheduler_runs',
    'mi_inspection_plan_revisions',
    'mi_inspection_plan_documents',
    'mi_inspection_plan_import_jobs',
    'mi_inspection_plan_import_rows'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_service_role_all', table_name);
    execute format('create policy %I on public.%I for all to service_role using (true) with check (true)', table_name || '_service_role_all', table_name);
  end loop;
end $$;
