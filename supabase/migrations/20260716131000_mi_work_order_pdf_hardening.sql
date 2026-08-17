alter table public.mi_work_orders
  add column if not exists source_record_number text,
  add column if not exists current_equipment_status text,
  add column if not exists current_readiness_status text,
  add column if not exists equipment_criticality text,
  add column if not exists notes text;

create index if not exists mi_work_orders_source_idx on public.mi_work_orders(company_id, source_module, source_record_id);
create index if not exists mi_work_orders_owner_idx on public.mi_work_orders(company_id, site_id, owner_user_id, status);
create index if not exists mi_work_orders_assigned_idx on public.mi_work_orders(company_id, site_id, assigned_user_id, status);
create index if not exists mi_work_orders_due_idx on public.mi_work_orders(company_id, site_id, due_date, status);
