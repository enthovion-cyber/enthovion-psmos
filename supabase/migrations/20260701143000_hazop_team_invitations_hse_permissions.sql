create table if not exists public.hazop_team_invitations (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  team_member_id text not null references public.hazop_study_team_members(id) on delete cascade,
  invited_user_id text,
  invited_email text,
  invited_by text,
  study_role text,
  discipline text,
  permission_level text not null default 'Comment',
  required_attendance boolean not null default false,
  signoff_required boolean not null default false,
  status text not null default 'Pending' check (status in ('Pending', 'Accepted', 'Declined', 'Expired', 'Cancelled')),
  expires_at timestamptz not null default (now() + interval '14 days'),
  responded_at timestamptz,
  decline_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, team_member_id)
);

create table if not exists public.hazop_study_access (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  team_member_id text references public.hazop_study_team_members(id) on delete set null,
  user_id text not null,
  study_role text,
  permission_level text not null default 'Comment',
  access_status text not null default 'Active',
  granted_by text,
  granted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, study_id, user_id)
);

create index if not exists idx_hazop_team_invitations_user on public.hazop_team_invitations (tenant_id, invited_user_id, status);
create index if not exists idx_hazop_team_invitations_email on public.hazop_team_invitations (tenant_id, invited_email, status);
create index if not exists idx_hazop_team_invitations_study on public.hazop_team_invitations (tenant_id, study_id);
create index if not exists idx_hazop_study_access_user on public.hazop_study_access (tenant_id, user_id, access_status);
create index if not exists idx_hazop_study_access_study on public.hazop_study_access (tenant_id, study_id);

alter table public.hazop_team_invitations enable row level security;
alter table public.hazop_study_access enable row level security;

grant select, insert, update, delete on public.hazop_team_invitations to authenticated;
grant select, insert, update, delete on public.hazop_study_access to authenticated;

do $$
declare
  permission_key text;
  tenant_row record;
begin
  foreach permission_key in array array[
    'hazop.dashboard.view',
    'hazop.view',
    'hazop.node.view',
    'hazop.scenario.view',
    'hazop.risk.view',
    'hazop.risk.edit',
    'hazop.risk.recalculate',
    'hazop.risk.lopa.mark',
    'hazop.safeguards.view',
    'hazop.safeguards.create',
    'hazop.safeguards.edit',
    'hazop.safeguards.mark_credited',
    'hazop.safeguards.mark_ipl',
    'hazop.ipl.view',
    'hazop.ipl.validate',
    'hazop.recommendations.view',
    'hazop.recommendations.create',
    'hazop.recommendations.action.create',
    'hazop.team.view',
    'hazop.sessions.view',
    'hazop.review.view',
    'hazop.signoff.view',
    'hazop.signoff.sign',
    'hazop.export'
  ]
  loop
    for tenant_row in select id from public."Tenant"
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      values (gen_random_uuid()::text, tenant_row.id, permission_key, 'hazop', initcap(replace(permission_key, '.', ' ')))
      on conflict ("tenantId", "key") do update
        set "moduleKey" = excluded."moduleKey",
            "label" = excluded."label";

      if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'Permission'
          and column_name = 'action'
      ) then
        update public."Permission"
        set "action" = split_part(permission_key, '.', array_length(string_to_array(permission_key, '.'), 1))
        where "tenantId" = tenant_row.id and "key" = permission_key;
      end if;

      if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'Permission'
          and column_name = 'description'
      ) then
        update public."Permission"
        set "description" = initcap(replace(permission_key, '.', ' '))
        where "tenantId" = tenant_row.id and "key" = permission_key;
      end if;
    end loop;
  end loop;
end $$;

insert into public."RolePermission" ("roleId", "permissionId")
select r."id", p."id"
from public."Role" r
join public."Permission" p on p."tenantId" = r."tenantId"
where lower(r."name") = 'hse manager'
  and p."key" in (
    'hazop.dashboard.view',
    'hazop.view',
    'hazop.node.view',
    'hazop.scenario.view',
    'hazop.risk.view',
    'hazop.risk.edit',
    'hazop.risk.recalculate',
    'hazop.risk.lopa.mark',
    'hazop.safeguards.view',
    'hazop.safeguards.create',
    'hazop.safeguards.edit',
    'hazop.safeguards.mark_credited',
    'hazop.safeguards.mark_ipl',
    'hazop.ipl.view',
    'hazop.ipl.validate',
    'hazop.recommendations.view',
    'hazop.recommendations.create',
    'hazop.recommendations.action.create',
    'hazop.team.view',
    'hazop.sessions.view',
    'hazop.review.view',
    'hazop.signoff.view',
    'hazop.signoff.sign',
    'hazop.export'
  )
on conflict ("roleId", "permissionId") do nothing;
