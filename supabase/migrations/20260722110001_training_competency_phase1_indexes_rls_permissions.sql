-- Training & Competency Phase 1 - indexes, RLS, grants, permissions, and navigation entitlement.

create index if not exists training_workers_company_site_idx on public.training_workers(company_id, primary_site_id);
create index if not exists training_workers_company_work_email_idx on public.training_workers(company_id, lower(work_email));
create index if not exists training_workers_company_employee_idx on public.training_workers(company_id, employee_id);
create index if not exists training_workers_company_contractor_idx on public.training_workers(company_id, contractor_id);
create index if not exists training_workers_company_badge_idx on public.training_workers(company_id, badge_number);
create index if not exists training_workers_employment_idx on public.training_workers(company_id, employment_status);
create index if not exists training_workers_training_idx on public.training_workers(company_id, training_status);
create index if not exists training_workers_ptw_idx on public.training_workers(company_id, ptw_authorization_status);
create index if not exists training_worker_site_assignments_worker_idx on public.training_worker_site_assignments(company_id, worker_id);
create index if not exists training_worker_site_assignments_scope_idx on public.training_worker_site_assignments(site_id, unit_id, area_id);
create index if not exists training_worker_role_assignments_worker_idx on public.training_worker_role_assignments(company_id, worker_id);
create index if not exists training_worker_account_links_worker_user_idx on public.training_worker_account_links(worker_id, user_id);
create index if not exists training_worker_documents_worker_document_idx on public.training_worker_documents(worker_id, document_id);
create index if not exists training_worker_history_events_worker_created_idx on public.training_worker_history_events(worker_id, created_at desc);
create unique index if not exists training_workers_active_work_email_unique on public.training_workers(company_id, lower(work_email)) where work_email is not null and archived_at is null;
create unique index if not exists training_workers_active_employee_unique on public.training_workers(company_id, employee_id) where employee_id is not null and archived_at is null;
create unique index if not exists training_workers_active_contractor_unique on public.training_workers(company_id, contractor_id) where contractor_id is not null and archived_at is null;
create unique index if not exists training_workers_active_badge_unique on public.training_workers(company_id, badge_number) where badge_number is not null and archived_at is null;

alter table public.training_workers enable row level security;
alter table public.training_worker_site_assignments enable row level security;
alter table public.training_worker_role_assignments enable row level security;
alter table public.training_worker_account_links enable row level security;
alter table public.training_worker_documents enable row level security;
alter table public.training_worker_status_snapshots enable row level security;
alter table public.training_worker_history_events enable row level security;
alter table public.training_settings enable row level security;

drop policy if exists training_workers_tenant_policy on public.training_workers;
create policy training_workers_tenant_policy on public.training_workers
  using (company_id = coalesce(auth.jwt() ->> 'tenantId', auth.jwt() ->> 'tenant_id', ''))
  with check (company_id = coalesce(auth.jwt() ->> 'tenantId', auth.jwt() ->> 'tenant_id', ''));

drop policy if exists training_assignments_tenant_policy on public.training_worker_site_assignments;
create policy training_assignments_tenant_policy on public.training_worker_site_assignments
  using (company_id = coalesce(auth.jwt() ->> 'tenantId', auth.jwt() ->> 'tenant_id', ''))
  with check (company_id = coalesce(auth.jwt() ->> 'tenantId', auth.jwt() ->> 'tenant_id', ''));

drop policy if exists training_roles_tenant_policy on public.training_worker_role_assignments;
create policy training_roles_tenant_policy on public.training_worker_role_assignments
  using (company_id = coalesce(auth.jwt() ->> 'tenantId', auth.jwt() ->> 'tenant_id', ''))
  with check (company_id = coalesce(auth.jwt() ->> 'tenantId', auth.jwt() ->> 'tenant_id', ''));

drop policy if exists training_account_links_tenant_policy on public.training_worker_account_links;
create policy training_account_links_tenant_policy on public.training_worker_account_links
  using (company_id = coalesce(auth.jwt() ->> 'tenantId', auth.jwt() ->> 'tenant_id', ''))
  with check (company_id = coalesce(auth.jwt() ->> 'tenantId', auth.jwt() ->> 'tenant_id', ''));

