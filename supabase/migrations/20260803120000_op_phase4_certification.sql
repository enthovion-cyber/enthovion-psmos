-- Operating Procedures & Safe Work Practices (OSHA 29 CFR 1910.119(f)(3)) - Phase 4 Periodic Annual Certification
-- Annual certification cycles, SME review checklist, electronic certification attestations, and Site Employer Certification Statements.

create table if not exists public.op_certification_cycles (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  procedure_id text not null references public.op_procedures(id) on delete cascade,
  cycle_year integer not null,
  cycle_code text not null,
  due_date date not null,
  status text not null default 'Upcoming',
  assigned_sme_ids text[] not null default '{}',
  last_certified_at date null,
  completed_at timestamptz null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint op_cert_cycles_unique unique (company_id, procedure_id, cycle_year),
  constraint op_cert_cycles_status_check check (status in ('Upcoming','Due','Overdue','Certified','Certified With Changes','Expired'))
);

create table if not exists public.op_certification_checklist_items (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  item_code text not null,
  question_text text not null,
  osha_subparagraph text not null default '1910.119(f)(3)',
  expected_answer boolean not null default true,
  is_mandatory boolean not null default true,
  sort_order integer not null default 10,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint op_cert_checklist_unique unique (company_id, item_code)
);

create table if not exists public.op_certification_reviews (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  cycle_id text not null references public.op_certification_cycles(id) on delete cascade,
  procedure_id text not null references public.op_procedures(id) on delete cascade,
  reviewer_user_id text not null references public."User"(id) on delete cascade,
  checklist_responses jsonb not null default '{}'::jsonb,
  findings_summary text null,
  outcome text not null,
  meaning_of_signature text not null default 'I certify that I have reviewed this operating procedure and verify that it reflects current operating practice and safe operating limits per OSHA 1910.119(f)(3).',
  signature_hash text null,
  esignature_id text null,
  certified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint op_cert_reviews_outcome_check check (outcome in ('Current & Accurate (No Change)','Certified with Minor Edits','Revision Required via MOC'))
);

create table if not exists public.op_annual_certification_statements (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  year integer not null,
  total_procedures integer not null default 0,
  certified_procedures integer not null default 0,
  procedures_under_revision integer not null default 0,
  overdue_procedures integer not null default 0,
  compliance_percentage numeric not null default 0,
  signed_by_user_id text null references public."User"(id) on delete set null,
  signed_at timestamptz null,
  statement_text text not null,
  statement_status text not null default 'Generated',
  signature_hash text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint op_annual_statements_unique unique (company_id, site_id, year),
  constraint op_annual_statements_status check (statement_status in ('Draft','Generated','Certified & Signed'))
);

-- Indexes
create index if not exists idx_op_cert_cycles_proc on public.op_certification_cycles(procedure_id, status);
create index if not exists idx_op_cert_cycles_due on public.op_certification_cycles(company_id, due_date, status);
create index if not exists idx_op_cert_reviews_cycle on public.op_certification_reviews(cycle_id);
create index if not exists idx_op_annual_statements_site on public.op_annual_certification_statements(company_id, site_id, year);

-- RLS
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'op_certification_cycles','op_certification_checklist_items','op_certification_reviews','op_annual_certification_statements'
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

-- Seed OSHA 1910.119(f)(3) standard checklist questions
do $$
declare
  tenant_row record;
begin
  for tenant_row in select id from public."Tenant" loop
    insert into public.op_certification_checklist_items (id, company_id, item_code, question_text, osha_subparagraph, sort_order)
    values
      (gen_random_uuid()::text, tenant_row.id, 'CURRENT_PRACTICE', 'Does this operating procedure reflect current operating practice and actual field execution?', '1910.119(f)(3)', 10),
      (gen_random_uuid()::text, tenant_row.id, 'FACILITY_CHANGES', 'Have any equipment, piping, or instrument changes occurred that require updating this procedure?', '1910.119(f)(3)', 20),
      (gen_random_uuid()::text, tenant_row.id, 'SOL_ACCURACY', 'Are Safe Operating Limits (SOL), operating ranges, and deviation corrective actions still accurate?', '1910.119(f)(1)(ii)', 30),
      (gen_random_uuid()::text, tenant_row.id, 'INCIDENT_FEEDBACK', 'Have any incident findings, near-misses, or HAZOP/LOPA actions identified needed procedure revisions?', '1910.119(m)(5)', 40),
      (gen_random_uuid()::text, tenant_row.id, 'MOC_INCORPORATION', 'Have all temporary MOCs or temporary procedures affecting this unit been closed or permanently integrated?', '1910.119(l)', 50)
    on conflict do nothing;
  end loop;
end $$;
