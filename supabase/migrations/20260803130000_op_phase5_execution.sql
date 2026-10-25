-- Operating Procedures & Safe Work Practices (OSHA 29 CFR 1910.119(f)) - Phase 5 Execution
-- Interactive Step-by-Step Execution Runs, Live Value Capture & SOL Verification,
-- Hold Points, Safe Work Verifications, Shift Handovers, and Field Checklists.

create table if not exists public.op_executions (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  procedure_id text not null references public.op_procedures(id) on delete cascade,
  revision_id text not null references public.op_revisions(id),
  execution_number text not null,
  title text not null,
  execution_mode text not null default 'Normal',
  unit_id text null,
  equipment_id text null,
  shift text null,
  crew text null,
  linked_ptw_id text null,
  linked_pssr_id text null,
  linked_moc_id text null,
  status text not null default 'In Progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  executed_by_user_id text not null references public."User"(id) on delete set null,
  supervisor_user_id text null references public."User"(id) on delete set null,
  supervisor_signed_at timestamptz null,
  supervisor_notes text null,
  total_steps integer not null default 0,
  completed_steps integer not null default 0,
  skipped_steps integer not null default 0,
  deviated_steps integer not null default 0,
  offline_cached boolean not null default false,
  device_info jsonb null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint op_executions_unique_number unique (company_id, execution_number),
  constraint op_executions_mode_check check (execution_mode in ('Startup','Shutdown','Normal','Emergency Shutdown','Emergency Operation','Temporary','Training','Dry Run')),
  constraint op_executions_status_check check (status in ('Planned','In Progress','Paused','Completed','Aborted','Under Review','Reviewed'))
);

create table if not exists public.op_execution_steps (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  execution_id text not null references public.op_executions(id) on delete cascade,
  step_id text null references public.op_steps(id) on delete set null,
  section_id text null references public.op_sections(id) on delete set null,
  section_title text null,
  step_number text not null,
  step_title text null,
  step_text text not null,
  step_type text not null default 'action',
  step_order integer not null default 0,
  is_critical boolean not null default false,
  requires_signoff boolean not null default false,
  requires_witness boolean not null default false,
  is_hold_point boolean not null default false,
  expected_limits text null,
  min_value numeric null,
  max_value numeric null,
  uom text null,
  status text not null default 'Pending',
  recorded_value text null,
  recorded_numeric numeric null,
  is_in_limits boolean null,
  skip_reason text null,
  deviation_reason text null,
  performed_by_user_id text null references public."User"(id) on delete set null,
  performed_at timestamptz null,
  witness_by_user_id text null references public."User"(id) on delete set null,
  witness_at timestamptz null,
  signature_hash text null,
  photo_url text null,
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint op_execution_steps_status check (status in ('Pending','In Progress','Completed','Skipped','Deviated','N/A'))
);

create table if not exists public.op_execution_holds (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  execution_id text not null references public.op_executions(id) on delete cascade,
  step_id text not null references public.op_execution_steps(id) on delete cascade,
  step_number text null,
  hold_reason text not null,
  required_role text null default 'Shift Supervisor',
  status text not null default 'Holding',
  released_by_user_id text null references public."User"(id) on delete set null,
  released_at timestamptz null,
  release_notes text null,
  signature_hash text null,
  created_at timestamptz not null default now(),
  constraint op_execution_holds_status check (status in ('Holding','Released','Bypassed'))
);

create table if not exists public.op_execution_deviations (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  execution_id text not null references public.op_executions(id) on delete cascade,
  execution_step_id text null references public.op_execution_steps(id) on delete set null,
  step_number text null,
  parameter_name text not null,
  expected_limits text null,
  actual_value text not null,
  deviation_severity text not null default 'Medium',
  deviation_description text not null,
  immediate_corrective_action text not null,
  logged_by_user_id text not null references public."User"(id) on delete set null,
  action_id text null,
  incident_id text null,
  is_resolved boolean not null default false,
  resolved_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint op_execution_deviations_sev check (deviation_severity in ('Low','Medium','High','Critical'))
);

create table if not exists public.op_execution_handovers (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  execution_id text not null references public.op_executions(id) on delete cascade,
  shift_from text not null,
  shift_to text not null,
  outgoing_supervisor_id text not null references public."User"(id) on delete set null,
  incoming_supervisor_id text not null references public."User"(id) on delete set null,
  current_step_number text null,
  handover_notes text not null,
  equipment_status text null,
  hazards_or_deviations_noted text null,
  signed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_op_executions_proc on public.op_executions(procedure_id, status);
create index if not exists idx_op_executions_site on public.op_executions(company_id, site_id, status);
create index if not exists idx_op_executions_number on public.op_executions(company_id, execution_number);
create index if not exists idx_op_execution_steps_exec on public.op_execution_steps(execution_id, step_order);
create index if not exists idx_op_execution_holds_exec on public.op_execution_holds(execution_id, status);
create index if not exists idx_op_execution_devs_exec on public.op_execution_deviations(execution_id);
create index if not exists idx_op_execution_handovers_exec on public.op_execution_handovers(execution_id);

-- RLS
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'op_executions','op_execution_steps','op_execution_holds','op_execution_deviations','op_execution_handovers'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_select_company_site', table_name);
    execute format('create policy %I on public.%I for select using (public.op_company_site_visible(company_id, site_id))', table_name || '_select_company_site', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_company_site', table_name);
    execute format('create policy %I on public.%I for insert with check (public.op_company_site_visible(company_id, site_id))', table_name || '_insert_company_site', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_company_site', table_name);
    execute format('create policy %I on public.%I for update using (public.op_company_site_visible(company_id, site_id)) with check (public.op_company_site_visible(company_id, site_id))', table_name || '_update_company_site', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_company_site', table_name);
    execute format('create policy %I on public.%I for delete using (public.op_company_site_visible(company_id, site_id))', table_name || '_delete_company_site', table_name);
  end loop;
end $$;
