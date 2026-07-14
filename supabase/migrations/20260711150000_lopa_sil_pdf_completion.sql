-- Completes the PDF-defined SIL/SIF data surface. No SIL bands or IEC values are seeded;
-- methodology mappings remain company/site configuration and are interpreted by the backend.

alter table public.lopa_studies
  add column if not exists sil_status text not null default 'Not Started',
  add column if not exists sif_required boolean not null default false,
  add column if not exists sif_status text not null default 'Not Started',
  add column if not exists sil_readiness_status text not null default 'Not Ready';

create table if not exists public.lopa_sil_methodologies (
  id text primary key,
  tenant_id text not null,
  company_id text not null,
  site_id text,
  methodology_name text not null,
  methodology_version text not null,
  status text not null default 'Draft',
  active boolean not null default true,
  risk_matrix_reference text,
  lopa_method_reference text,
  sil_mapping_rules_reference text,
  iec_61511_reference text,
  functional_safety_policy_reference text,
  mapping_rules_json jsonb not null default '[]'::jsonb,
  assumption_notes text,
  limitations text,
  reviewer_required boolean not null default false,
  specialist_required_for_high_sil boolean not null default true,
  approval_required boolean not null default true,
  methodology_document_id text,
  approved_by text,
  approved_at timestamptz,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, company_id, site_id, methodology_name, methodology_version)
);

create table if not exists public.lopa_sil_iec61511_gap_templates (
  id text primary key, tenant_id text not null, company_id text not null, site_id text,
  gap_key text not null, gap_title text not null, gap_description text, required boolean not null default true,
  blocking boolean not null default true, active boolean not null default true, sort_order integer not null default 0,
  created_by text, updated_by text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(tenant_id,company_id,site_id,gap_key)
);

alter table public.lopa_sil_determinations
  add column if not exists determination_number text,
  add column if not exists determination_version integer not null default 1,
  add column if not exists methodology_id text references public.lopa_sil_methodologies(id) on delete set null,
  add column if not exists risk_calculation_version_id text,
  add column if not exists calculation_snapshot_json jsonb not null default '{}'::jsonb,
  add column if not exists dependency_hash text,
  add column if not exists risk_gap_exists boolean,
  add column if not exists risk_gap_ratio numeric,
  add column if not exists mitigated_frequency numeric,
  add column if not exists tolerable_frequency numeric,
  add column if not exists required_sil_band text,
  add column if not exists sil_determination_method text,
  add column if not exists consequence_category text,
  add column if not exists tolerable_frequency_basis text,
  add column if not exists risk_gap_basis text,
  add column if not exists manual_override boolean not null default false,
  add column if not exists override_approved_by text,
  add column if not exists override_approved_at timestamptz,
  add column if not exists specialist_review_required boolean not null default false,
  add column if not exists reviewer_required boolean not null default false,
  add column if not exists approval_required boolean not null default true,
  add column if not exists sif_requirement_status text,
  add column if not exists existing_sif_exists boolean not null default false,
  add column if not exists existing_sif_adequate boolean,
  add column if not exists existing_sif_tag text,
  add column if not exists existing_sif_name text,
  add column if not exists existing_sif_description text,
  add column if not exists existing_sis_system text,
  add column if not exists existing_sif_safety_function text,
  add column if not exists existing_sif_current_sil text,
  add column if not exists existing_sif_achieved_sil text,
  add column if not exists existing_sif_pfdavg numeric,
  add column if not exists existing_sif_rrf numeric,
  add column if not exists existing_sif_last_verification_at timestamptz,
  add column if not exists existing_sif_last_proof_test_at timestamptz,
  add column if not exists existing_sif_next_proof_test_due timestamptz,
  add column if not exists existing_sif_bypass_status text,
  add column if not exists existing_sif_maintenance_status text,
  add column if not exists existing_sif_adequacy_basis text,
  add column if not exists existing_sif_gaps text,
  add column if not exists new_sif_reason text,
  add column if not exists required_safety_function text,
  add column if not exists hazard_addressed text,
  add column if not exists consequence_addressed text,
  add column if not exists process_condition text,
  add column if not exists protected_equipment_system text,
  add column if not exists required_action text,
  add column if not exists required_safe_state text,
  add column if not exists required_response_time text,
  add column if not exists sif_owner_id text,
  add column if not exists functional_safety_engineer_id text,
  add column if not exists srs_required boolean not null default false,
  add column if not exists sil_verification_required boolean not null default false,
  add column if not exists proof_test_procedure_required boolean not null default false,
  add column if not exists moc_required boolean not null default false,
  add column if not exists pssr_required boolean not null default false,
  add column if not exists mi_required boolean not null default false,
  add column if not exists last_reassessment_status text,
  add column if not exists last_reassessed_by text,
  add column if not exists last_reassessed_at timestamptz,
  add column if not exists approved_by text,
  add column if not exists approved_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists notes text,
  add column if not exists assumptions text,
  add column if not exists limitations text;

