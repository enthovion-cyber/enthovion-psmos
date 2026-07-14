alter table public.lopa_studies
  add column if not exists ipl_validation_status text not null default 'Not Started',
  add column if not exists credited_ipl_count integer not null default 0,
  add column if not exists ipl_count integer not null default 0;

create table if not exists public.lopa_study_safeguards (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  hazop_safeguard_id text,
  registry_ipl_id text,
  safeguard_number text not null,
  safeguard_name text not null,
  safeguard_type text not null,
  source_type text not null default 'Manual',
  description text,
  related_scenario_id text,
  related_initiating_event_id text,
  related_consequence_id text,
  proposed_use text not null default 'Safeguard only',
  owner_id text,
  evidence_status text not null default 'Not Provided',
  notes text,
  status text not null default 'Active',
  source_snapshot_json jsonb not null default '{}'::jsonb,
  source_changed_warning boolean not null default false,
  created_by text,
  updated_by text,
  deleted_by text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, lopa_study_id, safeguard_number)
);

create table if not exists public.lopa_study_ipl_candidates (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  safeguard_id text references public.lopa_study_safeguards(id) on delete set null,
  registry_ipl_id text,
  candidate_number text not null,
  ipl_name text not null,
  ipl_type text not null,
  source_type text not null default 'Manual',
  registry_snapshot_json jsonb not null default '{}'::jsonb,
  protection_function text,
  preventive_or_mitigative text,
  related_initiating_event_id text,
  related_consequence_id text,
  validation_status text not null default 'Not Started',
  credit_status text not null default 'Not Requested',
  credited_in_calculation boolean not null default false,
  pfdavg numeric,
  rrf numeric,
  low_pfdavg numeric,
  high_pfdavg numeric,
  low_rrf numeric,
  high_rrf numeric,
  confidence_level text,
  pfd_rrf_basis text,
  source_reference text,
  pfd_rrf_mismatch_justification text,
  proof_test_basis text,
  proof_test_status text not null default 'Not Reviewed',
  evidence_status text not null default 'Not Provided',
  independence_status text not null default 'Not Reviewed',
  effectiveness_status text not null default 'Not Reviewed',
  specificity_status text not null default 'Not Reviewed',
  auditability_status text not null default 'Not Reviewed',
  common_cause_status text not null default 'Not Reviewed',
  double_counting_status text not null default 'Not Reviewed',
  owner_id text,
  notes text,
  rejected_reason text,
  rejected_by text,
  rejected_at timestamptz,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, lopa_study_id, candidate_number)
);

create table if not exists public.lopa_study_ipl_validation_criteria (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  ipl_candidate_id text not null references public.lopa_study_ipl_candidates(id) on delete cascade,
  criterion_key text not null,
  criterion_name text not null,
  criterion_category text not null,
  required_for_credit boolean not null default true,
  status text not null default 'Needs Review',
  evidence_reference text,
  notes text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, ipl_candidate_id, criterion_key)
);

