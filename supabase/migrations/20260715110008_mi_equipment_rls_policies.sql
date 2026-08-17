-- Mechanical Integrity Phase 1 - RLS enablement. API service role still enforces tenant/site.

alter table public.mi_equipment enable row level security;
alter table public.mi_equipment_types enable row level security;
alter table public.mi_equipment_technical_data enable row level security;
alter table public.mi_equipment_integrity_status enable row level security;
alter table public.mi_equipment_safeguard_role enable row level security;
alter table public.mi_equipment_schedule_summary enable row level security;
alter table public.mi_equipment_linked_records enable row level security;
alter table public.mi_equipment_documents enable row level security;
alter table public.mi_equipment_history_events enable row level security;
alter table public.mi_equipment_audit_events enable row level security;
alter table public.mi_equipment_import_jobs enable row level security;
alter table public.mi_equipment_import_rows enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'mi_equipment','mi_equipment_types','mi_equipment_technical_data','mi_equipment_integrity_status',
    'mi_equipment_safeguard_role','mi_equipment_schedule_summary','mi_equipment_linked_records',
    'mi_equipment_documents','mi_equipment_history_events','mi_equipment_audit_events',
    'mi_equipment_import_jobs','mi_equipment_import_rows'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_service_role_all', table_name);
    execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', table_name || '_service_role_all', table_name);
  end loop;
end $$;
