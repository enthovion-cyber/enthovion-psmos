alter table public.hazop_study_team_members add column if not exists company_id text;
alter table public.hazop_study_team_members add column if not exists site_id text;
alter table public.hazop_study_team_members add column if not exists external_name text;
alter table public.hazop_study_team_members add column if not exists external_email text;
alter table public.hazop_study_team_members add column if not exists email text;
alter table public.hazop_study_team_members add column if not exists company_name text;
alter table public.hazop_study_team_members add column if not exists contractor_company_id text;
alter table public.hazop_study_team_members add column if not exists department_id text;
alter table public.hazop_study_team_members add column if not exists study_role text;
alter table public.hazop_study_team_members add column if not exists permission_level text not null default 'Comment';
alter table public.hazop_study_team_members add column if not exists required_attendance boolean not null default false;
alter table public.hazop_study_team_members add column if not exists signoff_required boolean not null default false;
alter table public.hazop_study_team_members add column if not exists status text not null default 'Active';
alter table public.hazop_study_team_members add column if not exists invited_at timestamptz;
alter table public.hazop_study_team_members add column if not exists accepted_at timestamptz;
alter table public.hazop_study_team_members add column if not exists removed_at timestamptz;
alter table public.hazop_study_team_members add column if not exists replaced_by_member_id text;
alter table public.hazop_study_team_members add column if not exists notes text;
alter table public.hazop_study_team_members add column if not exists created_by text;
alter table public.hazop_study_team_members add column if not exists updated_by text;
alter table public.hazop_study_team_members add column if not exists created_at timestamptz not null default now();
alter table public.hazop_study_team_members add column if not exists updated_at timestamptz not null default now();

update public.hazop_study_team_members
set study_role = coalesce(study_role, role),
    required_attendance = coalesce(required_attendance, required),
    created_by = coalesce(created_by, added_by),
    created_at = coalesce(created_at, added_at),
    status = case when attendance_status in ('Invited','Active','Declined','Removed','Replaced','Inactive') then attendance_status else status end
where study_role is null or created_by is null;

alter table public.hazop_study_sessions add column if not exists company_id text;
alter table public.hazop_study_sessions add column if not exists site_id text;
alter table public.hazop_study_sessions add column if not exists session_type text not null default 'HAZOP worksheet session';
alter table public.hazop_study_sessions add column if not exists description text;
alter table public.hazop_study_sessions add column if not exists session_date date;
alter table public.hazop_study_sessions add column if not exists start_time time;
alter table public.hazop_study_sessions add column if not exists end_time time;
alter table public.hazop_study_sessions add column if not exists location text;
alter table public.hazop_study_sessions add column if not exists meeting_link text;
alter table public.hazop_study_sessions add column if not exists facilitator_id text;
alter table public.hazop_study_sessions add column if not exists scribe_id text;
alter table public.hazop_study_sessions add column if not exists planned_node_ids jsonb not null default '[]'::jsonb;
alter table public.hazop_study_sessions add column if not exists agenda text;
alter table public.hazop_study_sessions add column if not exists attendance_status text not null default 'Not Started';
alter table public.hazop_study_sessions add column if not exists minutes_status text not null default 'Missing';
alter table public.hazop_study_sessions add column if not exists actions_status text not null default 'No Actions';
alter table public.hazop_study_sessions add column if not exists updated_by text;
alter table public.hazop_study_sessions add column if not exists updated_at timestamptz not null default now();

update public.hazop_study_sessions
set session_date = coalesce(session_date, planned_start::date),
    start_time = coalesce(start_time, planned_start::time),
    end_time = coalesce(end_time, planned_end::time),
    description = coalesce(description, notes)
where session_date is null or description is null;

create table if not exists public.hazop_session_attendance (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  session_id text not null references public.hazop_study_sessions(id) on delete cascade,
  team_member_id text references public.hazop_study_team_members(id) on delete set null,
  user_id text,
  required boolean not null default false,
  attendance_status text not null default 'Not Required',
  join_time timestamptz,
  leave_time timestamptz,
  duration_minutes integer,
  substitute_name text,
  substitute_user_id text,
  comment text,
  marked_by text,
  marked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, session_id, team_member_id)
);

