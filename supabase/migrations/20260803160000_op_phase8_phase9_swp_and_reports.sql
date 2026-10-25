-- Operating Procedures & Safe Work Practices (OSHA 29 CFR 1910.119(f)) - Phase 8 & Phase 9
-- Safe Work Practices (SWP) Library, Job Safety Analysis (JSA / JHA) Engine,
-- Pre-Job Toolbox Talk Rosters, and OSHA 1910.119(f) Audit Evidence Packages.

create table if not exists public.op_swp_programs (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  program_code text not null,
  program_name text not null,
  regulatory_reference text not null,
  description text not null,
  mandatory_ppe text[] not null default '{}',
  gas_testing_required boolean not null default false,
  permit_required boolean not null default false,
  permit_type text null,
  training_qualification_code text null,
  standard_operating_procedure_id text null references public.op_procedures(id) on delete set null,
  checklist_items jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint op_swp_programs_unique_code unique (company_id, program_code)
);

create table if not exists public.op_jsas (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  jsa_number text not null,
  title text not null,
  unit_id text null,
  equipment_id text null,
  swp_program_id text null references public.op_swp_programs(id) on delete set null,
  procedure_id text null references public.op_procedures(id) on delete set null,
  work_order_id text null,
  linked_ptw_id text null,
  job_location text not null,
  prepared_by_user_id text not null references public."User"(id) on delete set null,
  supervisor_user_id text null references public."User"(id) on delete set null,
  hse_reviewer_user_id text null references public."User"(id) on delete set null,
  status text not null default 'Draft',
  initial_risk_level text not null default 'Medium',
  residual_risk_level text not null default 'Low',
  required_ppe text[] not null default '{}',
  special_tools_equipment text null,
  emergency_rescue_plan text null,
  approved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint op_jsas_unique_number unique (company_id, jsa_number),
  constraint op_jsas_status_check check (status in ('Draft','Under Review','Approved','Active','Completed','Archived')),
  constraint op_jsas_risk_check check (initial_risk_level in ('Low','Medium','High','Critical'))
);

create table if not exists public.op_jsa_steps (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  jsa_id text not null references public.op_jsas(id) on delete cascade,
  step_number integer not null,
  job_step_description text not null,
  potential_hazards text not null,
  consequence text null,
  hazard_category text not null default 'Mechanical',
  preventative_controls text not null,
  initial_severity text not null default 'Medium',
  initial_likelihood text not null default 'Medium',
  residual_severity text not null default 'Low',
  residual_likelihood text not null default 'Low',
  responsible_role text null,
  created_at timestamptz not null default now()
);

create table if not exists public.op_jsa_roster (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  jsa_id text not null references public.op_jsas(id) on delete cascade,
  worker_user_id text not null references public."User"(id) on delete cascade,
  worker_name text not null,
  contractor_company text null,
  role text not null default 'Craft Technician',
  attended_briefing boolean not null default true,
  acknowledged_at timestamptz not null default now(),
  signature_hash text null
);

create table if not exists public.op_audit_packages (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  package_number text not null,
  title text not null,
  scope_type text not null default 'Full Site',
  year integer not null,
  generated_by_user_id text not null references public."User"(id) on delete set null,
  status text not null default 'Ready',
  package_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint op_audit_pkgs_unique unique (company_id, package_number)
);

-- Performance Indexes
create index if not exists idx_op_swp_programs_code on public.op_swp_programs(company_id, program_code);
create index if not exists idx_op_jsas_num on public.op_jsas(company_id, jsa_number);
create index if not exists idx_op_jsas_proc on public.op_jsas(procedure_id);
create index if not exists idx_op_jsa_steps_jsa on public.op_jsa_steps(jsa_id, step_number);
create index if not exists idx_op_jsa_roster_jsa on public.op_jsa_roster(jsa_id);
create index if not exists idx_op_audit_packages on public.op_audit_packages(company_id, year);

-- RLS
do $$
declare
  table_name text;
begin
  foreach table_name in array array['op_swp_programs', 'op_jsas', 'op_jsa_steps', 'op_jsa_roster', 'op_audit_packages'] loop
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

-- Seed Standard OSHA 1910.119(f)(4) Safe Work Practice Programs
do $$
declare
  tenant_row record;
begin
  for tenant_row in select id from public."Tenant" loop
    insert into public.op_swp_programs (id, company_id, program_code, program_name, regulatory_reference, description, mandatory_ppe, gas_testing_required, permit_required, permit_type)
    values
      (gen_random_uuid()::text, tenant_row.id, 'SWP-LOTO', 'Control of Hazardous Energy (Lockout / Tagout)', '29 CFR 1910.119(f)(4); 1910.147', 'Mandatory energy isolation protocols for electrical, pressure, chemical, and thermal systems before servicing or maintenance.', array['Safety Glasses','Steel-toe Boots','Hard Hat','Leather Gloves'], false, true, 'LOTO Permit / Isolation Certificate'),
      (gen_random_uuid()::text, tenant_row.id, 'SWP-CSE', 'Confined Space Entry', '29 CFR 1910.119(f)(4); 1910.146', 'Atmospheric testing, attendant monitoring, ventilation, and emergency rescue provisions for permit-required confined spaces.', array['Continuous 4-Gas Monitor','Harness & Lanyard','Respirator (if required)','Hard Hat'], true, true, 'Confined Space Entry Permit'),
      (gen_random_uuid()::text, tenant_row.id, 'SWP-LINE-BREAK', 'Opening Process Equipment & Line Breaking', '29 CFR 1910.119(f)(4)', 'Safe de-inventorying, purging, verification of zero energy, and PPE requirements for opening process piping and equipment.', array['Chemical Splash Goggles','Face Shield','Acid/Chemical Gloves','Chemical Apron'], true, true, 'Cold Work / Line Break Permit'),
      (gen_random_uuid()::text, tenant_row.id, 'SWP-HOT-WORK', 'Hot Work Safety & Fire Watch', '29 CFR 1910.119(k); 1910.252', 'Fire prevention, combustible gas detection, spark containment, and 30-minute minimum post-work fire watch monitoring.', array['Welding Helmet/Goggles','Flame-Resistant Clothing (FRC)','Welding Gloves'], true, true, 'Hot Work Permit'),
      (gen_random_uuid()::text, tenant_row.id, 'SWP-EXCAVATION', 'Excavation & Ground Disturbance', '29 CFR 1926.651', 'Underground utility location, soil classification, trench shoring, and protective shielding.', array['Hard Hat','High-Visibility Vest','Steel-toe Boots'], true, true, 'Excavation Permit'),
      (gen_random_uuid()::text, tenant_row.id, 'SWP-HEIGHTS', 'Working at Heights & Fall Protection', '29 CFR 1910.140; 1926.501', 'Fall protection arrest systems, 100% tie-off rules, scaffold inspection tagging, and dropped-object prevention.', array['Full Body Harness','Dual Shock-Absorbing Lanyards','Chin Strap Hard Hat'], false, false, null),
      (gen_random_uuid()::text, tenant_row.id, 'SWP-ACCESS', 'Facility Entrance & Contractor Control', '29 CFR 1910.119(f)(4); 1910.119(h)', 'Access control, safety orientation verification, gate security, and badge tracking for maintenance, contractor, and lab personnel.', array['Standard Plant PPE','Safety Glasses','FRC'], false, false, null)
    on conflict do nothing;
  end loop;
end $$;
