alter table public.regulatory_settings
  add column if not exists require_rationale_for_compliant_status boolean not null default true,
  add column if not exists require_gap_for_partially_compliant_status boolean not null default true,
  add column if not exists require_gap_or_action_for_non_compliant_status boolean not null default true,
  add column if not exists require_evidence_readiness_for_compliant_status boolean not null default false,
  add column if not exists require_review_for_critical_compliance_status boolean not null default true,
  add column if not exists require_review_for_manual_compliance_declaration boolean not null default true,
  add column if not exists allow_manual_compliance_declaration boolean not null default true,
  add column if not exists manual_declaration_expiry_days integer,
  add column if not exists auto_create_gap_for_non_compliance boolean not null default true,
  add column if not exists auto_create_gap_for_evidence_missing boolean not null default true,
  add column if not exists auto_create_action_foundation_for_critical_gap boolean not null default false,
  add column if not exists auto_rollup_obligation_status_to_parent boolean not null default true,
  add column if not exists rollup_non_compliance_overrides_all boolean not null default true,
  add column if not exists auto_mark_compliance_stale_on_source_change boolean not null default true,
  add column if not exists auto_notify_owner_on_non_compliance boolean not null default true,
  add column if not exists auto_notify_owner_on_evidence_missing boolean not null default true,
  add column if not exists auto_notify_owner_on_gap_overdue boolean not null default true,
  add column if not exists compliance_review_due_soon_days integer not null default 30;

create table if not exists public.regulatory_compliance_assessments (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  department_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  regulatory_item_id text references public.regulatory_register_items(id) on delete cascade,
  obligation_id text references public.regulatory_obligations(id) on delete cascade,
  jurisdiction_id text references public.regulatory_jurisdictions(id),
  authority_id text references public.regulatory_authorities(id),
  assessment_number text not null,
  assessment_title text not null,
  source_type text not null default 'Regulatory Item',
  source_record_id text,
  source_title text,
  source_snapshot_json jsonb,
  assessment_status text not null default 'Draft',
  compliance_status text not null default 'Not Assessed',
  previous_compliance_status text,
  gap_status text not null default 'Not Assessed',
  evidence_readiness_status text not null default 'Not Assessed',
  criteria_status text not null default 'Not Checked',
  stale_status text not null default 'Current',
  stale_reason text,
  stale_at timestamptz,
  applicability_status_snapshot text,
  criticality text,
  category text,
  related_psm_element text,
  owner_user_id text,
  assessor_user_id text,
  reviewer_user_id text,
  review_required boolean not null default false,
  review_status text not null default 'Not Required',
  manual_declaration boolean not null default false,
  manual_declaration_reason text,
  manual_declaration_expires_at timestamptz,
  status_rationale text,
  decision_basis text,
  criteria_summary_json jsonb,
  evidence_summary_json jsonb,
  gap_summary_json jsonb,
  action_summary_json jsonb,
  readiness_json jsonb,
  blockers_json jsonb,
  next_review_date timestamptz,
  last_assessed_at timestamptz,
  completed_at timestamptz,
  completed_by text,
  submitted_for_review_at timestamptz,
  submitted_for_review_by text,
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint regulatory_compliance_assessment_number_unique unique(company_id, assessment_number),
  constraint regulatory_compliance_assessment_source_required check (regulatory_item_id is not null or obligation_id is not null or source_record_id is not null)
);

