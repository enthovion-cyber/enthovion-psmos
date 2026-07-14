alter table public.incident_investigation_team_members enable row level security;
alter table public.incident_team_required_roles enable row level security;
alter table public.incident_team_sessions enable row level security;
alter table public.incident_team_notifications enable row level security;

grant select, insert, update, delete on public.incident_investigation_team_members to authenticated;
grant select, insert, update, delete on public.incident_team_required_roles to authenticated;
grant select, insert, update, delete on public.incident_team_sessions to authenticated;
grant select, insert, update, delete on public.incident_team_notifications to authenticated;

do $$
declare
  tenant_record record;
  permission_row text[];
  permission_rows text[][] := array[
    array['incidents.team.view','View incident investigation team'],
    array['incidents.team.edit','Edit incident investigation team'],
    array['incidents.team.delete','Delete incident investigation team members'],
    array['incidents.team.owner.assign','Assign investigation owner'],
    array['incidents.team.required_roles.generate','Generate required investigation roles'],
    array['incidents.team.acceptance.manage','Manage team acceptance'],
    array['incidents.team.raci.manage','Manage investigation RACI'],
    array['incidents.team.notifications.send','Send investigation team notifications'],
    array['incidents.team.review.request','Request investigation team review'],
    array['incidents.team.review.approve','Approve investigation team review'],
    array['incidents.team.review.reject','Reject investigation team review']
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
