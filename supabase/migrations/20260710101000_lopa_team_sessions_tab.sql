create extension if not exists pgcrypto;

alter table if exists public.lopa_studies
  add column if not exists team_status text default 'Not Started',
  add column if not exists session_status text default 'Not Started',
  add column if not exists team_readiness_status text default 'Not Ready',
  add column if not exists team_members_count integer default 0,
  add column if not exists sessions_count integer default 0,
  add column if not exists sessions_completed_count integer default 0,
  add column if not exists open_session_actions_count integer default 0;

create table if not exists public.lopa_study_team_members (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  user_id text,
  contact_id text,
  full_name text not null,
  email text not null,
  organization text,
  internal_external text not null default 'Internal',
  job_title text,
  department text,
  discipline text not null,
  study_role text not null,
  responsibility_description text,
  required_participant boolean not null default false,
  voting_participant boolean not null default false,
  reviewer boolean not null default false,
  approver boolean not null default false,
  facilitator boolean not null default false,
  scribe boolean not null default false,
  access_level text not null default 'View only',
  invitation_status text not null default 'Not Invited',
  participation_status text not null default 'Active',
  invite_token text,
  invited_by text,
  invited_at timestamptz,
  response_status text,
  response_at timestamptz,
  decline_reason text,
  last_reminder_sent_at timestamptz,
  removed_by text,
  removed_at timestamptz,
  removal_reason text,
  replaced_by_member_id text,
  sessions_attended integer not null default 0,
  sessions_missed integer not null default 0,
  attendance_percentage numeric(6,2) not null default 0,
  conflict_independence_status text,
  last_activity_at timestamptz,
  notes text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lopa_team_member_unique_user unique (tenant_id, lopa_study_id, user_id),
  constraint lopa_team_member_unique_email unique (tenant_id, lopa_study_id, email)
);

create table if not exists public.lopa_study_sessions (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  session_number text not null,
  title text not null,
  session_type text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  timezone text,
  location text,
  meeting_link text,
  facilitator_member_id text,
  scribe_member_id text,
  status text not null default 'Scheduled',
  agenda_status text not null default 'Pending',
  attendance_status text not null default 'Pending',
  quorum_status text not null default 'Not Evaluated',
  minutes_status text not null default 'Pending',
  locked boolean not null default false,
  locked_by text,
  locked_at timestamptz,
  cancel_reason text,
  reschedule_reason text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lopa_session_number_unique unique (tenant_id, lopa_study_id, session_number)
);