drop policy if exists training_documents_tenant_policy on public.training_worker_documents;
create policy training_documents_tenant_policy on public.training_worker_documents
  using (company_id = coalesce(auth.jwt() ->> 'tenantId', auth.jwt() ->> 'tenant_id', ''))
  with check (company_id = coalesce(auth.jwt() ->> 'tenantId', auth.jwt() ->> 'tenant_id', ''));

drop policy if exists training_snapshots_tenant_policy on public.training_worker_status_snapshots;
create policy training_snapshots_tenant_policy on public.training_worker_status_snapshots
  using (company_id = coalesce(auth.jwt() ->> 'tenantId', auth.jwt() ->> 'tenant_id', ''))
  with check (company_id = coalesce(auth.jwt() ->> 'tenantId', auth.jwt() ->> 'tenant_id', ''));

drop policy if exists training_history_tenant_policy on public.training_worker_history_events;
create policy training_history_tenant_policy on public.training_worker_history_events
  using (company_id = coalesce(auth.jwt() ->> 'tenantId', auth.jwt() ->> 'tenant_id', ''))
  with check (company_id = coalesce(auth.jwt() ->> 'tenantId', auth.jwt() ->> 'tenant_id', ''));

drop policy if exists training_settings_tenant_policy on public.training_settings;
create policy training_settings_tenant_policy on public.training_settings
  using (company_id = coalesce(auth.jwt() ->> 'tenantId', auth.jwt() ->> 'tenant_id', ''))
  with check (company_id = coalesce(auth.jwt() ->> 'tenantId', auth.jwt() ->> 'tenant_id', ''));

grant select, insert, update, delete on public.training_workers to authenticated;
grant select, insert, update, delete on public.training_worker_site_assignments to authenticated;
grant select, insert, update, delete on public.training_worker_role_assignments to authenticated;
grant select, insert, update, delete on public.training_worker_account_links to authenticated;
grant select, insert, update, delete on public.training_worker_documents to authenticated;
grant select, insert on public.training_worker_status_snapshots to authenticated;
grant select, insert on public.training_worker_history_events to authenticated;
grant select, insert, update on public.training_settings to authenticated;

do $$
declare
  tenant_row record;
  permission_row record;
begin
  for tenant_row in select id from public."Tenant" loop
    for permission_row in
      select * from (values
        ('training.view', 'View Training & Competency'),
        ('training.dashboard.view', 'View Training dashboard'),
        ('training.workforce.view', 'View workforce registry'),
        ('training.workforce.create', 'Create worker profiles'),
        ('training.workforce.edit', 'Edit worker profiles'),
        ('training.workforce.archive', 'Archive worker profiles'),
        ('training.workforce.reactivate', 'Reactivate worker profiles'),
        ('training.workforce.assign_site', 'Assign worker site/unit/area'),
        ('training.workforce.assign_role', 'Assign worker role foundation'),
        ('training.workforce.link_user', 'Link worker user account'),
        ('training.workforce.unlink_user', 'Unlink worker user account'),
        ('training.workforce.link_document', 'Link worker documents'),
        ('training.workforce.remove_document', 'Remove worker documents'),
        ('training.workforce.view_sensitive', 'View sensitive worker fields'),
        ('training.workforce.export', 'Export workforce registry'),
        ('training.history.view', 'View Training history'),
        ('training.settings.view', 'View Training settings'),
        ('training.settings.edit', 'Edit Training settings'),
        ('training.matrix.view', 'View Training Matrix placeholder'),
        ('training.required.view', 'View Required Training placeholder'),
        ('training.records.view', 'View Training Records placeholder'),
        ('training.certifications.view', 'View Certifications placeholder'),
        ('training.assessments.view', 'View Assessments placeholder'),
        ('training.ptw_authorization.view', 'View PTW Authorization placeholder'),
        ('training.sop_acknowledgement.view', 'View SOP Acknowledgements placeholder'),
        ('training.moc.view', 'View MOC Training placeholder'),
        ('training.pssr.view', 'View PSSR Training placeholder'),
        ('training.report.view', 'View Training Reports placeholder'),
        ('training.review.view', 'View Training Review placeholder')
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

insert into public.company_entitlements (id, company_id, entitlement_key, entitlement_type, enabled, created_at, updated_at)
select gen_random_uuid()::text, c.id, 'module.training', 'module', true, now(), now()
from public."Company" c
where not exists (
  select 1 from public.company_entitlements e
  where e.company_id = c.id and e.entitlement_key = 'module.training'
);
