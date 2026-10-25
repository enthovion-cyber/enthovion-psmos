-- Operating Procedures & Safe Work Practices (OSHA 29 CFR 1910.119(f)) - Phase 3 Lifecycle Workflow & e-Signatures
-- Multi-stage review workflows, Part 11 electronic signatures, publication freeze, and temporary procedure expiration.

create table if not exists public.op_approval_requests (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  procedure_id text not null references public.op_procedures(id) on delete cascade,
  revision_id text not null references public.op_revisions(id) on delete cascade,
  request_number text not null,
  title text not null,
  status text not null default 'In Review',
  current_stage_order integer not null default 1,
  priority text not null default 'Normal',
  submitted_by text null references public."User"(id) on delete set null,
  submitted_at timestamptz not null default now(),
  completed_at timestamptz null,
  effective_date date null,
  submission_notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint op_approval_requests_unique_number unique (company_id, request_number),
  constraint op_approval_requests_status_check check (status in ('Draft','In Review','Review Complete','Pending Approval','Approved','Returned','Rejected','Withdrawn','Published'))
);

create table if not exists public.op_approval_stages (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  request_id text not null references public.op_approval_requests(id) on delete cascade,
  stage_order integer not null default 1,
  stage_name text not null,
  reviewer_role text not null,
  assigned_user_ids text[] not null default '{}',
  status text not null default 'Pending',
  quorum_type text not null default 'Any',
  esign_required boolean not null default true,
  due_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint op_approval_stages_status_check check (status in ('Pending','Active','Approved','Returned','Rejected','Skipped'))
);

create table if not exists public.op_approval_decisions (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  request_id text not null references public.op_approval_requests(id) on delete cascade,
  stage_id text not null references public.op_approval_stages(id) on delete cascade,
  decision text not null,
  decision_comments text null,
  decided_by text null references public."User"(id) on delete set null,
  decided_at timestamptz not null default now(),
  meaning_of_signature text not null default 'I certify that this operating procedure is technically accurate, safe, and complies with OSHA 1910.119(f).',
  signature_hash text null,
  esignature_id text null,
  constraint op_approval_decisions_check check (decision in ('Approved','Approved with Comments','Returned for Revision','Rejected'))
);

create table if not exists public.op_publication_records (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  procedure_id text not null references public.op_procedures(id) on delete cascade,
  revision_id text not null references public.op_revisions(id) on delete cascade,
  published_by text null references public."User"(id) on delete set null,
  published_at timestamptz not null default now(),
  effective_date date not null,
  distribution_summary text null,
  acknowledgment_required boolean not null default true,
  notification_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.op_temporary_procedures (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  procedure_id text not null references public.op_procedures(id) on delete cascade,
  revision_id text not null references public.op_revisions(id) on delete cascade,
  moc_id text null,
  start_date date not null,
  expires_at date not null,
  revert_to_procedure_id text null,
  auto_expire boolean not null default true,
  is_expired boolean not null default false,
  expired_at timestamptz null,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_op_approval_reqs_proc on public.op_approval_requests(procedure_id, status);
create index if not exists idx_op_approval_reqs_rev on public.op_approval_requests(revision_id);
create index if not exists idx_op_approval_stages_req on public.op_approval_stages(request_id, stage_order);
create index if not exists idx_op_approval_decisions_req on public.op_approval_decisions(request_id);
create index if not exists idx_op_publications_proc on public.op_publication_records(procedure_id, effective_date desc);
create index if not exists idx_op_temp_procs on public.op_temporary_procedures(procedure_id, expires_at);

-- RLS
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'op_approval_requests','op_approval_stages','op_approval_decisions','op_publication_records','op_temporary_procedures'
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