create table if not exists public.lopa_study_ipl_equipment_links (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  ipl_candidate_id text not null references public.lopa_study_ipl_candidates(id) on delete cascade,
  equipment_id text,
  equipment_tag text,
  equipment_type text,
  relationship text not null default 'Protected Equipment',
  criticality text,
  status text,
  notes text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.lopa_study_ipl_document_links (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  ipl_candidate_id text not null references public.lopa_study_ipl_candidates(id) on delete cascade,
  document_id text,
  document_number text,
  document_title text,
  document_type text,
  revision text,
  status text,
  relationship text not null default 'Basis Document',
  controlled_document boolean not null default true,
  required_for_credit boolean not null default false,
  notes text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.lopa_study_ipl_proof_test_evidence (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  ipl_candidate_id text not null references public.lopa_study_ipl_candidates(id) on delete cascade,
  proof_test_required boolean not null default true,
  proof_test_interval text,
  proof_test_procedure_id text,
  last_proof_test_date date,
  next_proof_test_due date,
  inspection_required boolean not null default false,
  inspection_interval text,
  inspection_procedure_id text,
  maintenance_basis text,
  mi_program_id text,
  overdue_status text not null default 'Not Reviewed',
  evidence_attachment_id text,
  deferral_allowed boolean not null default false,
  deferral_approval_status text,
  notes text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, ipl_candidate_id)
);

create table if not exists public.lopa_study_ipl_gaps (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  ipl_candidate_id text references public.lopa_study_ipl_candidates(id) on delete set null,
  gap_type text not null,
  gap_title text not null,
  gap_description text,
  severity text not null default 'Medium',
  closure_blocker boolean not null default true,
  action_id text,
  status text not null default 'Open',
  created_by text,
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lopa_study_safeguards_study_idx on public.lopa_study_safeguards (tenant_id, lopa_study_id, deleted_at);
create index if not exists lopa_study_ipl_candidates_study_idx on public.lopa_study_ipl_candidates (tenant_id, lopa_study_id, validation_status, credit_status);
create index if not exists lopa_study_ipl_criteria_candidate_idx on public.lopa_study_ipl_validation_criteria (tenant_id, ipl_candidate_id, required_for_credit, status);
create index if not exists lopa_study_ipl_gaps_study_idx on public.lopa_study_ipl_gaps (tenant_id, lopa_study_id, status, closure_blocker);

alter table public.lopa_study_safeguards enable row level security;
alter table public.lopa_study_ipl_candidates enable row level security;
alter table public.lopa_study_ipl_validation_criteria enable row level security;
alter table public.lopa_study_ipl_equipment_links enable row level security;
alter table public.lopa_study_ipl_document_links enable row level security;
alter table public.lopa_study_ipl_proof_test_evidence enable row level security;
alter table public.lopa_study_ipl_gaps enable row level security;

grant select, insert, update, delete on public.lopa_study_safeguards to authenticated;
grant select, insert, update, delete on public.lopa_study_ipl_candidates to authenticated;
grant select, insert, update, delete on public.lopa_study_ipl_validation_criteria to authenticated;
grant select, insert, update, delete on public.lopa_study_ipl_equipment_links to authenticated;
grant select, insert, update, delete on public.lopa_study_ipl_document_links to authenticated;
grant select, insert, update, delete on public.lopa_study_ipl_proof_test_evidence to authenticated;
grant select, insert, update, delete on public.lopa_study_ipl_gaps to authenticated;

do $$
declare
  permission_key text;
  permission_keys text[] := array[
    'lopa.ipl.view',
    'lopa.ipl.import_hazop_safeguards',
    'lopa.ipl.safeguard.create',
    'lopa.ipl.safeguard.edit',
    'lopa.ipl.safeguard.delete',
    'lopa.ipl.upgrade_safeguard',
    'lopa.ipl.candidate.create',
    'lopa.ipl.candidate.edit',
    'lopa.ipl.candidate.delete',
    'lopa.ipl.registry.select',
    'lopa.ipl.validate',
    'lopa.ipl.credit',
    'lopa.ipl.uncredit',
    'lopa.ipl.reject',
    'lopa.ipl.reopen_validation',
    'lopa.ipl.links.manage',
    'lopa.ipl.proof_test.manage',
    'lopa.ipl.gaps.manage',
    'lopa.ipl.readiness.view',
    'lopa.ipl.export'
  ];
begin
  foreach permission_key in array permission_keys loop
    if to_regclass('public."Permission"') is not null then
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label", "action", "description")
      select gen_random_uuid()::text, t."id", permission_key, 'lopa', permission_key,
        split_part(permission_key, '.', array_length(string_to_array(permission_key, '.'), 1)), permission_key
      from public."Tenant" t
      where not exists (select 1 from public."Permission" p where p."tenantId" = t."id" and p."key" = permission_key);
    elsif to_regclass('public.permissions') is not null then
      insert into public.permissions (id, key, module, name, description)
      values (gen_random_uuid()::text, permission_key, 'LOPA', permission_key, permission_key)
      on conflict (key) do nothing;
    end if;
  end loop;

  if to_regclass('public."RolePermission"') is not null and to_regclass('public."Role"') is not null and to_regclass('public."Permission"') is not null then
    insert into public."RolePermission" ("roleId", "permissionId")
    select r."id", p."id"
    from public."Role" r
    join public."Permission" p on p."tenantId" = r."tenantId"
    where r."key" in ('platform_admin', 'corporate_admin', 'site_admin', 'super_admin', 'hse_manager', 'process_engineer', 'operations_supervisor', 'plant_manager')
      and p."key" = any(permission_keys)
    on conflict ("roleId", "permissionId") do nothing;
  end if;
end $$;
