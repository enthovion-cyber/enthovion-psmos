alter table public.mi_work_orders enable row level security;
alter table public.mi_work_order_tasks enable row level security;
alter table public.mi_work_order_parts enable row level security;
alter table public.mi_work_order_execution_logs enable row level security;
alter table public.mi_work_order_verifications enable row level security;
alter table public.mi_work_order_linked_records enable row level security;
alter table public.mi_work_order_action_links enable row level security;
alter table public.mi_work_order_approvals enable row level security;
alter table public.mi_work_order_history_events enable row level security;
alter table public.mi_work_order_import_jobs enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'mi_work_orders',
    'mi_work_order_tasks',
    'mi_work_order_parts',
    'mi_work_order_execution_logs',
    'mi_work_order_verifications',
    'mi_work_order_linked_records',
    'mi_work_order_action_links',
    'mi_work_order_approvals',
    'mi_work_order_history_events',
    'mi_work_order_import_jobs'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_service_role_all', table_name);
    execute format('create policy %I on public.%I for all to service_role using (true) with check (true)', table_name || '_service_role_all', table_name);
  end loop;
end $$;
