alter table public.mi_relief_devices enable row level security;
alter table public.mi_relief_device_readiness enable row level security;
alter table public.mi_relief_device_protected_equipment enable row level security;
alter table public.mi_relief_device_technical_data enable row level security;
alter table public.mi_relief_device_basis enable row level security;
alter table public.mi_relief_device_test_requirements enable row level security;
alter table public.mi_relief_device_seals enable row level security;
alter table public.mi_relief_device_tests enable row level security;
alter table public.mi_relief_device_test_results enable row level security;
alter table public.mi_relief_device_leak_tests enable row level security;
alter table public.mi_relief_device_certificates enable row level security;
alter table public.mi_relief_device_occurrences enable row level security;
alter table public.mi_relief_device_history_events enable row level security;
alter table public.mi_relief_device_import_jobs enable row level security;
alter table public.mi_relief_device_import_rows enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'mi_relief_devices',
    'mi_relief_device_readiness',
    'mi_relief_device_protected_equipment',
    'mi_relief_device_technical_data',
    'mi_relief_device_basis',
    'mi_relief_device_test_requirements',
    'mi_relief_device_seals',
    'mi_relief_device_tests',
    'mi_relief_device_test_results',
    'mi_relief_device_leak_tests',
    'mi_relief_device_certificates',
    'mi_relief_device_occurrences',
    'mi_relief_device_history_events',
    'mi_relief_device_import_jobs',
    'mi_relief_device_import_rows'
  ] loop
    execute format('drop policy if exists %I_service_role_all on public.%I', table_name, table_name);
    execute format('create policy %I_service_role_all on public.%I for all to service_role using (true) with check (true)', table_name, table_name);
  end loop;
end $$;
