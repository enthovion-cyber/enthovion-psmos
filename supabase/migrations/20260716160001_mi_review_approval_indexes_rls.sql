create index if not exists idx_mi_approval_instances_company_site_status on public.mi_approval_instances(company_id, site_id, status);
create index if not exists idx_mi_approval_instances_source on public.mi_approval_instances(company_id, source_module, source_record_id);
create index if not exists idx_mi_approval_instances_equipment on public.mi_approval_instances(equipment_id);
create index if not exists idx_mi_approval_instances_due on public.mi_approval_instances(due_at);
create index if not exists idx_mi_approval_instances_submitter on public.mi_approval_instances(submitted_by);
create index if not exists idx_mi_approval_stages_instance on public.mi_approval_stages(approval_instance_id, stage_number);
create index if not exists idx_mi_approval_stages_approver on public.mi_approval_stages(company_id, status, approver_user_id, delegated_to_user_id);
create index if not exists idx_mi_approval_rules_lookup on public.mi_approval_rules(company_id, site_id, source_module, active);
create index if not exists idx_mi_approval_validation_instance on public.mi_approval_validation_results(approval_instance_id, validation_status);
create index if not exists idx_mi_approval_snapshots_instance on public.mi_approval_change_snapshots(approval_instance_id, created_at desc);
create index if not exists idx_mi_approval_comments_instance on public.mi_approval_comments(approval_instance_id, created_at desc);
create index if not exists idx_mi_approval_conditions_instance on public.mi_approval_conditions(approval_instance_id, status);
create index if not exists idx_mi_approval_history_instance on public.mi_approval_history_events(approval_instance_id, created_at desc);
create index if not exists idx_mi_approval_history_source on public.mi_approval_history_events(company_id, source_module, source_record_id);

alter table public.mi_approval_instances enable row level security;
alter table public.mi_approval_stages enable row level security;
alter table public.mi_approval_rules enable row level security;
alter table public.mi_approval_validation_results enable row level security;
alter table public.mi_approval_change_snapshots enable row level security;
alter table public.mi_approval_comments enable row level security;
alter table public.mi_approval_conditions enable row level security;
alter table public.mi_approval_history_events enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'mi_approval_instances',
    'mi_approval_stages',
    'mi_approval_rules',
    'mi_approval_validation_results',
    'mi_approval_change_snapshots',
    'mi_approval_comments',
    'mi_approval_conditions',
    'mi_approval_history_events'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_service_role_all', table_name);
    execute format('create policy %I on public.%I for all to service_role using (true) with check (true)', table_name || '_service_role_all', table_name);
  end loop;
end $$;
