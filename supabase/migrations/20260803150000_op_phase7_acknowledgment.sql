-- Operating Procedures & Safe Work Practices (OSHA 29 CFR 1910.119(f)) - Phase 7
-- Read-and-Understand Acknowledgment, Comprehension Quizzes, E-Signatures, and Execution Gating.

create table if not exists public.op_acknowledgment_requirements (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  procedure_id text not null references public.op_procedures(id) on delete cascade,
  revision_id text not null references public.op_revisions(id) on delete cascade,
  requirement_title text not null,
  target_audience text not null default 'Operating Crew',
  target_role_ids text[] not null default '{}',
  target_unit_ids text[] not null default '{}',
  target_user_ids text[] not null default '{}',
  grace_period_days integer not null default 14,
  due_date date null,
  requires_quiz boolean not null default false,
  min_quiz_score integer not null default 80,
  quiz_questions jsonb null,
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint op_ack_req_target_check check (target_audience in ('All Operators','Operating Crew','Job Role','Unit Workers','Contractors','Specific Users')),
  constraint op_ack_req_status_check check (status in ('Draft','Active','Closed','Archived'))
);

create table if not exists public.op_acknowledgment_records (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  requirement_id text not null references public.op_acknowledgment_requirements(id) on delete cascade,
  procedure_id text not null references public.op_procedures(id) on delete cascade,
  revision_id text not null references public.op_revisions(id) on delete cascade,
  worker_user_id text not null references public."User"(id) on delete cascade,
  status text not null default 'Pending',
  due_date date not null,
  acknowledged_at timestamptz null,
  signature_hash text null,
  attestation_statement text null,
  quiz_score integer null,
  quiz_passed boolean null,
  device_info jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint op_ack_unique_worker_rev unique (company_id, revision_id, worker_user_id),
  constraint op_ack_records_status_check check (status in ('Pending','Acknowledged','Overdue','Waived'))
);

-- Performance Indexes
create index if not exists idx_op_ack_req_proc on public.op_acknowledgment_requirements(procedure_id, revision_id);
create index if not exists idx_op_ack_req_comp on public.op_acknowledgment_requirements(company_id, status);
create index if not exists idx_op_ack_rec_worker on public.op_acknowledgment_records(company_id, worker_user_id, status);
create index if not exists idx_op_ack_rec_rev on public.op_acknowledgment_records(revision_id, status);

-- RLS
do $$
declare
  table_name text;
begin
  foreach table_name in array array['op_acknowledgment_requirements', 'op_acknowledgment_records'] loop
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
