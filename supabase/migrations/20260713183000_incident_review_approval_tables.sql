alter table if exists public.incidents
  add column if not exists review_approval_status text default 'Not Started',
  add column if not exists approval_workflow_status text default 'Workflow not started',
  add column if not exists review_approval_readiness_status text default 'Not Ready',
  add column if not exists ready_for_closure boolean default false,
  add column if not exists closure_status text default 'Not Ready',
  add column if not exists reapproval_required boolean default false,
  add column if not exists review_approval_open_blockers_count integer default 0,
  add column if not exists review_approval_required_approvals_count integer default 0,
  add column if not exists review_approval_completed_approvals_count integer default 0,
  add column if not exists review_approval_pending_approvals_count integer default 0,
  add column if not exists review_approval_last_checked_at timestamptz,
  add column if not exists review_approval_started_at timestamptz,
  add column if not exists review_approval_closed_at timestamptz,
  add column if not exists review_approval_closed_by text;

create table if not exists public.incident_review_approvals (
  id text primary key,
  tenant_id text not null references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  incident_id text not null,
  review_status text not null default 'Not Started',
  workflow_id text,
  workflow_version text,
  workflow_snapshot_json jsonb not null default '{}'::jsonb,
  readiness_status text not null default 'Not Ready',
  ready_for_closure boolean not null default false,
  closure_status text not null default 'Not Ready',
  closed_by text,
  closed_at timestamptz,
  closure_summary text,
  exception_reason text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incident_reviewers (
  id text primary key,
  tenant_id text not null references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  incident_id text not null,
  reviewer_user_id text,
  reviewer_name text,
  reviewer_email text,
  role text not null,
  department text,
  approval_level integer not null default 1,
  required boolean not null default true,
  status text not null default 'Not Started',
  decision text,
  due_date timestamptz,
  delegated_to_user_id text,
  escalation_status text default 'None',
  e_signature_required boolean not null default false,
  e_signature_id text,
  comments text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incident_review_decisions (
  id text primary key,
  tenant_id text not null references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  incident_id text not null,
  reviewer_id text,
  decision text not null,
  comment text,
  related_section text,
  related_blocker_id text,
  signed boolean not null default false,
  signed_at timestamptz,
  signature_id text,
  signature_meaning text,
  signature_reference text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.incident_review_blockers (
  id text primary key,
  tenant_id text not null references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  incident_id text not null,
  blocker_type text not null,
  source_tab text,
  description text not null,
  severity text not null default 'Medium',
  owner_id text,
  due_date timestamptz,
  status text not null default 'Open',
  blocking boolean not null default true,
  resolved_by text,
  resolved_at timestamptz,
  override_reason text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incident_change_requests (
  id text primary key,
  tenant_id text not null references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  incident_id text not null,
  request_number text not null,
  requested_by text,
  requested_at timestamptz not null default now(),
  source_section text,
  description text not null,
  owner_id text,
  due_date timestamptz,
  status text not null default 'Open',
  resolution_notes text,
  resolved_by text,
  resolved_at timestamptz,
  linked_action_id text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.incident_review_approvals to authenticated;
grant select, insert, update, delete on public.incident_reviewers to authenticated;
grant select, insert, update, delete on public.incident_review_decisions to authenticated;
grant select, insert, update, delete on public.incident_review_blockers to authenticated;
grant select, insert, update, delete on public.incident_change_requests to authenticated;
