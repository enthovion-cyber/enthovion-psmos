alter table public.mi_sifs enable row level security;
alter table public.mi_sif_readiness enable row level security;
alter table public.mi_sif_protection_scope enable row level security;
alter table public.mi_sif_lopa_sil_links enable row level security;
alter table public.mi_sif_cause_effect enable row level security;
alter table public.mi_sif_architecture enable row level security;
alter table public.mi_sif_devices enable row level security;
alter table public.mi_sif_sil_data enable row level security;
alter table public.mi_sif_test_requirements enable row level security;
alter table public.mi_interlocks enable row level security;
alter table public.mi_critical_alarms enable row level security;
alter table public.mi_safeguard_test_requirements enable row level security;
alter table public.mi_safeguard_tests enable row level security;
alter table public.mi_safeguard_test_steps enable row level security;
alter table public.mi_safeguard_test_evaluations enable row level security;
alter table public.mi_safeguard_bypass_foundation enable row level security;
alter table public.mi_safeguard_demands enable row level security;
alter table public.mi_safeguard_occurrences enable row level security;
alter table public.mi_safeguard_history_events enable row level security;
alter table public.mi_safeguard_import_jobs enable row level security;
alter table public.mi_safeguard_import_rows enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'mi_sifs','mi_sif_readiness','mi_sif_protection_scope','mi_sif_lopa_sil_links',
    'mi_sif_cause_effect','mi_sif_architecture','mi_sif_devices','mi_sif_sil_data',
    'mi_sif_test_requirements','mi_interlocks','mi_critical_alarms',
    'mi_safeguard_test_requirements','mi_safeguard_tests','mi_safeguard_test_steps',
    'mi_safeguard_test_evaluations','mi_safeguard_bypass_foundation','mi_safeguard_demands',
    'mi_safeguard_occurrences','mi_safeguard_history_events','mi_safeguard_import_jobs',
    'mi_safeguard_import_rows'
  ] loop
    execute format('drop policy if exists %I_service_role_all on public.%I', table_name, table_name);
    execute format('create policy %I_service_role_all on public.%I for all to service_role using (true) with check (true)', table_name, table_name);
  end loop;
end $$;