alter table public.lopa_sif_specifications
  add column if not exists sif_number text,
  add column if not exists description text,
  add column if not exists sif_type text not null default 'New',
  add column if not exists hazardous_event_prevented text,
  add column if not exists consequence_mitigated text,
  add column if not exists process_demand_detected text,
  add column if not exists initiating_cause_addressed text,
  add column if not exists required_action text,
  add column if not exists trip_setpoint_units text,
  add column if not exists setpoint_basis text,
  add column if not exists reset_philosophy text,
  add column if not exists manual_reset_required boolean not null default false,
  add column if not exists response_time_required text,
  add column if not exists response_time_available text,
  add column if not exists required_rrf numeric,
  add column if not exists required_pfdavg numeric,
  add column if not exists expected_pfdavg numeric,
  add column if not exists design_owner_id text,
  add column if not exists operations_owner_id text,
  add column if not exists maintenance_owner_id text,
  add column if not exists functional_safety_specialist_id text,
  add column if not exists srs_required boolean not null default false,
  add column if not exists sil_verification_required boolean not null default false,
  add column if not exists validation_required boolean not null default false,
  add column if not exists proof_test_required boolean not null default true,
  add column if not exists moc_required boolean not null default false,
  add column if not exists pssr_required boolean not null default false,
  add column if not exists mi_required boolean not null default false,
  add column if not exists assumptions text,
  add column if not exists limitations text,
  add column if not exists deleted_by text,
  add column if not exists deleted_at timestamptz;

alter table public.lopa_sif_components
  add column if not exists component_tag text,
  add column if not exists component_name text,
  add column if not exists component_description text,
  add column if not exists process_variable text,
  add column if not exists range_text text,
  add column if not exists setpoint text,
  add column if not exists action_on_trip text,
  add column if not exists fail_position text,
  add column if not exists response_time text,
  add column if not exists diagnostics text,
  add column if not exists independence_notes text,
  add column if not exists proof_test_requirement text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists created_by text,
  add column if not exists updated_by text,
  add column if not exists deleted_at timestamptz;

alter table public.lopa_sif_architectures
  add column if not exists architecture_status text not null default 'Not Started',
  add column if not exists logic_solver_architecture text,
  add column if not exists overall_architecture text,
  add column if not exists redundancy_requirement text,
  add column if not exists diagnostic_coverage_assumption text,
  add column if not exists beta_factor numeric,
  add column if not exists spurious_trip_concern text,
  add column if not exists independence_from_bpcs text,
  add column if not exists independence_from_initiating_event text,
  add column if not exists independence_from_other_ipls text,
  add column if not exists architecture_notes text,
  add column if not exists architecture_document_id text,
  add column if not exists created_by text,
  add column if not exists updated_by text;

alter table public.lopa_sif_proof_test_bypass
  add column if not exists proof_test_required boolean not null default true,
  add column if not exists proof_test_procedure_document_id text,
  add column if not exists partial_stroke_test_required boolean not null default false,
  add column if not exists functional_test_required boolean not null default true,
  add column if not exists last_proof_test_date date,
  add column if not exists next_proof_test_due date,
  add column if not exists proof_test_coverage_assumption text,
  add column if not exists mi_program_id text,
  add column if not exists bypass_approval_required boolean not null default true,
  add column if not exists bypass_risk_assessment_required boolean not null default true,
  add column if not exists maximum_bypass_duration text,
  add column if not exists bypass_log_reference text,
  add column if not exists override_management_notes text,
  add column if not exists inspection_maintenance_owner_id text,
  add column if not exists created_by text,
  add column if not exists updated_by text;

alter table public.lopa_sil_iec61511_gaps
  add column if not exists sil_determination_id text references public.lopa_sil_determinations(id) on delete cascade,
  add column if not exists gap_key text,
  add column if not exists gap_title text,
  add column if not exists gap_description text,
  add column if not exists required boolean not null default true,
  add column if not exists owner_id text,
  add column if not exists exception_approved_by text,
  add column if not exists exception_approved_at timestamptz,
  add column if not exists notes text,
  add column if not exists updated_by text;
