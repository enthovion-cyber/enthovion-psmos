-- Training & Competency workforce schema hardening.
-- This is intentionally ALTER-based because earlier partial/local runs may have
-- created these tables before the full Phase 1 migration existed. CREATE TABLE
-- IF NOT EXISTS does not backfill missing columns.

create table if not exists public.training_workers (
  id text primary key,
  company_id text not null,
  display_name text not null,
  employee_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.training_workers add column if not exists primary_site_id text null;
alter table public.training_workers add column if not exists linked_user_id text null;
alter table public.training_workers add column if not exists first_name text null;
alter table public.training_workers add column if not exists last_name text null;
alter table public.training_workers add column if not exists work_email text null;
alter table public.training_workers add column if not exists personal_email text null;
alter table public.training_workers add column if not exists phone text null;
alter table public.training_workers add column if not exists contractor_id text null;
alter table public.training_workers add column if not exists badge_number text null;
alter table public.training_workers add column if not exists preferred_language text null;
alter table public.training_workers add column if not exists timezone text null;
alter table public.training_workers add column if not exists worker_type text not null default 'Employee';
alter table public.training_workers add column if not exists employer_type text not null default 'Company employee';
alter table public.training_workers add column if not exists contractor_company_name text null;
alter table public.training_workers add column if not exists vendor_company_name text null;
alter table public.training_workers add column if not exists department_id text null;
alter table public.training_workers add column if not exists department_name text null;
alter table public.training_workers add column if not exists job_title text null;
alter table public.training_workers add column if not exists employment_status text not null default 'Pending onboarding';
alter table public.training_workers add column if not exists start_date date null;
alter table public.training_workers add column if not exists end_date date null;
alter table public.training_workers add column if not exists contract_expiry_date date null;
alter table public.training_workers add column if not exists supervisor_user_id text null;
alter table public.training_workers add column if not exists line_manager_user_id text null;
alter table public.training_workers add column if not exists work_schedule_foundation text null;
alter table public.training_workers add column if not exists shift_team_foundation text null;
alter table public.training_workers add column if not exists safety_critical_role boolean not null default false;
alter table public.training_workers add column if not exists app_access_required boolean not null default false;
alter table public.training_workers add column if not exists training_status text not null default 'Not Assessed';
alter table public.training_workers add column if not exists certification_status text not null default 'Not Assessed';
alter table public.training_workers add column if not exists competency_status text not null default 'Not Assessed';
alter table public.training_workers add column if not exists ptw_authorization_status text not null default 'Not Assessed';
alter table public.training_workers add column if not exists sop_acknowledgement_status text null default 'Not Assessed';
alter table public.training_workers add column if not exists moc_training_status text null default 'Not Assessed';
alter table public.training_workers add column if not exists pssr_training_readiness_status text null default 'Not Assessed';
alter table public.training_workers add column if not exists review_status text not null default 'Not Reviewed';
alter table public.training_workers add column if not exists status text not null default 'Draft';
alter table public.training_workers add column if not exists notes text null;
alter table public.training_workers add column if not exists created_by text null;
alter table public.training_workers add column if not exists updated_by text null;
alter table public.training_workers add column if not exists archived_at timestamptz null;
alter table public.training_workers add column if not exists archived_by text null;
alter table public.training_workers add column if not exists archive_reason text null;

do $$
declare
  column_name text;
begin
  foreach column_name in array array[
    'primary_site_id',
    'linked_user_id',
    'first_name',
    'last_name',
    'work_email',
    'personal_email',
    'phone',
    'employee_id',
    'contractor_id',
    'badge_number',
    'preferred_language',
    'timezone',
    'contractor_company_name',
    'vendor_company_name',
    'department_id',
    'department_name',
    'job_title',
    'start_date',
    'end_date',
    'contract_expiry_date',
    'supervisor_user_id',
    'line_manager_user_id',
    'work_schedule_foundation',
    'shift_team_foundation',
    'sop_acknowledgement_status',
    'moc_training_status',
    'pssr_training_readiness_status',
    'notes',
    'created_by',
    'updated_by',
    'archived_at',
    'archived_by',
    'archive_reason'
  ] loop
    execute format('alter table public.training_workers alter column %I drop not null', column_name);
  end loop;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'training_workers_identifier_check'
      and conrelid = 'public.training_workers'::regclass
  ) then
    alter table public.training_workers add constraint training_workers_identifier_check check (
      nullif(work_email, '') is not null
      or nullif(employee_id, '') is not null
      or nullif(contractor_id, '') is not null
      or nullif(badge_number, '') is not null
    );
  end if;
end $$;

