-- Mechanical Integrity Phase 3 - CML/TML RLS placeholders.
-- The API uses the service role and enforces tenant/company/site scope in services.

alter table public.mi_equipment_technical_data_revisions enable row level security;
alter table public.mi_cmls enable row level security;
alter table public.mi_cml_reading_campaigns enable row level security;
alter table public.mi_cml_thickness_readings enable row level security;
alter table public.mi_cml_calculation_snapshots enable row level security;
alter table public.mi_cml_alerts enable row level security;
alter table public.mi_cml_import_jobs enable row level security;
alter table public.mi_cml_import_rows enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'mi_equipment_technical_data_revisions',
    'mi_cmls',
    'mi_cml_reading_campaigns',
    'mi_cml_thickness_readings',
    'mi_cml_calculation_snapshots',
    'mi_cml_alerts',
    'mi_cml_import_jobs',
    'mi_cml_import_rows'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_service_role_all', table_name);
    execute format('create policy %I on public.%I for all to service_role using (true) with check (true)', table_name || '_service_role_all', table_name);
  end loop;
end $$;
