-- Training & Competency Phase 2 - indexes, RLS, permission seed, and admin grants.

create index if not exists training_matrix_rules_company_site_active_idx on public.training_matrix_rules(company_id, site_id, active);
create index if not exists training_matrix_rules_company_code_idx on public.training_matrix_rules(company_id, rule_code);
create index if not exists training_matrix_rules_category_idx on public.training_matrix_rules(training_category);
create index if not exists training_matrix_rules_source_idx on public.training_matrix_rules(requirement_source);
create index if not exists training_matrix_assignments_worker_idx on public.training_matrix_assignments(company_id, worker_id);
create index if not exists training_matrix_assignments_rule_idx on public.training_matrix_assignments(matrix_rule_id);
create index if not exists training_matrix_evaluations_worker_status_idx on public.training_matrix_evaluations(worker_id, evaluation_status);
create index if not exists training_matrix_evaluations_assignment_idx on public.training_matrix_evaluations(matrix_assignment_id);
create index if not exists training_matrix_gaps_status_idx on public.training_matrix_gaps(company_id, site_id, gap_status);
create index if not exists training_matrix_gaps_worker_severity_idx on public.training_matrix_gaps(worker_id, gap_severity);
create index if not exists training_matrix_gaps_ptw_idx on public.training_matrix_gaps(ptw_blocker);
create index if not exists training_matrix_gaps_moc_idx on public.training_matrix_gaps(moc_blocker);
create index if not exists training_matrix_gaps_pssr_idx on public.training_matrix_gaps(pssr_blocker);
create index if not exists training_matrix_runs_status_idx on public.training_matrix_evaluation_runs(company_id, site_id, status);
create index if not exists training_matrix_worker_summaries_worker_idx on public.training_matrix_worker_summaries(worker_id);
create index if not exists training_matrix_history_worker_created_idx on public.training_matrix_history_events(worker_id, created_at desc);

alter table public.training_matrix_rules enable row level security;
alter table public.training_matrix_assignments enable row level security;
alter table public.training_matrix_evaluations enable row level security;
alter table public.training_matrix_gaps enable row level security;
alter table public.training_matrix_evaluation_runs enable row level security;
alter table public.training_matrix_worker_summaries enable row level security;
alter table public.training_matrix_waivers enable row level security;
alter table public.training_matrix_action_links enable row level security;
alter table public.training_matrix_history_events enable row level security;
alter table public.training_matrix_settings enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'training_matrix_rules',
    'training_matrix_assignments',
    'training_matrix_evaluations',
    'training_matrix_gaps',
    'training_matrix_evaluation_runs',
    'training_matrix_worker_summaries',
    'training_matrix_waivers',
    'training_matrix_action_links',
    'training_matrix_history_events',
    'training_matrix_settings'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_policy', table_name);
    execute format(
      'create policy %I on public.%I using (company_id = coalesce(auth.jwt() ->> %L, auth.jwt() ->> %L, %L)) with check (company_id = coalesce(auth.jwt() ->> %L, auth.jwt() ->> %L, %L))',
      table_name || '_tenant_policy',
      table_name,
      'tenantId',
      'tenant_id',
      '',
      'tenantId',
      'tenant_id',
      ''
    );
  end loop;
end $$;

grant select, insert, update, delete on public.training_matrix_rules to authenticated;
grant select, insert, update, delete on public.training_matrix_assignments to authenticated;
grant select, insert, update, delete on public.training_matrix_evaluations to authenticated;
grant select, insert, update, delete on public.training_matrix_gaps to authenticated;
grant select, insert, update on public.training_matrix_evaluation_runs to authenticated;
grant select, insert, update on public.training_matrix_worker_summaries to authenticated;
grant select, insert, update, delete on public.training_matrix_waivers to authenticated;
grant select, insert, update, delete on public.training_matrix_action_links to authenticated;
grant select, insert on public.training_matrix_history_events to authenticated;
grant select, insert, update on public.training_matrix_settings to authenticated;

do $$
declare
  tenant_row record;
  permission_row record;
begin
  for tenant_row in select id from public."Tenant" loop
    for permission_row in
      select * from (values
        ('training.matrix.view', 'View Training Matrix'),
        ('training.matrix.dashboard.view', 'View Training Matrix dashboard'),
        ('training.matrix.builder.view', 'View Training Matrix builder'),
        ('training.matrix.rule.view', 'View Training Matrix rules'),
        ('training.matrix.rule.create', 'Create Training Matrix rules'),
        ('training.matrix.rule.edit', 'Edit Training Matrix rules'),
        ('training.matrix.rule.archive', 'Archive Training Matrix rules'),
        ('training.matrix.rule.activate', 'Activate Training Matrix rules'),
        ('training.matrix.evaluate', 'Run Training Matrix evaluations'),
        ('training.matrix.evaluate.company', 'Run company-wide Training Matrix evaluations'),
        ('training.matrix.evaluate.site', 'Run site Training Matrix evaluations'),
        ('training.matrix.evaluate.unit', 'Run unit Training Matrix evaluations'),
        ('training.matrix.evaluate.worker', 'Run worker Training Matrix evaluations'),
        ('training.matrix.gap.view', 'View Training Matrix gaps'),
        ('training.matrix.gap.assign', 'Assign Training Matrix gaps'),
        ('training.matrix.gap.close', 'Close Training Matrix gaps'),
        ('training.matrix.gap.verify', 'Verify Training Matrix gap closure'),
        ('training.matrix.gap.reopen', 'Reopen Training Matrix gaps'),
        ('training.matrix.waiver.view', 'View Training Matrix waivers'),
        ('training.matrix.waiver.request', 'Request Training Matrix waivers'),
        ('training.matrix.waiver.approve', 'Approve Training Matrix waivers'),
        ('training.matrix.waiver.reject', 'Reject Training Matrix waivers'),
        ('training.matrix.waiver.revoke', 'Revoke Training Matrix waivers'),
        ('training.matrix.action.create', 'Create actions from Training Matrix gaps'),
        ('training.matrix.import', 'Import Training Matrix rules'),
        ('training.matrix.export', 'Export Training Matrix data'),
        ('training.matrix.settings.view', 'View Training Matrix settings'),
        ('training.matrix.settings.edit', 'Edit Training Matrix settings')
      ) as p(key, label)
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      values ('perm_' || replace(permission_row.key, '.', '_'), tenant_row.id, permission_row.key, 'training', permission_row.label)
      on conflict ("id") do update set "key" = excluded."key", "moduleKey" = excluded."moduleKey", "label" = excluded."label";
    end loop;
  end loop;
end $$;

insert into public."RolePermission" ("roleId", "permissionId")
select r.id, p.id
from public."Role" r
join public."Permission" p on p."tenantId" = r."tenantId" and p."moduleKey" = 'training'
where lower(r.key) like '%admin%' or lower(r.name) like '%admin%'
on conflict do nothing;