create table if not exists public.regulatory_compliance_criteria (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  assessment_id text not null references public.regulatory_compliance_assessments(id) on delete cascade,
  regulatory_item_id text references public.regulatory_register_items(id) on delete cascade,
  obligation_id text references public.regulatory_obligations(id) on delete cascade,
  criterion_number integer not null default 1,
  criterion_title text not null,
  criterion_description text,
  expected_condition text,
  evaluation_method text,
  result_status text not null default 'Not Checked',
  rationale text,
  evidence_required boolean not null default false,
  evidence_reference text,
  blocking boolean not null default false,
  owner_user_id text,
  due_date timestamptz,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_compliance_evidence_readiness (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  assessment_id text not null references public.regulatory_compliance_assessments(id) on delete cascade,
  regulatory_item_id text references public.regulatory_register_items(id) on delete cascade,
  obligation_id text references public.regulatory_obligations(id) on delete cascade,
  expectation_source text,
  evidence_type text,
  evidence_description text,
  required boolean not null default false,
  linked_record_id text,
  linked_record_type text,
  linked_module text,
  document_control_id text,
  readiness_status text not null default 'Not Assessed',
  missing_reason text,
  restricted boolean not null default false,
  checked_at timestamptz,
  checked_by text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_compliance_gaps (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  department_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  assessment_id text references public.regulatory_compliance_assessments(id) on delete cascade,
  regulatory_item_id text references public.regulatory_register_items(id) on delete cascade,
  obligation_id text references public.regulatory_obligations(id) on delete cascade,
  jurisdiction_id text references public.regulatory_jurisdictions(id),
  gap_number text not null,
  gap_type text not null,
  gap_title text not null,
  gap_description text,
  gap_status text not null default 'Open',
  severity text not null default 'Medium',
  criticality text,
  impact_type text,
  owner_user_id text,
  due_date timestamptz,
  recommended_fix text,
  action_required boolean not null default false,
  action_id text,
  capa_required boolean not null default false,
  capa_id text,
  evidence_required boolean not null default false,
  evidence_reference text,
  review_required boolean not null default false,
  notes text,
  detected_at timestamptz not null default now(),
  detected_by text,
  resolved_by text,
  resolved_at timestamptz,
  resolution_note text,
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint regulatory_compliance_gap_number_unique unique(company_id, gap_number)
);

create table if not exists public.regulatory_compliance_gap_links (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  gap_id text not null references public.regulatory_compliance_gaps(id) on delete cascade,
  linked_module text not null,
  linked_record_type text not null,
  linked_record_id text not null,
  link_role text not null default 'Gap Foundation Link',
  link_status text not null default 'Active',
  source_snapshot_json jsonb,
  linked_by text,
  linked_at timestamptz not null default now(),
  removed_by text,
  removed_at timestamptz,
  remove_reason text
);

create table if not exists public.regulatory_compliance_status_rollups (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  regulatory_item_id text not null references public.regulatory_register_items(id) on delete cascade,
  rollup_status text not null default 'Not Assessed',
  obligation_count integer not null default 0,
  compliant_count integer not null default 0,
  partial_count integer not null default 0,
  non_compliant_count integer not null default 0,
  evidence_missing_count integer not null default 0,
  action_required_count integer not null default 0,
  capa_open_count integer not null default 0,
  not_applicable_count integer not null default 0,
  stale_count integer not null default 0,
  open_gap_count integer not null default 0,
  blocking_gap_count integer not null default 0,
  calculated_at timestamptz not null default now(),
  calculated_by text,
  calculation_basis_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint regulatory_compliance_rollup_item_unique unique(company_id, regulatory_item_id)
);

create table if not exists public.regulatory_compliance_status_history (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  assessment_id text references public.regulatory_compliance_assessments(id) on delete cascade,
  regulatory_item_id text references public.regulatory_register_items(id) on delete cascade,
  obligation_id text references public.regulatory_obligations(id) on delete cascade,
  source_type text,
  old_status text,
  new_status text not null,
  status_reason text,
  manual_declaration boolean not null default false,
  changed_by text,
  changed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_compliance_staleness_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  assessment_id text references public.regulatory_compliance_assessments(id) on delete cascade,
  regulatory_item_id text references public.regulatory_register_items(id) on delete cascade,
  obligation_id text references public.regulatory_obligations(id) on delete cascade,
  stale_trigger_type text not null,
  source_module text not null,
  source_record_id text,
  stale_reason text not null,
  detected_at timestamptz not null default now(),
  resolved_by text,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_compliance_history_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  assessment_id text references public.regulatory_compliance_assessments(id) on delete set null,
  gap_id text references public.regulatory_compliance_gaps(id) on delete set null,
  regulatory_item_id text references public.regulatory_register_items(id) on delete set null,
  obligation_id text references public.regulatory_obligations(id) on delete set null,
  event_type text not null,
  event_title text not null,
  event_description text,
  before_value_json jsonb,
  after_value_json jsonb,
  metadata_json jsonb,
  actor_user_id text,
  source_module text not null default 'Regulatory Compliance Status',
  source_record_id text,
  audit_log_id text,
  correlation_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_reg_compliance_assess_company_site_status on public.regulatory_compliance_assessments(company_id, site_id, assessment_status, compliance_status);
create index if not exists idx_reg_compliance_assess_source on public.regulatory_compliance_assessments(company_id, source_type, source_record_id);
create index if not exists idx_reg_compliance_assess_item_obligation on public.regulatory_compliance_assessments(company_id, regulatory_item_id, obligation_id);
create index if not exists idx_reg_compliance_assess_owner_review on public.regulatory_compliance_assessments(company_id, owner_user_id, assessor_user_id, reviewer_user_id, next_review_date);
create index if not exists idx_reg_compliance_criteria_assessment on public.regulatory_compliance_criteria(company_id, assessment_id, result_status);
create index if not exists idx_reg_compliance_evidence_assessment on public.regulatory_compliance_evidence_readiness(company_id, assessment_id, readiness_status);
create index if not exists idx_reg_compliance_gaps_status on public.regulatory_compliance_gaps(company_id, site_id, gap_status, severity, due_date);
create index if not exists idx_reg_compliance_gaps_source on public.regulatory_compliance_gaps(company_id, assessment_id, regulatory_item_id, obligation_id);
create index if not exists idx_reg_compliance_gap_links_gap on public.regulatory_compliance_gap_links(company_id, gap_id, linked_module);
create index if not exists idx_reg_compliance_rollups_item on public.regulatory_compliance_status_rollups(company_id, regulatory_item_id, rollup_status);
create index if not exists idx_reg_compliance_status_history_source on public.regulatory_compliance_status_history(company_id, regulatory_item_id, obligation_id, changed_at desc);
create index if not exists idx_reg_compliance_stale_source on public.regulatory_compliance_staleness_events(company_id, regulatory_item_id, obligation_id, detected_at desc);
create index if not exists idx_reg_compliance_history_source on public.regulatory_compliance_history_events(company_id, assessment_id, gap_id, regulatory_item_id, obligation_id, created_at desc);

alter table public.regulatory_compliance_assessments enable row level security;
alter table public.regulatory_compliance_criteria enable row level security;
alter table public.regulatory_compliance_evidence_readiness enable row level security;
alter table public.regulatory_compliance_gaps enable row level security;
alter table public.regulatory_compliance_gap_links enable row level security;
alter table public.regulatory_compliance_status_rollups enable row level security;
alter table public.regulatory_compliance_status_history enable row level security;
alter table public.regulatory_compliance_staleness_events enable row level security;
alter table public.regulatory_compliance_history_events enable row level security;

grant select, insert, update, delete on table
  public.regulatory_compliance_assessments,
  public.regulatory_compliance_criteria,
  public.regulatory_compliance_evidence_readiness,
  public.regulatory_compliance_gaps,
  public.regulatory_compliance_gap_links,
  public.regulatory_compliance_status_rollups,
  public.regulatory_compliance_status_history,
  public.regulatory_compliance_staleness_events,
  public.regulatory_compliance_history_events
to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'regulatory_compliance_assessments',
    'regulatory_compliance_criteria',
    'regulatory_compliance_evidence_readiness',
    'regulatory_compliance_gaps',
    'regulatory_compliance_gap_links',
    'regulatory_compliance_status_rollups',
    'regulatory_compliance_status_history',
    'regulatory_compliance_staleness_events',
    'regulatory_compliance_history_events'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_site_select', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_site_insert', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_site_update', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_site_delete', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_tenant_site_select', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_tenant_site_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (public.regulatory_company_site_visible(company_id, site_id)) with check (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_tenant_site_update', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_tenant_site_delete', table_name);
  end loop;
end $$;

do $$
declare
  tenant_row record;
  permission_pair text[];
  permission_label text;
  permissions text[][] := array[
    array['regulatory.compliance.view', 'Regulatory compliance status view'],
    array['regulatory.compliance.dashboard.view', 'Regulatory compliance dashboard view'],
    array['regulatory.compliance.register.view', 'Regulatory compliance register view'],
    array['regulatory.compliance.matrix.view', 'Regulatory compliance matrix view'],
    array['regulatory.compliance.assessment.view', 'Regulatory compliance assessment view'],
    array['regulatory.compliance.assessment.create', 'Regulatory compliance assessment create'],
    array['regulatory.compliance.assessment.edit', 'Regulatory compliance assessment edit'],
    array['regulatory.compliance.assessment.complete', 'Regulatory compliance assessment complete'],
    array['regulatory.compliance.assessment.archive', 'Regulatory compliance assessment archive'],
    array['regulatory.compliance.status.change', 'Regulatory compliance status change'],
    array['regulatory.compliance.status.manual_declare', 'Regulatory compliance status manual declaration'],
    array['regulatory.compliance.status.override', 'Regulatory compliance status override'],
    array['regulatory.compliance.rollup.view', 'Regulatory compliance rollup view'],
    array['regulatory.compliance.rollup.recalculate', 'Regulatory compliance rollup recalculate'],
    array['regulatory.compliance.evidence_readiness.view', 'Regulatory compliance evidence readiness view'],
    array['regulatory.compliance.evidence_readiness.manage', 'Regulatory compliance evidence readiness manage'],
    array['regulatory.compliance.criteria.view', 'Regulatory compliance criteria view'],
    array['regulatory.compliance.criteria.manage', 'Regulatory compliance criteria manage'],
    array['regulatory.compliance.gap.view', 'Regulatory compliance gap view'],
    array['regulatory.compliance.gap.create', 'Regulatory compliance gap create'],
    array['regulatory.compliance.gap.edit', 'Regulatory compliance gap edit'],
    array['regulatory.compliance.gap.resolve', 'Regulatory compliance gap resolve'],
    array['regulatory.compliance.gap.archive', 'Regulatory compliance gap archive'],
    array['regulatory.compliance.gap.create_action_foundation', 'Regulatory compliance gap create action foundation'],
    array['regulatory.compliance.stale.view', 'Regulatory compliance stale view'],
    array['regulatory.compliance.stale.reassess', 'Regulatory compliance stale reassess'],
    array['regulatory.compliance.history.view', 'Regulatory compliance history view'],
    array['regulatory.compliance.settings.edit', 'Regulatory compliance settings edit']
  ];
begin
  for tenant_row in select id from public."Tenant" loop
    foreach permission_pair slice 1 in array permissions loop
      permission_label := permission_pair[2];
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_pair[1], 'Regulatory', permission_label
      where not exists (
        select 1
        from public."Permission"
        where "tenantId" = tenant_row.id and "key" = permission_pair[1]
      );
    end loop;
  end loop;
end $$;
