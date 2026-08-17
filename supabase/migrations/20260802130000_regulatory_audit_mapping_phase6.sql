alter table if exists public.regulatory_settings
  add column if not exists require_audit_mapping_for_psm_critical_obligation boolean default true,
  add column if not exists require_audit_mapping_for_safety_critical_obligation boolean default true,
  add column if not exists require_audit_mapping_for_environmental_critical_obligation boolean default false,
  add column if not exists require_owner_for_active_audit_mapping boolean default true,
  add column if not exists allow_manual_audit_mapping boolean default true,
  add column if not exists allow_historical_audit_mapping boolean default true,
  add column if not exists auto_create_gap_for_missing_audit_mapping boolean default true,
  add column if not exists auto_create_gap_for_missing_audit_evidence_mapping boolean default true,
  add column if not exists auto_create_gap_for_stale_audit_mapping boolean default true,
  add column if not exists auto_mark_audit_mapping_stale_on_regulatory_change boolean default true,
  add column if not exists auto_mark_audit_mapping_stale_on_audit_change boolean default true,
  add column if not exists auto_update_compliance_readiness_on_audit_mapping_change boolean default true,
  add column if not exists auto_notify_owner_on_audit_mapping_gap boolean default true,
  add column if not exists auto_notify_owner_on_stale_audit_mapping boolean default true;

