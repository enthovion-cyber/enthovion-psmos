-- Fix HAZOP Review & Sign-Off schema/runtime 500 errors.
-- Run this in Supabase SQL Editor, then restart the API.

create extension if not exists pgcrypto;

create table if not exists public.hazop_signoffs (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null,
  role text,
  signoff_role text,
  signature_role text,
  discipline text,
  required boolean not null default true,
  status text not null default 'Pending Request',
  assigned_user_id text,
  signer_user_id text,
  sequence_order integer not null default 100,
  requested_by text,
  requested_at timestamptz,
  signed_by text,
  signed_at timestamptz,
  rejected_by text,
  rejected_at timestamptz,
  rejection_reason text,
  comment text,
  e_signature_id text,
  signature_id text,
  signature_snapshot jsonb,
  superseded_at timestamptz,
  superseded_by_change_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hazop_signoffs
  add column if not exists company_id text,
  add column if not exists site_id text,
  add column if not exists role text,
  add column if not exists signoff_role text,
  add column if not exists signature_role text,
  add column if not exists discipline text,
  add column if not exists required boolean not null default true,
  add column if not exists status text not null default 'Pending Request',
  add column if not exists assigned_user_id text,
  add column if not exists signer_user_id text,
  add column if not exists sequence_order integer not null default 100,
  add column if not exists requested_by text,
  add column if not exists requested_at timestamptz,
  add column if not exists signed_by text,
  add column if not exists signed_at timestamptz,
  add column if not exists rejected_by text,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists comment text,
  add column if not exists e_signature_id text,
  add column if not exists signature_id text,
  add column if not exists signature_snapshot jsonb,
  add column if not exists superseded_at timestamptz,
  add column if not exists superseded_by_change_id text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Backfill canonical sign-off columns from older columns.
update public.hazop_signoffs
set
  signoff_role = coalesce(nullif(signoff_role, ''), nullif(signature_role, ''), nullif(role, ''), 'HAZOP Sign-off'),
  signature_role = coalesce(nullif(signature_role, ''), nullif(signoff_role, ''), nullif(role, ''), 'HAZOP Sign-off'),
  role = coalesce(nullif(role, ''), nullif(signoff_role, ''), nullif(signature_role, ''), 'HAZOP Sign-off'),
  assigned_user_id = coalesce(nullif(assigned_user_id, ''), nullif(signer_user_id, '')),
  signer_user_id = coalesce(nullif(signer_user_id, ''), nullif(assigned_user_id, '')),
  e_signature_id = coalesce(nullif(e_signature_id, ''), nullif(signature_id, '')),
  signature_id = coalesce(nullif(signature_id, ''), nullif(e_signature_id, '')),
  sequence_order = coalesce(sequence_order, 100),
  updated_at = now()
where signoff_role is null
   or signature_role is null
   or role is null
   or assigned_user_id is null
   or signer_user_id is null
   or sequence_order is null;

-- Normalize statuses to the values used by the app.
update public.hazop_signoffs
set
  status = case
    when status is null or trim(status) = '' then 'Pending Request'
    when lower(status) in ('pending', 'pending request', 'pending_request', 'pending assignment', 'pending_assignment', 'not generated', 'not_generated') then 'Pending Request'
    when lower(status) in ('requested', 'pending sign-off', 'pending signoff', 'pending_signoff') then 'Requested'
    when lower(status) = 'signed' then 'Signed'
    when lower(status) = 'rejected' then 'Rejected'
    when lower(status) in ('returned', 'returned for rework', 'returned_for_rework') then 'Returned for Rework'
    when lower(status) = 'superseded' then 'Superseded'
    when lower(status) in ('not required', 'not_required') then 'Not Required'
    else status
  end,
  updated_at = now();

-- Supersede duplicate active rows before creating the active unique index.
with ranked as (
  select
    ctid,
    row_number() over (
      partition by
        tenant_id,
        study_id,
        coalesce(nullif(signoff_role, ''), nullif(signature_role, ''), nullif(role, ''), 'HAZOP Sign-off'),
        coalesce(nullif(assigned_user_id, ''), nullif(signer_user_id, ''), 'unassigned')
      order by
        case when status = 'Signed' then 0 else 1 end,
        case when coalesce(assigned_user_id, signer_user_id) is not null then 0 else 1 end,
        coalesce(updated_at, created_at, now()) desc
    ) as rn
  from public.hazop_signoffs
  where coalesce(status, '') <> 'Superseded'
)
update public.hazop_signoffs s
set
  status = 'Superseded',
  superseded_at = coalesce(s.superseded_at, now()),
  updated_at = now(),
  comment = coalesce(s.comment, 'Superseded automatically during HAZOP sign-off schema repair.')
from ranked r
where s.ctid = r.ctid
  and r.rn > 1;

drop index if exists public.hazop_signoffs_active_role_assignee_uniq;

create unique index if not exists hazop_signoffs_active_role_assignee_uniq
  on public.hazop_signoffs (
    tenant_id,
    study_id,
    coalesce(nullif(signoff_role, ''), nullif(signature_role, ''), nullif(role, ''), 'HAZOP Sign-off'),
    coalesce(nullif(assigned_user_id, ''), nullif(signer_user_id, ''), 'unassigned')
  )
  where coalesce(status, '') <> 'Superseded';

create index if not exists hazop_signoffs_study_status_idx
  on public.hazop_signoffs (tenant_id, study_id, status, sequence_order);

create index if not exists hazop_signoffs_assigned_user_idx
  on public.hazop_signoffs (tenant_id, assigned_user_id, status);

create table if not exists public.hazop_approval_workflows (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null,
  workflow_name text not null default 'HAZOP Review & Sign-Off',
  workflow_engine_id text,
  status text not null default 'Not Started',
  current_step text,
  required_final_approver_role text,
  started_by text,
  started_at timestamptz,
  requested_by text,
  requested_at timestamptz,
  approved_by text,
  approved_at timestamptz,
  rejected_by text,
  rejected_at timestamptz,
  rejection_reason text,
  returned_by text,
  returned_at timestamptz,
  return_reason text,
  closed_by text,
  closed_at timestamptz,
  closure_comment text,
  reopened_by text,
  reopened_at timestamptz,
  reopen_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hazop_approval_workflows
  add column if not exists company_id text,
  add column if not exists site_id text,
  add column if not exists workflow_name text not null default 'HAZOP Review & Sign-Off',
  add column if not exists workflow_engine_id text,
  add column if not exists status text not null default 'Not Started',
  add column if not exists current_step text,
  add column if not exists required_final_approver_role text,
  add column if not exists started_by text,
  add column if not exists started_at timestamptz,
  add column if not exists requested_by text,
  add column if not exists requested_at timestamptz,
  add column if not exists approved_by text,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_by text,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists returned_by text,
  add column if not exists returned_at timestamptz,
  add column if not exists return_reason text,
  add column if not exists closed_by text,
  add column if not exists closed_at timestamptz,
  add column if not exists closure_comment text,
  add column if not exists reopened_by text,
  add column if not exists reopened_at timestamptz,
  add column if not exists reopen_reason text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists hazop_approval_workflows_study_idx
  on public.hazop_approval_workflows (tenant_id, study_id, status);

create table if not exists public.hazop_history_events (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null,
  event_type text not null,
  event_category text,
  event_title text,
  event_description text,
  title text,
  description text,
  severity text,
  actor_id text,
  actor_user_id text,
  actor_name_snapshot text,
  related_section text,
  related_record_id text,
  node_id text,
  scenario_id text,
  recommendation_id text,
  safeguard_id text,
  session_id text,
  attachment_id text,
  linked_record_id text,
  signoff_id text,
  before_values_json jsonb,
  after_values_json jsonb,
  metadata jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  safety_critical boolean not null default false,
  system_generated boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.hazop_history_events
  add column if not exists company_id text,
  add column if not exists site_id text,
  add column if not exists event_category text,
  add column if not exists event_title text,
  add column if not exists event_description text,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists severity text,
  add column if not exists actor_id text,
  add column if not exists actor_user_id text,
  add column if not exists actor_name_snapshot text,
  add column if not exists related_section text,
  add column if not exists related_record_id text,
  add column if not exists node_id text,
  add column if not exists scenario_id text,
  add column if not exists recommendation_id text,
  add column if not exists safeguard_id text,
  add column if not exists session_id text,
  add column if not exists attachment_id text,
  add column if not exists linked_record_id text,
  add column if not exists signoff_id text,
  add column if not exists before_values_json jsonb,
  add column if not exists after_values_json jsonb,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists metadata_json jsonb not null default '{}'::jsonb,
  add column if not exists safety_critical boolean not null default false,
  add column if not exists system_generated boolean not null default false,
  add column if not exists created_at timestamptz not null default now();

create index if not exists hazop_history_events_study_idx
  on public.hazop_history_events (tenant_id, study_id, created_at desc);

alter table public.hazop_signoffs enable row level security;
alter table public.hazop_approval_workflows enable row level security;
alter table public.hazop_history_events enable row level security;

grant select, insert, update, delete on public.hazop_signoffs to authenticated;
grant select, insert, update, delete on public.hazop_signoffs to service_role;
grant select, insert, update, delete on public.hazop_approval_workflows to authenticated;
grant select, insert, update, delete on public.hazop_approval_workflows to service_role;
grant select, insert, update, delete on public.hazop_history_events to authenticated;
grant select, insert, update, delete on public.hazop_history_events to service_role;

notify pgrst, 'reload schema';
