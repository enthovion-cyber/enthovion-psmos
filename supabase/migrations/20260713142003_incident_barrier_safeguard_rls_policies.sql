alter table public.incident_barrier_analysis enable row level security;
alter table public.incident_barriers enable row level security;
alter table public.incident_barrier_followups enable row level security;
alter table public.incident_barrier_reviews enable row level security;

drop policy if exists incident_barrier_analysis_tenant_isolation on public.incident_barrier_analysis;
create policy incident_barrier_analysis_tenant_isolation on public.incident_barrier_analysis
  using (tenant_id = current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId')
  with check (tenant_id = current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId');

drop policy if exists incident_barriers_tenant_isolation on public.incident_barriers;
create policy incident_barriers_tenant_isolation on public.incident_barriers
  using (tenant_id = current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId')
  with check (tenant_id = current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId');

drop policy if exists incident_barrier_followups_tenant_isolation on public.incident_barrier_followups;
create policy incident_barrier_followups_tenant_isolation on public.incident_barrier_followups
  using (tenant_id = current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId')
  with check (tenant_id = current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId');

drop policy if exists incident_barrier_reviews_tenant_isolation on public.incident_barrier_reviews;
create policy incident_barrier_reviews_tenant_isolation on public.incident_barrier_reviews
  using (tenant_id = current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId')
  with check (tenant_id = current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId');

grant select, insert, update, delete on public.incident_barrier_analysis to authenticated;
grant select, insert, update, delete on public.incident_barriers to authenticated;
grant select, insert, update, delete on public.incident_barrier_followups to authenticated;
grant select, insert, update, delete on public.incident_barrier_reviews to authenticated;

do $$
declare
  tenant_record record;
  permission_record record;
begin
  for tenant_record in select id from public."Tenant" loop
    for permission_record in
      select * from (values
        ('incidents.barriers.view', 'View Incident Barrier / Safeguard Failure'),
        ('incidents.barriers.edit', 'Edit Incident Barrier / Safeguard Failure'),
        ('incidents.barriers.delete', 'Delete Incident Barrier / Safeguard Failure'),
        ('incidents.barriers.import', 'Import Incident Barriers from HAZOP/LOPA/IPL Registry'),
        ('incidents.barriers.evidence.map', 'Map Evidence to Incident Barriers'),
        ('incidents.barriers.rca.link', 'Link Incident Barriers to RCA'),
        ('incidents.barriers.followups.create', 'Create Barrier Follow-up Actions'),
        ('incidents.barriers.review.request', 'Request Barrier Review'),
        ('incidents.barriers.review.approve', 'Approve Barrier Review'),
        ('incidents.barriers.review.reject', 'Reject Barrier Review'),
        ('incidents.barriers.ipl.view', 'View IPL/LOPA Barrier Links'),
        ('incidents.barriers.sis_sif.view', 'View SIS/SIF Barrier Links'),
        ('incidents.barriers.override', 'Override Barrier Readiness')
      ) as p(permission_key, permission_label)
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_record.id, permission_record.permission_key, 'Incidents', permission_record.permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_record.id and "key" = permission_record.permission_key
      );
    end loop;
  end loop;
end $$;
