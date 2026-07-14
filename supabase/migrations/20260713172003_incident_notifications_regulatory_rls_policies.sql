alter table public.incident_reporting_determinations enable row level security;
alter table public.incident_notifications enable row level security;
alter table public.incident_regulatory_reports enable row level security;
alter table public.incident_reporting_requirements enable row level security;
alter table public.incident_external_stakeholder_notifications enable row level security;
alter table public.incident_reporting_reviews enable row level security;

grant select, insert, update, delete on public.incident_reporting_determinations to authenticated;
grant select, insert, update, delete on public.incident_notifications to authenticated;
grant select, insert, update, delete on public.incident_regulatory_reports to authenticated;
grant select, insert, update, delete on public.incident_reporting_requirements to authenticated;
grant select, insert, update, delete on public.incident_external_stakeholder_notifications to authenticated;
grant select, insert, update, delete on public.incident_reporting_reviews to authenticated;

drop policy if exists incident_reporting_determinations_tenant_isolation on public.incident_reporting_determinations;
create policy incident_reporting_determinations_tenant_isolation on public.incident_reporting_determinations
  for all to authenticated
  using (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId'))
  with check (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId'));

drop policy if exists incident_notifications_tenant_isolation on public.incident_notifications;
create policy incident_notifications_tenant_isolation on public.incident_notifications
  for all to authenticated
  using (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId'))
  with check (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId'));

drop policy if exists incident_regulatory_reports_tenant_isolation on public.incident_regulatory_reports;
create policy incident_regulatory_reports_tenant_isolation on public.incident_regulatory_reports
  for all to authenticated
  using (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId'))
  with check (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId'));

drop policy if exists incident_reporting_requirements_tenant_isolation on public.incident_reporting_requirements;
create policy incident_reporting_requirements_tenant_isolation on public.incident_reporting_requirements
  for all to authenticated
  using (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId'))
  with check (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId'));

drop policy if exists incident_external_stakeholder_notifications_tenant_isolation on public.incident_external_stakeholder_notifications;
create policy incident_external_stakeholder_notifications_tenant_isolation on public.incident_external_stakeholder_notifications
  for all to authenticated
  using (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId'))
  with check (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId'));

drop policy if exists incident_reporting_reviews_tenant_isolation on public.incident_reporting_reviews;
create policy incident_reporting_reviews_tenant_isolation on public.incident_reporting_reviews
  for all to authenticated
  using (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId'))
  with check (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId'));

do $$
declare
  tenant_id_value text;
  permission_entry text[];
  permissions text[][] := array[
    array['incidents.notifications_reporting.view','View incident notifications and regulatory reporting'],
    array['incidents.notifications.send','Send incident notifications'],
    array['incidents.notifications.resend','Resend incident notifications'],
    array['incidents.notifications.acknowledge','Acknowledge incident notifications'],
    array['incidents.reporting.view','View incident regulatory reporting'],
    array['incidents.reporting.determine','Run incident reporting determination'],
    array['incidents.reporting.edit','Edit incident regulatory reports'],
    array['incidents.reporting.generate_package','Generate incident reporting package'],
    array['incidents.reporting.submit','Submit incident regulatory report'],
    array['incidents.reporting.acknowledge','Record incident report acknowledgement'],
    array['incidents.reporting.override','Override incident reporting determination'],
    array['incidents.reporting.review.request','Request incident reporting review'],
    array['incidents.reporting.review.approve','Approve incident reporting review'],
    array['incidents.reporting.review.reject','Reject incident reporting review'],
    array['incidents.reporting.export','Export incident notification log']
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
