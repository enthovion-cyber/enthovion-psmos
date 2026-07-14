alter table public.incidents
  add column if not exists team_status text,
  add column if not exists investigation_lead_id text,
  add column if not exists hse_lead_id text,
  add column if not exists process_safety_lead_id text,
  add column if not exists operations_lead_id text,
  add column if not exists engineering_lead_id text,
  add column if not exists team_assignment_due_date date,
  add column if not exists team_assignment_reason text,
  add column if not exists team_review_required boolean not null default false,
  add column if not exists team_reviewer_id text,
  add column if not exists team_review_due_date date,
  add column if not exists team_review_comments text,
  add column if not exists team_escalation_required boolean not null default false,
  add column if not exists team_management_sponsor_id text,
  add column if not exists team_escalation_reason text,
  add column if not exists team_escalation_status text,
  add column if not exists team_escalated_by text,
  add column if not exists team_escalated_at timestamptz,
  add column if not exists team_senior_review_required boolean not null default false,
  add column if not exists team_management_review_due_date date;

alter table public.incident_investigation_team_members
  add column if not exists profile_status text,
  add column if not exists profile_id text,
  add column if not exists profile_detected boolean not null default false,
  add column if not exists profile_detection_source text,
  add column if not exists profile_disabled_reason text,
  add column if not exists phone text,
  add column if not exists site_name_snapshot text,
  add column if not exists contractor_company text,
  add column if not exists company_snapshot text,
  add column if not exists required_role boolean not null default false,
  add column if not exists active_status text not null default 'Pending Acceptance',
  add column if not exists approval_required boolean not null default false,
  add column if not exists approval_status text not null default 'Not Required',
  add column if not exists approval_requested_by text,
  add column if not exists approval_requested_at timestamptz,
  add column if not exists approved_by text,
  add column if not exists approved_at timestamptz,
  add column if not exists approval_rejection_reason text,
  add column if not exists acceptance_required boolean not null default true,
  add column if not exists acceptance_due_date date,
  add column if not exists accepted_by text,
  add column if not exists declined_at timestamptz,
  add column if not exists decline_reason text,
  add column if not exists assigned_by text,
  add column if not exists assigned_at timestamptz,
  add column if not exists availability_notes text,
  add column if not exists planned_absence text,
  add column if not exists assignment_capacity text,
  add column if not exists backup_member_id text,
  add column if not exists conflict_check_required boolean not null default false,
  add column if not exists conflict_declared boolean not null default false,
  add column if not exists conflict_notes text,
  add column if not exists approved_despite_conflict boolean not null default false,
  add column if not exists competency_check_required boolean not null default false,
  add column if not exists required_competency text,
  add column if not exists training_record text,
  add column if not exists investigation_training_complete boolean not null default false,
  add column if not exists rca_training_complete boolean not null default false,
  add column if not exists process_safety_competency boolean not null default false,
  add column if not exists notification_message text,
  add column if not exists last_reminder_sent_at timestamptz,
  add column if not exists removed_at timestamptz,
  add column if not exists removed_by text,
  add column if not exists removal_reason text,
  add column if not exists replaced_by_member_id text,
  add column if not exists replacement_reason text,
  add column if not exists change_reason text;

alter table public.incident_team_required_roles
  add column if not exists source_rule text,
  add column if not exists missing boolean not null default false;

create table if not exists public.incident_team_raci (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  incident_id text not null,
  activity text not null,
  responsible_member_id text,
  accountable_member_id text,
  consulted_member_ids_json jsonb,
  informed_member_ids_json jsonb,
  due_date date,
  status text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_by text,
  updated_at timestamptz not null default now()
);

create table if not exists public.incident_team_acceptance_logs (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  incident_id text not null,
  member_id text not null,
  event_type text not null,
  reason text,
  actor_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.incident_team_member_approvals (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  incident_id text not null,
  member_id text not null,
  status text not null,
  reviewer_id text,
  comments text,
  requested_by text,
  requested_at timestamptz,
  approved_by text,
  approved_at timestamptz,
  rejected_by text,
  rejected_at timestamptz,
  rejection_reason text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incident_team_reviews (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  incident_id text not null,
  status text,
  reviewer_id text,
  due_date date,
  comments text,
  approved_by text,
  approved_at timestamptz,
  rejected_by text,
  rejected_at timestamptz,
  rejection_reason text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.incident_team_raci enable row level security;
alter table public.incident_team_acceptance_logs enable row level security;
alter table public.incident_team_member_approvals enable row level security;
alter table public.incident_team_reviews enable row level security;

grant select, insert, update, delete on public.incident_team_raci to authenticated;
grant select, insert, update, delete on public.incident_team_acceptance_logs to authenticated;
grant select, insert, update, delete on public.incident_team_member_approvals to authenticated;
grant select, insert, update, delete on public.incident_team_reviews to authenticated;

create index if not exists idx_incident_team_members_acceptance on public.incident_investigation_team_members(tenant_id, incident_id, acceptance_status, active_status);
create index if not exists idx_incident_team_members_profile_status on public.incident_investigation_team_members(tenant_id, profile_status);
create index if not exists idx_incident_team_raci_incident on public.incident_team_raci(tenant_id, incident_id);
create index if not exists idx_incident_team_acceptance_logs_member on public.incident_team_acceptance_logs(tenant_id, incident_id, member_id);
create index if not exists idx_incident_team_member_approvals_member on public.incident_team_member_approvals(tenant_id, incident_id, member_id);
create index if not exists idx_incident_team_reviews_incident on public.incident_team_reviews(tenant_id, incident_id, status);

do $$
declare
  tenant_record record;
  permission_row text[];
  permission_rows text[][] := array[
    array['incidents.team.lead.assign','Assign investigation lead'],
    array['incidents.team.member.add','Add investigation team member'],
    array['incidents.team.member.replace','Replace investigation team member'],
    array['incidents.team.member.remove','Remove investigation team member'],
    array['incidents.team.approval.request','Request investigation team approval'],
    array['incidents.team.approval.approve','Approve investigation team'],
    array['incidents.team.approval.reject','Reject investigation team'],
    array['incidents.team.competency.manage','Manage team competency checks'],
    array['incidents.team.conflict.manage','Manage team conflict checks'],
    array['incidents.team.availability.manage','Manage team availability checks'],
    array['users.profiles.view','View user profiles'],
    array['users.profiles.invite','Invite user profiles'],
    array['users.profiles.create','Create user profiles']
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