create table if not exists public.regulatory_audit_mappings (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  unit_id text null,
  area_id text null,
  equipment_id text null,
  regulatory_source_type text not null,
  regulatory_item_id text null references public.regulatory_register_items(id) on delete set null,
  obligation_id text null references public.regulatory_obligations(id) on delete set null,
  compliance_assessment_id text null references public.regulatory_compliance_assessments(id) on delete set null,
  compliance_gap_id text null references public.regulatory_compliance_gaps(id) on delete set null,
  evidence_link_id text null references public.regulatory_evidence_links(id) on delete set null,
  evidence_package_id text null references public.regulatory_evidence_package_foundations(id) on delete set null,
  audit_target_type text not null,
  audit_program_id text null,
  audit_plan_id text null,
  audit_checklist_id text null,
  audit_checklist_section_id text null,
  audit_checklist_item_id text null,
  audit_execution_id text null,
  audit_execution_response_id text null,
  audit_field_finding_id text null,
  audit_finding_id text null,
  audit_capa_id text null,
  audit_capa_action_id text null,
  audit_evidence_id text null,
  audit_score_run_id text null,
  audit_score_component_id text null,
  audit_standards_mapping_id text null,
  audit_review_package_id text null,
  audit_report_id text null,
  mapping_code text null,
  mapping_title text not null,
  mapping_type text not null,
  mapping_source text null,
  mapping_rationale text not null,
  mapping_status text not null default 'Draft',
  coverage_status text not null default 'Not Mapped',
  verification_status text not null default 'Not Submitted',
  audit_readiness_status text not null default 'Not Ready For Audit',
  stale_status text not null default 'Current',
  stale_reason text null,
  coverage_score numeric null,
  audit_score numeric null,
  required_audit_checks jsonb not null default '[]'::jsonb,
  required_evidence jsonb not null default '[]'::jsonb,
  required_findings_review boolean not null default false,
  required_capa_closure boolean not null default false,
  required_score boolean not null default false,
  required_review boolean not null default false,
  owner_user_id text null,
  reviewer_user_id text null,
  due_date timestamptz null,
  reviewed_by text null,
  reviewed_at timestamptz null,
  review_comment text null,
  rejection_reason text null,
  manual_coverage_override boolean not null default false,
  override_reason text null,
  restricted_audit_evidence boolean not null default false,
  restricted_reason text null,
  source_snapshot_json jsonb null,
  audit_target_snapshot_json jsonb null,
  traceability_snapshot_json jsonb null,
  coverage_trace_json jsonb null,
  metadata_json jsonb not null default '{}'::jsonb,
  locked boolean not null default false,
  locked_at timestamptz null,
  locked_by text null,
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_audit_mapping_links (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  mapping_id text not null references public.regulatory_audit_mappings(id) on delete cascade,
  link_type text not null,
  source_object_type text not null,
  source_object_id text not null,
  target_object_type text not null,
  target_object_id text not null,
  link_status text not null default 'Active',
  link_rationale text null,
  source_snapshot_json jsonb null,
  target_snapshot_json jsonb null,
  created_by text null,
  created_at timestamptz not null default now(),
  removed_at timestamptz null,
  removed_by text null,
  remove_reason text null
);

create table if not exists public.regulatory_audit_coverage_records (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  regulatory_item_id text null references public.regulatory_register_items(id) on delete cascade,
  obligation_id text null references public.regulatory_obligations(id) on delete cascade,
  mapping_id text null references public.regulatory_audit_mappings(id) on delete set null,
  coverage_status text not null default 'Not Mapped',
  verification_status text not null default 'Not Submitted',
  audit_readiness_status text not null default 'Not Ready For Audit',
  mapped_count integer not null default 0,
  required_count integer not null default 0,
  verified_count integer not null default 0,
  gap_count integer not null default 0,
  stale_count integer not null default 0,
  coverage_score numeric null,
  coverage_trace_json jsonb null,
  calculated_at timestamptz not null default now(),
  calculated_by text null
);

create table if not exists public.regulatory_audit_traceability_snapshots (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  mapping_id text null references public.regulatory_audit_mappings(id) on delete cascade,
  regulatory_item_id text null references public.regulatory_register_items(id) on delete set null,
  obligation_id text null references public.regulatory_obligations(id) on delete set null,
  snapshot_title text not null,
  snapshot_status text not null default 'Current',
  traceability_json jsonb not null default '{}'::jsonb,
  snapshot_hash text null,
  created_by text null,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_audit_mapping_gaps (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  regulatory_item_id text null references public.regulatory_register_items(id) on delete set null,
  obligation_id text null references public.regulatory_obligations(id) on delete set null,
  compliance_assessment_id text null references public.regulatory_compliance_assessments(id) on delete set null,
  compliance_gap_id text null references public.regulatory_compliance_gaps(id) on delete set null,
  mapping_id text null references public.regulatory_audit_mappings(id) on delete set null,
  audit_target_type text null,
  audit_target_id text null,
  gap_code text null,
  gap_type text not null,
  gap_title text not null,
  gap_description text null,
  gap_status text not null default 'Open',
  gap_severity text not null default 'Medium',
  recommended_fix text null,
  owner_user_id text null,
  due_date timestamptz null,
  action_foundation_id text null,
  resolved_by text null,
  resolved_at timestamptz null,
  resolution_notes text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_audit_mapping_reviews (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  mapping_id text not null references public.regulatory_audit_mappings(id) on delete cascade,
  review_status text not null,
  review_decision text null,
  reviewer_user_id text null,
  review_comment text null,
  rejection_reason text null,
  requested_by text null,
  requested_at timestamptz null,
  completed_by text null,
  completed_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_audit_mapping_staleness_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  mapping_id text references public.regulatory_audit_mappings(id) on delete cascade,
  stale_trigger_type text not null,
  source_module text null,
  source_record_id text null,
  stale_reason text not null,
  created_by text null,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_audit_mapping_history_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  regulatory_item_id text null,
  obligation_id text null,
  mapping_id text null,
  audit_target_type text null,
  audit_target_id text null,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text null,
  source_module text not null default 'Regulatory Audit Mapping',
  source_record_id text null,
  audit_log_id text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_reg_audit_mappings_company_site_status on public.regulatory_audit_mappings(company_id, site_id, mapping_status);
create index if not exists idx_reg_audit_mappings_company_site_coverage on public.regulatory_audit_mappings(company_id, site_id, coverage_status);
create index if not exists idx_reg_audit_mappings_company_site_verification on public.regulatory_audit_mappings(company_id, site_id, verification_status);
create index if not exists idx_reg_audit_mappings_reg_item on public.regulatory_audit_mappings(regulatory_item_id);
create index if not exists idx_reg_audit_mappings_obligation on public.regulatory_audit_mappings(obligation_id);
create index if not exists idx_reg_audit_mappings_program on public.regulatory_audit_mappings(audit_program_id);
create index if not exists idx_reg_audit_mappings_plan on public.regulatory_audit_mappings(audit_plan_id);
create index if not exists idx_reg_audit_mappings_checklist on public.regulatory_audit_mappings(audit_checklist_id);
create index if not exists idx_reg_audit_mappings_finding on public.regulatory_audit_mappings(audit_finding_id);
create index if not exists idx_reg_audit_mappings_capa on public.regulatory_audit_mappings(audit_capa_id);
create index if not exists idx_reg_audit_mappings_evidence on public.regulatory_audit_mappings(audit_evidence_id);
create index if not exists idx_reg_audit_mappings_score_run on public.regulatory_audit_mappings(audit_score_run_id);
create index if not exists idx_reg_audit_mapping_links_mapping_type on public.regulatory_audit_mapping_links(mapping_id, link_type);
create index if not exists idx_reg_audit_coverage_item on public.regulatory_audit_coverage_records(regulatory_item_id);
create index if not exists idx_reg_audit_coverage_obligation on public.regulatory_audit_coverage_records(obligation_id);
create index if not exists idx_reg_audit_traceability_mapping_created on public.regulatory_audit_traceability_snapshots(mapping_id, created_at desc);
create index if not exists idx_reg_audit_mapping_gaps_status on public.regulatory_audit_mapping_gaps(company_id, site_id, gap_status);
create index if not exists idx_reg_audit_mapping_history_mapping_created on public.regulatory_audit_mapping_history_events(mapping_id, created_at desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'regulatory_audit_mappings',
    'regulatory_audit_mapping_links',
    'regulatory_audit_coverage_records',
    'regulatory_audit_traceability_snapshots',
    'regulatory_audit_mapping_gaps',
    'regulatory_audit_mapping_reviews',
    'regulatory_audit_mapping_staleness_events',
    'regulatory_audit_mapping_history_events'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = table_name and policyname = table_name || '_tenant_site_select'
    ) then
      execute format('create policy %I on public.%I for select to authenticated using (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_tenant_site_select', table_name);
    end if;
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = table_name and policyname = table_name || '_tenant_site_insert'
    ) then
      execute format('create policy %I on public.%I for insert to authenticated with check (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_tenant_site_insert', table_name);
    end if;
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = table_name and policyname = table_name || '_tenant_site_update'
    ) then
      execute format('create policy %I on public.%I for update to authenticated using (public.regulatory_company_site_visible(company_id, site_id)) with check (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_tenant_site_update', table_name);
    end if;
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = table_name and policyname = table_name || '_tenant_site_delete'
    ) then
      execute format('create policy %I on public.%I for delete to authenticated using (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_tenant_site_delete', table_name);
    end if;
  end loop;
end $$;

do $$
declare
  permission_key text;
  permission_label text;
  tenant_row record;
begin
  foreach permission_key, permission_label in array array[
    array['regulatory.audit_mapping.view', 'View regulatory audit mapping'],
    array['regulatory.audit_mapping.dashboard.view', 'View regulatory audit mapping dashboard'],
    array['regulatory.audit_mapping.register.view', 'View regulatory audit mapping register'],
    array['regulatory.audit_mapping.matrix.view', 'View regulatory audit mapping matrix'],
    array['regulatory.audit_mapping.traceability.view', 'View regulatory audit mapping traceability'],
    array['regulatory.audit_mapping.create', 'Create regulatory audit mapping'],
    array['regulatory.audit_mapping.edit', 'Edit regulatory audit mapping'],
    array['regulatory.audit_mapping.archive', 'Archive regulatory audit mapping'],
    array['regulatory.audit_mapping.verify', 'Verify regulatory audit mapping'],
    array['regulatory.audit_mapping.reject', 'Reject regulatory audit mapping'],
    array['regulatory.audit_mapping.recalculate', 'Recalculate regulatory audit mapping coverage'],
    array['regulatory.audit_mapping.mark_stale', 'Mark regulatory audit mapping stale'],
    array['regulatory.audit_mapping.refresh_snapshot', 'Refresh regulatory audit mapping snapshot'],
    array['regulatory.audit_mapping.link_audit_program', 'Link regulatory mapping to audit program'],
    array['regulatory.audit_mapping.link_audit_plan', 'Link regulatory mapping to audit plan'],
    array['regulatory.audit_mapping.link_checklist', 'Link regulatory mapping to audit checklist'],
    array['regulatory.audit_mapping.link_execution', 'Link regulatory mapping to audit execution'],
    array['regulatory.audit_mapping.link_finding', 'Link regulatory mapping to audit finding'],
    array['regulatory.audit_mapping.link_capa', 'Link regulatory mapping to audit CAPA'],
    array['regulatory.audit_mapping.link_evidence', 'Link regulatory mapping to audit evidence'],
    array['regulatory.audit_mapping.link_score', 'Link regulatory mapping to audit score'],
    array['regulatory.audit_mapping.coverage.view', 'View regulatory audit mapping coverage'],
    array['regulatory.audit_mapping.coverage.recalculate', 'Recalculate regulatory audit coverage'],
    array['regulatory.audit_mapping.gap.view', 'View regulatory audit mapping gaps'],
    array['regulatory.audit_mapping.gap.create', 'Create regulatory audit mapping gaps'],
    array['regulatory.audit_mapping.gap.edit', 'Edit regulatory audit mapping gaps'],
    array['regulatory.audit_mapping.gap.resolve', 'Resolve regulatory audit mapping gaps'],
    array['regulatory.audit_mapping.gap.create_action_foundation', 'Create action foundation for regulatory audit mapping gap'],
    array['regulatory.audit_mapping.review.view', 'View regulatory audit mapping review'],
    array['regulatory.audit_mapping.review.submit', 'Submit regulatory audit mapping review'],
    array['regulatory.audit_mapping.history.view', 'View regulatory audit mapping history'],
    array['regulatory.audit_mapping.settings.edit', 'Edit regulatory audit mapping settings']
  ]
  loop
    for tenant_row in select id from public."Tenant" loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_key, 'Regulatory', permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_row.id and "key" = permission_key
      );
    end loop;
  end loop;
end $$;