create table if not exists public.hazop_session_minutes (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  session_id text not null references public.hazop_study_sessions(id) on delete cascade,
  summary text,
  discussion_notes text,
  nodes_reviewed jsonb not null default '[]'::jsonb,
  key_deviations_discussed text,
  risks_escalated text,
  recommendations_created text,
  decisions_made text,
  open_questions text,
  next_session_plan text,
  prepared_by text,
  reviewed_by text,
  approved_by text,
  approved_at timestamptz,
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hazop_session_decisions (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  session_id text not null references public.hazop_study_sessions(id) on delete cascade,
  decision_title text not null,
  decision_description text,
  decision_type text not null default 'Other',
  node_id text,
  scenario_id text,
  recommendation_id text,
  owner_id text,
  decision_date date not null default current_date,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hazop_session_action_links (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  session_id text not null references public.hazop_study_sessions(id) on delete cascade,
  linked_action_id text not null,
  node_id text,
  scenario_id text,
  required_before_session_completion boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, session_id, linked_action_id)
);

create table if not exists public.hazop_team_coverage_requirements (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  discipline text not null,
  required boolean not null default true,
  requirement_source text not null default 'Site policy',
  assigned_member_id text,
  coverage_status text not null default 'Missing',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, study_id, discipline)
);

create index if not exists idx_hazop_team_members_study on public.hazop_study_team_members (tenant_id, study_id);
create index if not exists idx_hazop_sessions_study on public.hazop_study_sessions (tenant_id, study_id);
create index if not exists idx_hazop_attendance_session on public.hazop_session_attendance (tenant_id, session_id);
create index if not exists idx_hazop_minutes_session on public.hazop_session_minutes (tenant_id, session_id);
create index if not exists idx_hazop_decisions_session on public.hazop_session_decisions (tenant_id, session_id);
create index if not exists idx_hazop_session_actions_session on public.hazop_session_action_links (tenant_id, session_id);
create index if not exists idx_hazop_coverage_study on public.hazop_team_coverage_requirements (tenant_id, study_id);

alter table public.hazop_session_attendance enable row level security;
alter table public.hazop_session_minutes enable row level security;
alter table public.hazop_session_decisions enable row level security;
alter table public.hazop_session_action_links enable row level security;
alter table public.hazop_team_coverage_requirements enable row level security;

grant select, insert, update, delete on public.hazop_session_attendance to authenticated;
grant select, insert, update, delete on public.hazop_session_minutes to authenticated;
grant select, insert, update, delete on public.hazop_session_decisions to authenticated;
grant select, insert, update, delete on public.hazop_session_action_links to authenticated;
grant select, insert, update, delete on public.hazop_team_coverage_requirements to authenticated;

do $$
declare
  permission_keys text[] := array[
    'hazop.team.view','hazop.team.manage','hazop.team.invite','hazop.team.remove','hazop.team.coverage.view',
    'hazop.sessions.view','hazop.sessions.create','hazop.sessions.edit','hazop.sessions.cancel','hazop.sessions.complete',
    'hazop.sessions.attendance.manage','hazop.sessions.minutes.manage','hazop.sessions.decisions.manage',
    'hazop.sessions.actions.create','hazop.sessions.export'
  ];
  permission_key text;
  default_tenant text;
begin
  if to_regclass('public."Permission"') is not null then
    if to_regclass('public."Tenant"') is not null then
      for default_tenant in select "id" from public."Tenant" loop
        foreach permission_key in array permission_keys loop
          if not exists (select 1 from public."Permission" where "tenantId" = default_tenant and "key" = permission_key) then
            if exists (
              select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'Permission' and column_name = 'action'
            ) then
              insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label", "action", "description")
              values (
                gen_random_uuid()::text,
                default_tenant,
                permission_key,
                'hazop',
                permission_key,
                split_part(permission_key, '.', array_length(string_to_array(permission_key, '.'), 1)),
                permission_key
              );
            else
              insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
              values (gen_random_uuid()::text, default_tenant, permission_key, 'hazop', permission_key);
            end if;
          end if;
        end loop;
      end loop;
    end if;
  end if;

  if to_regclass('public.permissions') is not null then
    if to_regclass('public.tenants') is not null then
      select id into default_tenant from public.tenants limit 1;
    end if;
    foreach permission_key in array permission_keys loop
      if not exists (select 1 from public.permissions where key = permission_key) then
        insert into public.permissions (id, tenant_id, key, module, name)
        values (gen_random_uuid()::text, default_tenant, permission_key, 'HAZOP', permission_key);
      end if;
    end loop;
  end if;
end $$;
