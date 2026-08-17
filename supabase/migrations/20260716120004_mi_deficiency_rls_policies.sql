alter table public.mi_deficiencies enable row level security;
alter table public.mi_deviations enable row level security;
alter table public.mi_deficiency_temporary_controls enable row level security;
alter table public.mi_deficiency_approvals enable row level security;
alter table public.mi_deficiency_verifications enable row level security;
alter table public.mi_deficiency_linked_records enable row level security;
alter table public.mi_deficiency_history_events enable row level security;
alter table public.mi_deficiency_import_jobs enable row level security;
alter table public.mi_deficiency_import_rows enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'mi_deficiencies','mi_deviations','mi_deficiency_temporary_controls','mi_deficiency_approvals',
    'mi_deficiency_verifications','mi_deficiency_linked_records','mi_deficiency_history_events',
    'mi_deficiency_import_jobs','mi_deficiency_import_rows'
  ] loop
    execute format('drop policy if exists "service_role_all_%s" on public.%I', table_name, table_name);
    execute format('create policy "service_role_all_%s" on public.%I for all to service_role using (true) with check (true)', table_name, table_name);
  end loop;
end $$;
