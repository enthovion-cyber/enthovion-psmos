-- Training & Competency Phase 3 - indexes, RLS, permission seed, and admin grants.

create index if not exists training_competency_profiles_company_site_status_idx on public.training_competency_profiles(company_id, site_id, profile_status);
create index if not exists training_competency_profiles_company_code_idx on public.training_competency_profiles(company_id, profile_code);
create index if not exists training_competency_profiles_job_role_idx on public.training_competency_profiles(job_role);
create index if not exists training_competency_profile_scopes_profile_idx on public.training_competency_profile_scopes(profile_id, scope_type);
create index if not exists training_role_duties_profile_critical_idx on public.training_role_duties(profile_id, safety_critical);
create index if not exists training_competencies_company_code_idx on public.training_competencies(company_id, competency_code);
create index if not exists training_competency_requirements_profile_category_idx on public.training_competency_requirements(profile_id, competency_category);
create index if not exists training_worker_competency_assignments_worker_profile_idx on public.training_worker_competency_profile_assignments(worker_id, profile_id);
create index if not exists training_competency_evaluations_worker_status_idx on public.training_competency_evaluations(worker_id, competency_status);
create index if not exists training_competency_gaps_company_site_status_idx on public.training_competency_gaps(company_id, site_id, gap_status);
create index if not exists training_competency_gaps_worker_severity_idx on public.training_competency_gaps(worker_id, gap_severity);
create index if not exists training_competency_gaps_ptw_idx on public.training_competency_gaps(ptw_blocker);
create index if not exists training_competency_gaps_moc_idx on public.training_competency_gaps(moc_blocker);
create index if not exists training_competency_gaps_pssr_idx on public.training_competency_gaps(pssr_blocker);
create index if not exists training_competency_history_profile_created_idx on public.training_competency_history_events(profile_id, created_at desc);

alter table public.training_competency_profiles enable row level security;
alter table public.training_competency_profile_scopes enable row level security;
alter table public.training_role_duties enable row level security;
alter table public.training_competencies enable row level security;
alter table public.training_competency_requirements enable row level security;
alter table public.training_competency_evidence_rules enable row level security;
alter table public.training_worker_competency_profile_assignments enable row level security;
alter table public.training_competency_evaluations enable row level security;
alter table public.training_competency_evaluation_runs enable row level security;
alter table public.training_competency_gaps enable row level security;
alter table public.training_competency_profile_versions enable row level security;
alter table public.training_competency_matrix_links enable row level security;
alter table public.training_competency_waivers enable row level security;
alter table public.training_competency_history_events enable row level security;
alter table public.training_competency_settings enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'training_competency_profiles',
    'training_competency_profile_scopes',
    'training_role_duties',
    'training_competencies',
    'training_competency_requirements',
    'training_competency_evidence_rules',
    'training_worker_competency_profile_assignments',
    'training_competency_evaluations',
    'training_competency_evaluation_runs',
    'training_competency_gaps',
    'training_competency_profile_versions',
    'training_competency_matrix_links',
    'training_competency_waivers',
    'training_competency_history_events',
    'training_competency_settings'
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

grant select, insert, update, delete on public.training_competency_profiles to authenticated;
grant select, insert, update, delete on public.training_competency_profile_scopes to authenticated;
grant select, insert, update, delete on public.training_role_duties to authenticated;
grant select, insert, update, delete on public.training_competencies to authenticated;
grant select, insert, update, delete on public.training_competency_requirements to authenticated;
grant select, insert, update, delete on public.training_competency_evidence_rules to authenticated;
grant select, insert, update, delete on public.training_worker_competency_profile_assignments to authenticated;
grant select, insert, update, delete on public.training_competency_evaluations to authenticated;
grant select, insert, update on public.training_competency_evaluation_runs to authenticated;
grant select, insert, update, delete on public.training_competency_gaps to authenticated;
grant select, insert on public.training_competency_profile_versions to authenticated;
grant select, insert, update, delete on public.training_competency_matrix_links to authenticated;
grant select, insert, update, delete on public.training_competency_waivers to authenticated;
grant select, insert on public.training_competency_history_events to authenticated;
grant select, insert, update on public.training_competency_settings to authenticated;

do $$
declare
  tenant_row record;
  permission_row record;
begin
  for tenant_row in select id from public."Tenant" loop
    for permission_row in
      select * from (values
        ('training.competency.view', 'View Roles & Competency Profiles'),
        ('training.competency.dashboard.view', 'View competency dashboard'),
        ('training.competency.profile.view', 'View competency profiles'),
        ('training.competency.profile.create', 'Create competency profiles'),
        ('training.competency.profile.edit', 'Edit competency profiles'),
        ('training.competency.profile.archive', 'Archive competency profiles'),
        ('training.competency.profile.activate', 'Activate competency profiles'),
        ('training.competency.profile.new_version', 'Create competency profile version'),
        ('training.competency.profile.submit_review', 'Submit competency profile review'),
        ('training.competency.profile.approve', 'Approve competency profile'),
        ('training.competency.requirement.view', 'View competency requirements'),
        ('training.competency.requirement.manage', 'Manage competency requirements'),
        ('training.competency.library.view', 'View competency library'),
        ('training.competency.library.create', 'Create competency library items'),
        ('training.competency.library.edit', 'Edit competency library items'),
        ('training.competency.assignment.view', 'View worker competency profile assignments'),
        ('training.competency.assignment.create', 'Assign competency profiles'),
        ('training.competency.assignment.remove', 'Remove competency profile assignments'),
        ('training.competency.evaluate', 'Run competency evaluations'),
        ('training.competency.evaluate.company', 'Run company competency evaluations'),
        ('training.competency.evaluate.site', 'Run site competency evaluations'),
        ('training.competency.evaluate.unit', 'Run unit competency evaluations'),
        ('training.competency.evaluate.worker', 'Run worker competency evaluations'),
        ('training.competency.gap.view', 'View competency gaps'),
        ('training.competency.gap.assign', 'Assign competency gaps'),
        ('training.competency.gap.close', 'Close competency gaps'),
        ('training.competency.gap.verify', 'Verify competency gaps'),
        ('training.competency.gap.reopen', 'Reopen competency gaps'),
        ('training.competency.waiver.view', 'View competency waivers'),
        ('training.competency.waiver.request', 'Request competency waivers'),
        ('training.competency.waiver.approve', 'Approve competency waivers'),
        ('training.competency.waiver.reject', 'Reject competency waivers'),
        ('training.competency.waiver.revoke', 'Revoke competency waivers'),
        ('training.competency.matrix.sync', 'Sync competency profiles to matrix'),
        ('training.competency.import', 'Import competency profiles'),
        ('training.competency.export', 'Export competency profiles'),
        ('training.competency.settings.view', 'View competency settings'),
        ('training.competency.settings.edit', 'Edit competency settings')
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
