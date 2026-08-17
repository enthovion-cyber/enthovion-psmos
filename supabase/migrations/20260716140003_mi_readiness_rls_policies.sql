alter table public.mi_readiness_assessments enable row level security;
alter table public.mi_readiness_blockers enable row level security;
alter table public.mi_readiness_restrictions enable row level security;
alter table public.mi_readiness_approvals enable row level security;
alter table public.mi_readiness_linked_records enable row level security;
alter table public.mi_readiness_history_events enable row level security;
alter table public.mi_readiness_import_jobs enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'mi_readiness_assessments',
    'mi_readiness_blockers',
    'mi_readiness_restrictions',
    'mi_readiness_approvals',
    'mi_readiness_linked_records',
    'mi_readiness_history_events',
    'mi_readiness_import_jobs'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_service_role_all', table_name);
    execute format('create policy %I on public.%I for all to service_role using (true) with check (true)', table_name || '_service_role_all', table_name);
  end loop;
end $$;
