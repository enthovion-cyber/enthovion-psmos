-- LOPA study-level SIL determination and SIF specification.
-- SIL targets are always selected by the configured backend methodology; this schema
-- intentionally does not seed SIL/RRF/PFD values.

alter table public.lopa_studies
  add column if not exists sil_determination_status text not null default 'Not Started',
  add column if not exists sil_needs_reassessment boolean not null default false,
  add column if not exists sil_last_determined_at timestamptz,
  add column if not exists sil_last_determined_by text,
  add column if not exists sil_locked boolean not null default false;

create table if not exists public.lopa_sil_determinations (
  id text primary key, tenant_id text not null, company_id text, site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  risk_calculation_id text references public.lopa_risk_calculations(id) on delete set null,
  status text not null default 'Not Started', methodology_name text, methodology_version text, methodology_reference text,
  required_rrf numeric, required_pfdavg numeric, target_sil text, sil_required boolean not null default false,
  existing_sif_id text, existing_sif_assessment text, new_sif_required boolean not null default false,
  installed_sil text, sil_gap_status text, alarp_category text, determination_basis text,
  override_reason text, override_by text, override_at timestamptz,
  locked boolean not null default false, locked_by text, locked_at timestamptz,
  superseded_by_id text, determined_by text, determined_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (tenant_id, lopa_study_id)
);

