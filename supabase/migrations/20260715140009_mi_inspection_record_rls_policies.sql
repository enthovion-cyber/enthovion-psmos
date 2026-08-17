-- Mechanical Integrity Phase 5 - RLS enablement.
-- API service enforces company/site/equipment/CML permissions; service_role is used by the API.

alter table public.mi_inspection_records enable row level security;
alter table public.mi_inspection_record_checklist_items enable row level security;
alter table public.mi_inspection_record_cml_readings enable row level security;
alter table public.mi_remaining_life_evaluations enable row level security;
alter table public.mi_inspection_findings enable row level security;
alter table public.mi_inspection_record_documents enable row level security;
alter table public.mi_inspection_record_reviews enable row level security;
alter table public.mi_inspection_record_import_jobs enable row level security;
alter table public.mi_inspection_record_import_rows enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'mi_inspection_records',
    'mi_inspection_record_checklist_items',
    'mi_inspection_record_cml_readings',
    'mi_remaining_life_evaluations',
    'mi_inspection_findings',
    'mi_inspection_record_documents',
    'mi_inspection_record_reviews',
    'mi_inspection_record_import_jobs',
    'mi_inspection_record_import_rows'
  ]
  loop
    execute format('drop policy if exists "%s_service_role_all" on public.%I', table_name, table_name);
    execute format('create policy "%s_service_role_all" on public.%I for all to service_role using (true) with check (true)', table_name, table_name);
  end loop;
end $$;
