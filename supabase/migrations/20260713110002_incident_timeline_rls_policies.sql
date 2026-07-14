alter table public.incident_timeline_events enable row level security;
alter table public.incident_timeline_gaps enable row level security;

grant select, insert, update, delete on public.incident_timeline_events to authenticated;
grant select, insert, update, delete on public.incident_timeline_gaps to authenticated;

do $$
declare
  tenant_record record;
  permission_row text[];
  permission_rows text[][] := array[
    array['incidents.timeline.view','View incident timeline'],
    array['incidents.timeline.edit','Edit incident timeline'],
    array['incidents.timeline.delete','Delete incident timeline events'],
    array['incidents.timeline.review.request','Request timeline review'],
    array['incidents.timeline.review.approve','Approve timeline review'],
    array['incidents.timeline.review.reject','Reject timeline review'],
    array['incidents.timeline.gaps.manage','Manage incident timeline gaps']
  ];
begin
  for tenant_record in select id from public."Tenant" loop
    foreach permission_row slice 1 in array permission_rows loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_record.id, permission_row[1], 'INCIDENTS', permission_row[2]
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_record.id and "key" = permission_row[1]
      );
    end loop;
  end loop;
end $$;