create table if not exists public.training_worker_site_assignments (
  id text primary key,
  company_id text not null,
  worker_id text not null references public.training_workers(id) on delete cascade,
  site_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.training_worker_site_assignments add column if not exists department_id text null;
alter table public.training_worker_site_assignments add column if not exists unit_id text null;
alter table public.training_worker_site_assignments add column if not exists area_id text null;
alter table public.training_worker_site_assignments add column if not exists equipment_id text null;
alter table public.training_worker_site_assignments add column if not exists primary_assignment boolean not null default false;
alter table public.training_worker_site_assignments add column if not exists assignment_status text not null default 'Active';
alter table public.training_worker_site_assignments add column if not exists assignment_start_date date null;
alter table public.training_worker_site_assignments add column if not exists assignment_end_date date null;
alter table public.training_worker_site_assignments add column if not exists assignment_reason text null;
alter table public.training_worker_site_assignments add column if not exists supervisor_user_id text null;
alter table public.training_worker_site_assignments add column if not exists notes text null;
alter table public.training_worker_site_assignments add column if not exists created_by text null;
alter table public.training_worker_site_assignments add column if not exists updated_by text null;
alter table public.training_worker_site_assignments add column if not exists removed_at timestamptz null;
alter table public.training_worker_site_assignments add column if not exists removed_by text null;
alter table public.training_worker_site_assignments add column if not exists remove_reason text null;

create table if not exists public.training_worker_role_assignments (
  id text primary key,
  company_id text not null,
  worker_id text not null references public.training_workers(id) on delete cascade,
  job_role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.training_worker_role_assignments add column if not exists site_id text null;
alter table public.training_worker_role_assignments add column if not exists unit_id text null;
alter table public.training_worker_role_assignments add column if not exists area_id text null;
alter table public.training_worker_role_assignments add column if not exists competency_profile_id text null;
alter table public.training_worker_role_assignments add column if not exists required_training_profile_id text null;
alter table public.training_worker_role_assignments add column if not exists safety_critical boolean not null default false;
alter table public.training_worker_role_assignments add column if not exists ptw_role_candidate boolean not null default false;
alter table public.training_worker_role_assignments add column if not exists operations_role boolean not null default false;
alter table public.training_worker_role_assignments add column if not exists maintenance_role boolean not null default false;
alter table public.training_worker_role_assignments add column if not exists hse_role boolean not null default false;
alter table public.training_worker_role_assignments add column if not exists engineering_role boolean not null default false;
alter table public.training_worker_role_assignments add column if not exists contractor_role boolean not null default false;
alter table public.training_worker_role_assignments add column if not exists ptw_role_candidates_json jsonb not null default '[]'::jsonb;
alter table public.training_worker_role_assignments add column if not exists role_status text not null default 'Active';
alter table public.training_worker_role_assignments add column if not exists effective_date date null;
alter table public.training_worker_role_assignments add column if not exists expiry_date date null;
alter table public.training_worker_role_assignments add column if not exists notes text null;
alter table public.training_worker_role_assignments add column if not exists created_by text null;
alter table public.training_worker_role_assignments add column if not exists updated_by text null;
alter table public.training_worker_role_assignments add column if not exists removed_at timestamptz null;
alter table public.training_worker_role_assignments add column if not exists removed_by text null;
alter table public.training_worker_role_assignments add column if not exists remove_reason text null;

create table if not exists public.training_worker_account_links (
  id text primary key,
  company_id text not null,
  worker_id text not null references public.training_workers(id) on delete cascade,
  linked_email text not null,
  created_at timestamptz not null default now()
);

alter table public.training_worker_account_links add column if not exists user_id text null;
alter table public.training_worker_account_links add column if not exists link_status text not null default 'Linked';
alter table public.training_worker_account_links add column if not exists app_access_required boolean not null default false;
alter table public.training_worker_account_links add column if not exists linked_by text null;
alter table public.training_worker_account_links add column if not exists linked_at timestamptz not null default now();
alter table public.training_worker_account_links add column if not exists unlinked_by text null;
alter table public.training_worker_account_links add column if not exists unlinked_at timestamptz null;
alter table public.training_worker_account_links add column if not exists unlink_reason text null;

create table if not exists public.training_worker_documents (
  id text primary key,
  company_id text not null,
  worker_id text not null references public.training_workers(id) on delete cascade,
  document_id text not null,
  document_type text not null,
  created_at timestamptz not null default now()
);

alter table public.training_worker_documents add column if not exists site_id text null;
alter table public.training_worker_documents add column if not exists relationship_type text not null default 'Evidence';
alter table public.training_worker_documents add column if not exists restricted_visibility boolean not null default false;
alter table public.training_worker_documents add column if not exists linked_by text null;
alter table public.training_worker_documents add column if not exists linked_at timestamptz not null default now();
alter table public.training_worker_documents add column if not exists removed_by text null;
alter table public.training_worker_documents add column if not exists removed_at timestamptz null;
alter table public.training_worker_documents add column if not exists remove_reason text null;

create table if not exists public.training_worker_history_events (
  id text primary key,
  company_id text not null,
  event_type text not null,
  event_title text not null,
  source_module text not null default 'Training & Competency',
  created_at timestamptz not null default now()
);

alter table public.training_worker_history_events add column if not exists site_id text null;
alter table public.training_worker_history_events add column if not exists unit_id text null;
alter table public.training_worker_history_events add column if not exists area_id text null;
alter table public.training_worker_history_events add column if not exists worker_id text null;
alter table public.training_worker_history_events add column if not exists event_description text null;
alter table public.training_worker_history_events add column if not exists before_value_json jsonb null;
alter table public.training_worker_history_events add column if not exists after_value_json jsonb null;
alter table public.training_worker_history_events add column if not exists actor_user_id text null;
alter table public.training_worker_history_events add column if not exists source_record_id text null;

create table if not exists public.training_worker_status_snapshots (
  id text primary key,
  company_id text not null,
  worker_id text not null references public.training_workers(id) on delete cascade,
  snapshot_type text not null,
  training_status text not null,
  certification_status text not null,
  competency_status text not null,
  ptw_authorization_status text not null,
  created_at timestamptz not null default now()
);

alter table public.training_worker_status_snapshots add column if not exists site_id text null;
alter table public.training_worker_status_snapshots add column if not exists unit_id text null;
alter table public.training_worker_status_snapshots add column if not exists sop_acknowledgement_status text null;
alter table public.training_worker_status_snapshots add column if not exists moc_training_status text null;
alter table public.training_worker_status_snapshots add column if not exists pssr_training_readiness_status text null;
alter table public.training_worker_status_snapshots add column if not exists safety_critical_gap_count integer not null default 0;
alter table public.training_worker_status_snapshots add column if not exists overdue_training_count integer not null default 0;
alter table public.training_worker_status_snapshots add column if not exists expiring_certification_count integer not null default 0;
alter table public.training_worker_status_snapshots add column if not exists blocked_reason text null;
alter table public.training_worker_status_snapshots add column if not exists calculated_by_system boolean not null default true;
alter table public.training_worker_status_snapshots add column if not exists calculated_at timestamptz not null default now();

create table if not exists public.training_settings (
  id text primary key,
  company_id text not null,
  updated_at timestamptz not null default now()
);

alter table public.training_settings add column if not exists site_id text null;
alter table public.training_settings add column if not exists default_training_expiry_warning_days integer not null default 30;
alter table public.training_settings add column if not exists default_certification_expiry_warning_days integer not null default 60;
alter table public.training_settings add column if not exists require_site_assignment_for_active_worker boolean not null default true;
alter table public.training_settings add column if not exists require_role_assignment_for_active_worker boolean not null default true;
alter table public.training_settings add column if not exists allow_worker_without_user_account boolean not null default true;
alter table public.training_settings add column if not exists contractor_access_requires_site_assignment boolean not null default true;
alter table public.training_settings add column if not exists safety_critical_worker_requires_review boolean not null default true;
alter table public.training_settings add column if not exists settings_json jsonb null;
alter table public.training_settings add column if not exists updated_by text null;

create index if not exists training_workers_company_site_idx on public.training_workers(company_id, primary_site_id);
create index if not exists training_workers_company_work_email_idx on public.training_workers(company_id, lower(work_email));
create index if not exists training_workers_company_employee_idx on public.training_workers(company_id, employee_id);
create index if not exists training_workers_company_contractor_idx on public.training_workers(company_id, contractor_id);
create index if not exists training_workers_company_badge_idx on public.training_workers(company_id, badge_number);

alter table public.training_workers enable row level security;
alter table public.training_worker_site_assignments enable row level security;
alter table public.training_worker_role_assignments enable row level security;
alter table public.training_worker_account_links enable row level security;
alter table public.training_worker_documents enable row level security;
alter table public.training_worker_history_events enable row level security;
alter table public.training_worker_status_snapshots enable row level security;
alter table public.training_settings enable row level security;

grant select, insert, update, delete on public.training_workers to authenticated;
grant select, insert, update, delete on public.training_worker_site_assignments to authenticated;
grant select, insert, update, delete on public.training_worker_role_assignments to authenticated;
grant select, insert, update, delete on public.training_worker_account_links to authenticated;
grant select, insert, update, delete on public.training_worker_documents to authenticated;
grant select, insert on public.training_worker_history_events to authenticated;
grant select, insert on public.training_worker_status_snapshots to authenticated;
grant select, insert, update on public.training_settings to authenticated;

notify pgrst, 'reload schema';