create table if not exists public.lopa_study_session_agenda_items (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  session_id text not null references public.lopa_study_sessions(id) on delete cascade,
  agenda_number text not null,
  topic text not null,
  description text,
  related_tab text,
  related_record_type text,
  related_record_id text,
  owner_member_id text,
  planned_duration_minutes integer,
  status text not null default 'Planned',
  notes text,
  sort_order integer not null default 0,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lopa_study_session_attendance (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  session_id text not null references public.lopa_study_sessions(id) on delete cascade,
  team_member_id text not null references public.lopa_study_team_members(id) on delete cascade,
  required_attendee boolean not null default false,
  attendance_status text not null default 'Pending',
  attended_from timestamptz,
  attended_to timestamptz,
  delegate_member_id text,
  delegate_name text,
  absence_reason text,
  confirmed_by text,
  confirmed_at timestamptz,
  notes text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lopa_session_attendance_unique unique (tenant_id, session_id, team_member_id)
);

create table if not exists public.lopa_study_session_minutes (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  session_id text not null references public.lopa_study_sessions(id) on delete cascade,
  minutes_summary text,
  discussion_notes text,
  key_decisions_summary text,
  assumptions_summary text,
  deferred_items_summary text,
  concerns_summary text,
  follow_up_required boolean not null default false,
  prepared_by text,
  prepared_at timestamptz,
  reviewed_by text,
  reviewed_at timestamptz,
  locked_by text,
  locked_at timestamptz,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lopa_session_minutes_unique unique (tenant_id, session_id)
);

create table if not exists public.lopa_study_session_decisions (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  session_id text not null references public.lopa_study_sessions(id) on delete cascade,
  decision_number text not null,
  decision_title text not null,
  decision_description text,
  related_tab text,
  related_record_type text,
  related_record_id text,
  decision_type text,
  decision_outcome text,
  decision_owner_member_id text,
  evidence_reference text,
  action_required boolean not null default false,
  notes text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lopa_study_session_action_links (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  session_id text not null references public.lopa_study_sessions(id) on delete cascade,
  agenda_item_id text,
  decision_id text,
  action_id text not null,
  source_type text not null default 'Session',
  blocking boolean not null default true,
  linked_by text,
  linked_at timestamptz not null default now(),
  unlinked_by text,
  unlinked_at timestamptz,
  unlink_reason text
);

create table if not exists public.lopa_study_team_readiness (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  readiness_status text not null default 'Not Ready',
  required_roles_status text not null default 'Incomplete',
  required_disciplines_status text not null default 'Incomplete',
  invitation_status text not null default 'Pending',
  session_completion_status text not null default 'Pending',
  attendance_status text not null default 'Pending',
  quorum_status text not null default 'Not Evaluated',
  minutes_status text not null default 'Pending',
  action_status text not null default 'Pending',
  blocker_count integer not null default 0,
  warning_count integer not null default 0,
  checklist_json jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now(),
  generated_by_system boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lopa_team_readiness_unique unique (tenant_id, lopa_study_id)
);

create index if not exists idx_lopa_team_members_study on public.lopa_study_team_members (tenant_id, lopa_study_id);
create index if not exists idx_lopa_sessions_study on public.lopa_study_sessions (tenant_id, lopa_study_id);
create index if not exists idx_lopa_agenda_session on public.lopa_study_session_agenda_items (tenant_id, session_id);
create index if not exists idx_lopa_attendance_session on public.lopa_study_session_attendance (tenant_id, session_id);
create index if not exists idx_lopa_minutes_session on public.lopa_study_session_minutes (tenant_id, session_id);
create index if not exists idx_lopa_decisions_session on public.lopa_study_session_decisions (tenant_id, session_id);
create index if not exists idx_lopa_session_actions_session on public.lopa_study_session_action_links (tenant_id, session_id);

alter table public.lopa_study_team_members enable row level security;
alter table public.lopa_study_sessions enable row level security;
alter table public.lopa_study_session_agenda_items enable row level security;
alter table public.lopa_study_session_attendance enable row level security;
alter table public.lopa_study_session_minutes enable row level security;
alter table public.lopa_study_session_decisions enable row level security;
alter table public.lopa_study_session_action_links enable row level security;
alter table public.lopa_study_team_readiness enable row level security;

grant select, insert, update, delete on public.lopa_study_team_members to authenticated;
grant select, insert, update, delete on public.lopa_study_sessions to authenticated;
grant select, insert, update, delete on public.lopa_study_session_agenda_items to authenticated;
grant select, insert, update, delete on public.lopa_study_session_attendance to authenticated;
grant select, insert, update, delete on public.lopa_study_session_minutes to authenticated;
grant select, insert, update, delete on public.lopa_study_session_decisions to authenticated;
grant select, insert, update, delete on public.lopa_study_session_action_links to authenticated;
grant select, insert, update, delete on public.lopa_study_team_readiness to authenticated;

do $$
declare
  permission_key text;
  permission_label text;
  permission_id text;
  role_row record;
  tenant_row record;
  permission_keys text[] := array[
    'lopa.team_sessions.view',
    'lopa.team_sessions.manage',
    'lopa.team_members.create',
    'lopa.team_members.edit',
    'lopa.team_members.remove',
    'lopa.team_members.invite',
    'lopa.team_members.manage_access',
    'lopa.team_members.manage_required',
    'lopa.sessions.create',
    'lopa.sessions.edit',
    'lopa.sessions.cancel',
    'lopa.sessions.complete',
    'lopa.sessions.lock_minutes',
    'lopa.sessions.unlock_minutes',
    'lopa.sessions.agenda.manage',
    'lopa.sessions.attendance.manage',
    'lopa.sessions.minutes.manage',
    'lopa.sessions.decisions.manage',
    'lopa.sessions.actions.manage',
    'lopa.team_sessions.export',
    'lopa.team_readiness.view'
  ];
begin
  foreach permission_key in array permission_keys loop
    permission_label := initcap(replace(replace(permission_key, 'lopa.', 'LOPA '), '.', ' '));

    if to_regclass('public."Permission"') is not null and to_regclass('public."Tenant"') is not null then
      for tenant_row in select "id" from public."Tenant" loop
        if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'Permission' and column_name = 'moduleKey') then
          insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
          select gen_random_uuid()::text, tenant_row."id", permission_key, 'LOPA', permission_label
          where not exists (
            select 1 from public."Permission"
            where "tenantId" = tenant_row."id" and "key" = permission_key
          );
        else
          insert into public."Permission" ("id", "tenantId", "key", "label")
          select gen_random_uuid()::text, tenant_row."id", permission_key, permission_label
          where not exists (
            select 1 from public."Permission"
            where "tenantId" = tenant_row."id" and "key" = permission_key
          );
        end if;

        select "id" into permission_id from public."Permission" where "tenantId" = tenant_row."id" and "key" = permission_key limit 1;
        if permission_id is not null and to_regclass('public."RolePermission"') is not null then
          for role_row in
            select "id" from public."Role"
            where "tenantId" = tenant_row."id"
              and (lower(coalesce("name", '')) in ('super admin','company admin','site admin','process safety lead','process safety engineer','hse manager','plant manager')
                   or lower(coalesce("key", '')) in ('super_admin','company_admin','site_admin','process_safety_lead','process_safety_engineer','hse_manager','plant_manager'))
          loop
            insert into public."RolePermission" ("roleId", "permissionId")
            values (role_row."id", permission_id)
            on conflict do nothing;
          end loop;
        end if;
      end loop;
    end if;

    if to_regclass('public.permissions') is not null then
      if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'permissions' and column_name = 'module') then
        insert into public.permissions (id, key, module, action, description)
        values (gen_random_uuid()::text, permission_key, 'LOPA', split_part(permission_key, '.', array_length(string_to_array(permission_key, '.'), 1)), permission_label)
        on conflict (key) do nothing;
      else
        insert into public.permissions (id, key, description)
        values (gen_random_uuid()::text, permission_key, permission_label)
        on conflict (key) do nothing;
      end if;
    end if;
  end loop;
end $$;
