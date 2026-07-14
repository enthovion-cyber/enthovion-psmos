alter table public.incident_lessons enable row level security;
alter table public.incident_lesson_source_links enable row level security;
alter table public.incident_lesson_distributions enable row level security;
alter table public.incident_lesson_acknowledgements enable row level security;
alter table public.incident_lesson_reviews enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'incident_lessons',
    'incident_lesson_source_links',
    'incident_lesson_distributions',
    'incident_lesson_acknowledgements',
    'incident_lesson_reviews'
  ]
  loop
    execute format('drop policy if exists "%s tenant select" on public.%I', table_name, table_name);
    execute format('drop policy if exists "%s tenant insert" on public.%I', table_name, table_name);
    execute format('drop policy if exists "%s tenant update" on public.%I', table_name, table_name);
    execute format('drop policy if exists "%s tenant delete" on public.%I', table_name, table_name);
    execute format('create policy "%s tenant select" on public.%I for select to authenticated using (tenant_id = coalesce((auth.jwt() ->> ''tenantId''), (auth.jwt() ->> ''tenant_id'')))', table_name, table_name);
    execute format('create policy "%s tenant insert" on public.%I for insert to authenticated with check (tenant_id = coalesce((auth.jwt() ->> ''tenantId''), (auth.jwt() ->> ''tenant_id'')))', table_name, table_name);
    execute format('create policy "%s tenant update" on public.%I for update to authenticated using (tenant_id = coalesce((auth.jwt() ->> ''tenantId''), (auth.jwt() ->> ''tenant_id''))) with check (tenant_id = coalesce((auth.jwt() ->> ''tenantId''), (auth.jwt() ->> ''tenant_id'')))', table_name, table_name);
    execute format('create policy "%s tenant delete" on public.%I for delete to authenticated using (tenant_id = coalesce((auth.jwt() ->> ''tenantId''), (auth.jwt() ->> ''tenant_id'')))', table_name, table_name);
  end loop;
end $$;

do $$
declare
  tenant_record record;
  permission_item text[];
begin
  for tenant_record in select id from public."Tenant" loop
    foreach permission_item slice 1 in array array[
      array['incidents.lessons.view','View incident lessons learned'],
      array['incidents.lessons.create','Create incident lesson'],
      array['incidents.lessons.edit','Edit incident lesson'],
      array['incidents.lessons.delete','Archive or delete incident lesson'],
      array['incidents.lessons.generate','Generate lessons from RCA/CAPA'],
      array['incidents.lessons.distribute','Distribute incident lessons'],
      array['incidents.lessons.verify','Verify lesson effectiveness'],
      array['incidents.lessons.review.request','Request lessons review'],
      array['incidents.lessons.review.approve','Approve lessons review'],
      array['incidents.lessons.review.reject','Reject lessons review'],
      array['incidents.history.export','Export incident history'],
      array['incidents.audit_trail.view','View incident audit trail'],
      array['incidents.access_history.view','View incident access history']
    ]
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_record.id, permission_item[1], 'INCIDENTS', permission_item[2]
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_record.id and "key" = permission_item[1]
      );
    end loop;
  end loop;
end $$;