create table if not exists public.lopa_sif_specifications (
  id text primary key, tenant_id text not null, company_id text, site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  sil_determination_id text references public.lopa_sil_determinations(id) on delete cascade,
  sif_tag text, title text not null, safety_function text, target_sil text, status text not null default 'Draft',
  safe_state text, trip_setpoint text, reset_requirement text, process_action text,
  operating_mode text, demand_mode text, response_time text, bypass_management text,
  proof_test_interval text, proof_test_basis text, maintenance_requirements text,
  equipment_system text, owner_id text, notes text, complete boolean not null default false,
  created_by text, updated_by text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.lopa_sif_components (
  id text primary key, tenant_id text not null, company_id text, site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  sif_specification_id text not null references public.lopa_sif_specifications(id) on delete cascade,
  component_type text not null, tag text, name text, manufacturer text, model text,
  voting_group text, quantity integer, failure_data_reference text, proof_test_reference text,
  equipment_id text, document_id text, status text not null default 'Draft', notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.lopa_sif_architectures (
  id text primary key, tenant_id text not null, company_id text, site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  sif_specification_id text not null references public.lopa_sif_specifications(id) on delete cascade,
  architecture_type text, sensor_voting text, logic_solver_voting text, final_element_voting text,
  common_cause_consideration text, independence_basis text, diagnostic_coverage text,
  fault_tolerance text, justification text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.lopa_sif_proof_test_bypass (
  id text primary key, tenant_id text not null, company_id text, site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  sif_specification_id text not null references public.lopa_sif_specifications(id) on delete cascade,
  proof_test_interval text, proof_test_procedure text, proof_test_owner_id text, last_proof_test_at timestamptz,
  bypass_allowed boolean, bypass_procedure text, bypass_alarm_required boolean, bypass_max_duration text,
  maintenance_basis text, mi_record_id text, status text not null default 'Pending', notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.lopa_sil_iec61511_gaps (
  id text primary key, tenant_id text not null, company_id text, site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  sif_specification_id text references public.lopa_sif_specifications(id) on delete cascade,
  requirement_key text not null, requirement_title text not null, status text not null default 'Open',
  mandatory boolean not null default true, closure_blocker boolean not null default true,
  finding text, evidence_reference text, action_id text, accepted_exception boolean not null default false,
  exception_reason text, accepted_by text, accepted_at timestamptz, due_date timestamptz,
  created_by text, resolved_by text, resolved_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.lopa_sif_record_links (
  id text primary key, tenant_id text not null, company_id text, site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  sif_specification_id text references public.lopa_sif_specifications(id) on delete cascade,
  record_type text not null, record_id text, record_number text, record_title text, relationship_type text,
  required boolean not null default false, restricted boolean not null default false, status text not null default 'Linked',
  snapshot_json jsonb not null default '{}'::jsonb, created_by text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.lopa_sil_actions (
  id text primary key, tenant_id text not null, company_id text, site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  sil_determination_id text references public.lopa_sil_determinations(id) on delete cascade,
  gap_id text references public.lopa_sil_iec61511_gaps(id) on delete set null,
  action_id text, title text not null, status text not null default 'Open', closure_blocker boolean not null default true,
  created_by text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.lopa_sil_snapshots (
  id text primary key, tenant_id text not null, company_id text, site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  sil_determination_id text references public.lopa_sil_determinations(id) on delete set null,
  version_number integer not null, snapshot_type text not null default 'Determination', status text not null,
  snapshot_json jsonb not null default '{}'::jsonb, snapshot_hash text, locked boolean not null default false,
  created_by text, created_at timestamptz not null default now(), unique (tenant_id, lopa_study_id, version_number)
);

create table if not exists public.lopa_sil_reassessment_events (
  id text primary key, tenant_id text not null, company_id text, site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  sil_determination_id text references public.lopa_sil_determinations(id) on delete set null,
  trigger_type text not null, trigger_description text, status text not null default 'Open',
  created_by text, resolved_by text, resolved_at timestamptz, created_at timestamptz not null default now()
);

create index if not exists lopa_sil_determinations_study_idx on public.lopa_sil_determinations(tenant_id, lopa_study_id, status);
create index if not exists lopa_sif_specifications_study_idx on public.lopa_sif_specifications(tenant_id, lopa_study_id, status);
create index if not exists lopa_sil_gaps_study_idx on public.lopa_sil_iec61511_gaps(tenant_id, lopa_study_id, status, closure_blocker);
create index if not exists lopa_sil_actions_study_idx on public.lopa_sil_actions(tenant_id, lopa_study_id, status);

alter table public.lopa_sil_determinations enable row level security;
alter table public.lopa_sif_specifications enable row level security;
alter table public.lopa_sif_components enable row level security;
alter table public.lopa_sif_architectures enable row level security;
alter table public.lopa_sif_proof_test_bypass enable row level security;
alter table public.lopa_sil_iec61511_gaps enable row level security;
alter table public.lopa_sif_record_links enable row level security;
alter table public.lopa_sil_actions enable row level security;
alter table public.lopa_sil_snapshots enable row level security;
alter table public.lopa_sil_reassessment_events enable row level security;

grant select, insert, update, delete on public.lopa_sil_determinations, public.lopa_sif_specifications, public.lopa_sif_components, public.lopa_sif_architectures, public.lopa_sif_proof_test_bypass, public.lopa_sil_iec61511_gaps, public.lopa_sif_record_links, public.lopa_sil_actions, public.lopa_sil_snapshots, public.lopa_sil_reassessment_events to authenticated;

do $$
declare permission_key text; permission_keys text[] := array[
  'lopa.sil.view','lopa.sil.determine','lopa.sil.reassess','lopa.sil.edit','lopa.sil.override','lopa.sil.lock','lopa.sil.unlock','lopa.sil.snapshot.view','lopa.sil.snapshot.create','lopa.sif.view','lopa.sif.create','lopa.sif.edit','lopa.sif.delete','lopa.sif.mark_complete','lopa.sif.link_existing','lopa.sif.components.manage','lopa.sif.architecture.manage','lopa.sif.proof_test.manage','lopa.iec61511_gaps.view','lopa.iec61511_gaps.manage','lopa.iec61511_gaps.accept_exception','lopa.sil.links.manage','lopa.sil.actions.manage','lopa.sil.export','lopa.sil.history.view'
];
begin
  if to_regclass('public."Permission"') is not null then
    foreach permission_key in array permission_keys loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, t."id", permission_key, 'LOPA', permission_key from public."Tenant" t
      where not exists (select 1 from public."Permission" p where p."tenantId" = t."id" and p."key" = permission_key);
    end loop;
    if to_regclass('public."RolePermission"') is not null and to_regclass('public."Role"') is not null then
      insert into public."RolePermission" ("roleId", "permissionId")
      select r."id", p."id" from public."Role" r join public."Permission" p on p."tenantId" = r."tenantId"
      where p."key" = any(permission_keys) and lower(r."name") in ('super admin','company admin','site admin','hse manager','process safety lead','process safety engineer','plant manager')
      and not exists (select 1 from public."RolePermission" rp where rp."roleId"=r."id" and rp."permissionId"=p."id");
    end if;
  end if;
end $$;