update public.lopa_sil_iec61511_gaps set gap_key=coalesce(gap_key,requirement_key),gap_title=coalesce(gap_title,requirement_title),gap_description=coalesce(gap_description,finding) where gap_key is null or gap_title is null;

alter table public.lopa_sif_record_links
  add column if not exists sil_determination_id text references public.lopa_sil_determinations(id) on delete cascade,
  add column if not exists linked_record_type text,
  add column if not exists linked_record_id text,
  add column if not exists linked_record_number text,
  add column if not exists linked_record_title text,
  add column if not exists source_module text,
  add column if not exists status_snapshot text,
  add column if not exists revision_snapshot text,
  add column if not exists linked_by text,
  add column if not exists linked_at timestamptz not null default now(),
  add column if not exists unlinked_by text,
  add column if not exists unlinked_at timestamptz,
  add column if not exists unlink_reason text;

alter table public.lopa_sil_actions
  add column if not exists sif_specification_id text references public.lopa_sif_specifications(id) on delete cascade,
  add column if not exists source_type text,
  add column if not exists source_record_id text,
  add column if not exists blocking boolean not null default true,
  add column if not exists linked_by text,
  add column if not exists linked_at timestamptz not null default now(),
  add column if not exists unlinked_by text,
  add column if not exists unlinked_at timestamptz,
  add column if not exists unlink_reason text;

alter table public.lopa_sil_snapshots
  add column if not exists snapshot_version integer,
  add column if not exists snapshot_status text,
  add column if not exists calculation_version_id text,
  add column if not exists target_sil text,
  add column if not exists sil_required boolean,
  add column if not exists required_rrf numeric,
  add column if not exists required_pfdavg numeric,
  add column if not exists sif_requirement_status text,
  add column if not exists locked_by text,
  add column if not exists locked_at timestamptz,
  add column if not exists superseded_by_snapshot_id text;
update public.lopa_sil_snapshots set snapshot_version=coalesce(snapshot_version,version_number),snapshot_status=coalesce(snapshot_status,status) where snapshot_version is null or snapshot_status is null;

alter table public.lopa_sil_reassessment_events
  add column if not exists source_module text,
  add column if not exists source_record_type text,
  add column if not exists source_record_id text,
  add column if not exists changed_item text,
  add column if not exists previous_value_json jsonb,
  add column if not exists current_value_json jsonb,
  add column if not exists change_severity text,
  add column if not exists impact_summary text,
  add column if not exists reassessment_required boolean not null default true,
  add column if not exists changed_by text,
  add column if not exists changed_at timestamptz not null default now();

create index if not exists lopa_sil_methodologies_scope_idx on public.lopa_sil_methodologies(tenant_id,company_id,site_id,status,active);
create index if not exists lopa_sif_components_type_idx on public.lopa_sif_components(tenant_id,lopa_study_id,sif_specification_id,component_type,deleted_at);
create index if not exists lopa_sif_links_active_idx on public.lopa_sif_record_links(tenant_id,lopa_study_id,unlinked_at,linked_record_type);
create index if not exists lopa_sil_reassessment_open_idx on public.lopa_sil_reassessment_events(tenant_id,lopa_study_id,status,reassessment_required,changed_at desc);
alter table public.lopa_sil_methodologies enable row level security;
alter table public.lopa_sil_iec61511_gap_templates enable row level security;
grant select,insert,update,delete on public.lopa_sil_methodologies,public.lopa_sil_iec61511_gap_templates to authenticated;

do $$
declare k text; keys text[] := array['lopa.sif.link_existing','lopa.iec61511_gaps.accept_exception'];
begin
  if to_regclass('public."Permission"') is not null then
    foreach k in array keys loop
      insert into public."Permission"("id","tenantId","key","moduleKey","label") select gen_random_uuid()::text,t."id",k,'LOPA',k from public."Tenant" t where not exists(select 1 from public."Permission" p where p."tenantId"=t."id" and p."key"=k);
    end loop;
    if to_regclass('public."RolePermission"') is not null and to_regclass('public."Role"') is not null then
      insert into public."RolePermission"("roleId","permissionId") select r."id",p."id" from public."Role" r join public."Permission" p on p."tenantId"=r."tenantId" where p."key"=any(keys) and lower(r."name") in ('super admin','company admin','site admin','hse manager','process safety lead','process safety engineer','plant manager') and not exists(select 1 from public."RolePermission" rp where rp."roleId"=r."id" and rp."permissionId"=p."id");
    end if;
  end if;
end $$;
