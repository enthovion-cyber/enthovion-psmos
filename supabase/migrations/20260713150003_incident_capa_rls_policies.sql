alter table public.incident_capa enable row level security;
alter table public.incident_capa_items enable row level security;
alter table public.incident_capa_source_links enable row level security;
alter table public.incident_capa_verifications enable row level security;
alter table public.incident_capa_reviews enable row level security;

drop policy if exists incident_capa_tenant_isolation on public.incident_capa;
create policy incident_capa_tenant_isolation on public.incident_capa
  using (tenant_id = current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId')
  with check (tenant_id = current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId');

drop policy if exists incident_capa_items_tenant_isolation on public.incident_capa_items;
create policy incident_capa_items_tenant_isolation on public.incident_capa_items
  using (tenant_id = current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId')
  with check (tenant_id = current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId');

drop policy if exists incident_capa_source_links_tenant_isolation on public.incident_capa_source_links;
create policy incident_capa_source_links_tenant_isolation on public.incident_capa_source_links
  using (tenant_id = current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId')
  with check (tenant_id = current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId');

drop policy if exists incident_capa_verifications_tenant_isolation on public.incident_capa_verifications;
create policy incident_capa_verifications_tenant_isolation on public.incident_capa_verifications
  using (tenant_id = current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId')
  with check (tenant_id = current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId');

drop policy if exists incident_capa_reviews_tenant_isolation on public.incident_capa_reviews;
create policy incident_capa_reviews_tenant_isolation on public.incident_capa_reviews
  using (tenant_id = current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId')
  with check (tenant_id = current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId');

grant select, insert, update, delete on public.incident_capa to authenticated;
grant select, insert, update, delete on public.incident_capa_items to authenticated;
grant select, insert, update, delete on public.incident_capa_source_links to authenticated;
grant select, insert, update, delete on public.incident_capa_verifications to authenticated;
grant select, insert, update, delete on public.incident_capa_reviews to authenticated;

do $$
declare
  tenant_record record;
  permission_record record;
begin
  for tenant_record in select id from public."Tenant" loop
    for permission_record in
      select * from (values
        ('incidents.capa.view', 'View Incident CAPA'),
        ('incidents.capa.create', 'Create Incident CAPA'),
        ('incidents.capa.edit', 'Edit Incident CAPA'),
        ('incidents.capa.delete', 'Delete Incident CAPA'),
        ('incidents.capa.generate', 'Generate Incident CAPA'),
        ('incidents.capa.link_source', 'Link Incident CAPA Sources'),
        ('incidents.capa.link_evidence', 'Link Incident CAPA Evidence'),
        ('incidents.capa.complete', 'Complete Incident CAPA'),
        ('incidents.capa.verify', 'Verify Incident CAPA Effectiveness'),
        ('incidents.capa.escalate', 'Escalate Incident CAPA'),
        ('incidents.capa.review.request', 'Request Incident CAPA Review'),
        ('incidents.capa.review.approve', 'Approve Incident CAPA Review'),
        ('incidents.capa.review.reject', 'Reject Incident CAPA Review'),
        ('incidents.capa.export', 'Export Incident CAPA Register'),
        ('incidents.actions.link', 'Link Incident Actions')
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
