-- Mechanical Integrity Phase 6 - RLS enablement.
-- API service enforces company/site/equipment permissions; service_role is used by the API.

alter table public.mi_criticality_configs enable row level security;
alter table public.mi_criticality_config_versions enable row level security;
alter table public.mi_criticality_assessments enable row level security;
alter table public.mi_criticality_consequence_scores enable row level security;
alter table public.mi_criticality_likelihood_scores enable row level security;
alter table public.mi_criticality_calculation_results enable row level security;
alter table public.mi_criticality_reviews enable row level security;
alter table public.mi_criticality_history_events enable row level security;
alter table public.mi_criticality_import_jobs enable row level security;
alter table public.mi_criticality_import_rows enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'mi_criticality_configs',
    'mi_criticality_config_versions',
    'mi_criticality_assessments',
    'mi_criticality_consequence_scores',
    'mi_criticality_likelihood_scores',
    'mi_criticality_calculation_results',
    'mi_criticality_reviews',
    'mi_criticality_history_events',
    'mi_criticality_import_jobs',
    'mi_criticality_import_rows'
  ]
  loop
    execute format('drop policy if exists "%s_service_role_all" on public.%I', table_name, table_name);
    execute format('create policy "%s_service_role_all" on public.%I for all to service_role using (true) with check (true)', table_name, table_name);
  end loop;
end $$;
