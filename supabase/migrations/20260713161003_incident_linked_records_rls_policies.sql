alter table public.incident_linked_records enable row level security;
alter table public.incident_required_links enable row level security;
alter table public.incident_record_impacts enable row level security;
alter table public.incident_linked_record_reviews enable row level security;

drop policy if exists incident_linked_records_tenant_isolation on public.incident_linked_records;
create policy incident_linked_records_tenant_isolation on public.incident_linked_records
  for all to authenticated
  using (tenant_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId')))
  with check (tenant_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId')));

drop policy if exists incident_required_links_tenant_isolation on public.incident_required_links;
create policy incident_required_links_tenant_isolation on public.incident_required_links
  for all to authenticated
  using (tenant_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId')))
  with check (tenant_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId')));

drop policy if exists incident_record_impacts_tenant_isolation on public.incident_record_impacts;
create policy incident_record_impacts_tenant_isolation on public.incident_record_impacts
  for all to authenticated
  using (tenant_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId')))
  with check (tenant_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId')));

drop policy if exists incident_linked_record_reviews_tenant_isolation on public.incident_linked_record_reviews;
create policy incident_linked_record_reviews_tenant_isolation on public.incident_linked_record_reviews
  for all to authenticated
  using (tenant_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId')))
  with check (tenant_id = ((current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId')));

grant select, insert, update, delete on public.incident_linked_records to authenticated;
grant select, insert, update, delete on public.incident_required_links to authenticated;
grant select, insert, update, delete on public.incident_record_impacts to authenticated;
grant select, insert, update, delete on public.incident_linked_record_reviews to authenticated;

do $$
declare
  tenant_id_value text;
  permission_entry text[];
  permissions text[][] := array[
    array['incidents.linked_records.view','View incident linked records'],
    array['incidents.linked_records.create','Create incident linked records'],
    array['incidents.linked_records.edit','Edit incident linked records'],
    array['incidents.linked_records.delete','Delete incident linked records'],
    array['incidents.linked_records.auto_detect','Auto-detect incident linked records'],
    array['incidents.linked_records.refresh','Refresh incident linked record status'],
    array['incidents.linked_records.export','Export incident linked records'],
    array['incidents.linked_records.review.request','Request incident linked records review'],
    array['incidents.linked_records.review.approve','Approve incident linked records review'],
    array['incidents.linked_records.review.reject','Reject incident linked records review'],
    array['incidents.record_impacts.manage','Manage incident linked record impacts']
  ];
begin
  for tenant_id_value in select id from public."Tenant" loop
    foreach permission_entry slice 1 in array permissions loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_id_value, permission_entry[1], 'INCIDENTS', permission_entry[2]
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_id_value and "key" = permission_entry[1]
      );
    end loop;
  end loop;
end $$;
