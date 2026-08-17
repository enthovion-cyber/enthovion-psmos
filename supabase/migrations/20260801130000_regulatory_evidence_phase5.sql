alter table public.regulatory_settings
  add column if not exists require_evidence_for_compliant_status boolean not null default false,
  add column if not exists require_review_for_critical_evidence boolean not null default true,
  add column if not exists require_reviewer_for_restricted_evidence boolean not null default true,
  add column if not exists allow_manual_external_evidence_reference boolean not null default true,
  add column if not exists allow_evidence_placeholder_foundation boolean not null default false,
  add column if not exists exclude_restricted_evidence_from_packages_by_default boolean not null default true,
  add column if not exists allow_restricted_evidence_package_include boolean not null default false,
  add column if not exists require_reason_for_restricted_evidence boolean not null default true,
  add column if not exists require_reason_for_evidence_rejection boolean not null default true,
  add column if not exists require_reason_for_evidence_waiver boolean not null default true,
  add column if not exists auto_create_gap_for_missing_evidence boolean not null default true,
  add column if not exists auto_create_gap_for_rejected_evidence boolean not null default true,
  add column if not exists auto_create_gap_for_expired_evidence boolean not null default true,
  add column if not exists auto_create_gap_for_stale_evidence boolean not null default true,
  add column if not exists auto_mark_evidence_stale_on_source_change boolean not null default true,
  add column if not exists auto_update_compliance_readiness_on_evidence_change boolean not null default true,
  add column if not exists auto_notify_owner_on_evidence_missing boolean not null default true,
  add column if not exists auto_notify_owner_on_evidence_rejected boolean not null default true,
  add column if not exists auto_notify_reviewer_on_evidence_submitted boolean not null default true,
  add column if not exists evidence_due_soon_days integer not null default 30,
  add column if not exists evidence_expiry_warning_days integer not null default 60;

create table if not exists public.regulatory_evidence_requirements (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  department_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  requirement_code text,
  requirement_title text not null,
  source_type text not null,
  regulatory_item_id text references public.regulatory_register_items(id) on delete cascade,
  obligation_id text references public.regulatory_obligations(id) on delete cascade,
  compliance_assessment_id text references public.regulatory_compliance_assessments(id) on delete set null,
  compliance_gap_id text references public.regulatory_compliance_gaps(id) on delete set null,
  applicability_assessment_id text references public.regulatory_applicability_assessments(id) on delete set null,
  evidence_type_expected text,
  evidence_description text,
  evidence_frequency text,
  evidence_owner_user_id text,
  reviewer_user_id text,
  due_date timestamptz,
  recurrence_rule_json jsonb,
  required_document_type text,
  required_record_type text,
  evidence_source_module text,
  acceptance_criteria_foundation text,
  retention_requirement_foundation text,
  confidentiality_level text,
  restricted_by_default boolean not null default false,
  requirement_status text not null default 'Draft',
  criticality text,
  notes text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  constraint regulatory_evidence_requirement_code_unique unique(company_id, requirement_code),
  constraint regulatory_evidence_requirement_source_required check (
    regulatory_item_id is not null or obligation_id is not null or compliance_assessment_id is not null or
    compliance_gap_id is not null or applicability_assessment_id is not null or source_type = 'Manual Requirement'
  )
);

create table if not exists public.regulatory_evidence_links (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  department_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  evidence_code text,
  evidence_title text not null,
  evidence_type text not null,
  evidence_status text not null default 'Draft',
  review_status text not null default 'Not Submitted',
  readiness_status text not null default 'Evidence Missing',
  stale_status text not null default 'Current',
  stale_reason text,
  source_type text not null,
  regulatory_item_id text references public.regulatory_register_items(id) on delete cascade,
  obligation_id text references public.regulatory_obligations(id) on delete cascade,
  evidence_requirement_id text references public.regulatory_evidence_requirements(id) on delete set null,
  compliance_assessment_id text references public.regulatory_compliance_assessments(id) on delete set null,
  compliance_gap_id text references public.regulatory_compliance_gaps(id) on delete set null,
  applicability_assessment_id text references public.regulatory_applicability_assessments(id) on delete set null,
  source_module text not null,
  source_object_type text,
  source_record_id text,
  source_snapshot_json jsonb,
  document_id text,
  document_version text,
  storage_file_id text,
  audit_evidence_id text,
  external_reference_url text,
  external_reference_description text,
  version text,
  effective_date timestamptz,
  expiry_date timestamptz,
  review_date timestamptz,
  confidentiality_level text,
  restricted boolean not null default false,
  restricted_reason text,
  personal_data_flag_foundation boolean not null default false,
  legal_sensitive_flag_foundation boolean not null default false,
  duplicate_check_hash text,
  file_hash text,
  file_size_bytes bigint,
  linked_by text,
  reviewed_by text,
  reviewed_at timestamptz,
  review_comment text,
  rejection_reason text,
  rework_instructions text,
  verified_by text,
  verified_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  constraint regulatory_evidence_link_code_unique unique(company_id, evidence_code),
  constraint regulatory_evidence_link_reference_required check (
    document_id is not null or storage_file_id is not null or audit_evidence_id is not null or
    source_record_id is not null or external_reference_url is not null or evidence_status = 'Draft'
  )
);

create table if not exists public.regulatory_evidence_reviews (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  evidence_link_id text not null references public.regulatory_evidence_links(id) on delete cascade,
  review_decision text not null,
  review_status text not null,
  review_comment text,
  verification_basis_foundation text,
  rejection_reason text,
  rework_instructions text,
  reviewer_user_id text,
  reviewed_at timestamptz not null default now(),
  next_review_date timestamptz,
  e_signature_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_evidence_requests (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  request_code text,
  request_title text not null,
  source_type text not null,
  regulatory_item_id text references public.regulatory_register_items(id) on delete cascade,
  obligation_id text references public.regulatory_obligations(id) on delete cascade,
  evidence_requirement_id text references public.regulatory_evidence_requirements(id) on delete set null,
  compliance_assessment_id text references public.regulatory_compliance_assessments(id) on delete set null,
  compliance_gap_id text references public.regulatory_compliance_gaps(id) on delete set null,
  request_status text not null default 'Open',
  requested_from_user_id text,
  requested_by text,
  requested_at timestamptz not null default now(),
  due_date timestamptz,
  priority text,
  request_message text,
  response_note text,
  fulfilled_evidence_link_id text references public.regulatory_evidence_links(id) on delete set null,
  fulfilled_by text,
  fulfilled_at timestamptz,
  cancelled_by text,
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint regulatory_evidence_request_code_unique unique(company_id, request_code)
);

create table if not exists public.regulatory_evidence_gaps (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  gap_code text,
  gap_title text not null,
  gap_type text not null,
  gap_description text,
  regulatory_item_id text references public.regulatory_register_items(id) on delete cascade,
  obligation_id text references public.regulatory_obligations(id) on delete cascade,
  evidence_requirement_id text references public.regulatory_evidence_requirements(id) on delete set null,
  evidence_link_id text references public.regulatory_evidence_links(id) on delete set null,
  compliance_assessment_id text references public.regulatory_compliance_assessments(id) on delete set null,
  compliance_gap_id text references public.regulatory_compliance_gaps(id) on delete set null,
  gap_status text not null default 'Open',
  gap_severity text not null default 'Medium',
  criticality text,
  owner_user_id text,
  due_date timestamptz,
  recommended_fix text,
  action_id text,
  waiver_reason text,
  detected_by text,
  detected_at timestamptz not null default now(),
  resolved_by text,
  resolved_at timestamptz,
  resolution_note text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  constraint regulatory_evidence_gap_code_unique unique(company_id, gap_code)
);

create table if not exists public.regulatory_evidence_chain_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  evidence_link_id text references public.regulatory_evidence_links(id) on delete set null,
  evidence_requirement_id text references public.regulatory_evidence_requirements(id) on delete set null,
  package_id text,
  event_type text not null,
  event_title text not null,
  event_description text,
  actor_user_id text,
  source_module text not null default 'Regulatory Evidence',
  source_record_id text,
  before_value_json jsonb,
  after_value_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_evidence_access_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  evidence_link_id text not null references public.regulatory_evidence_links(id) on delete cascade,
  access_type text not null,
  access_status text not null,
  accessed_by text,
  accessed_at timestamptz not null default now(),
  denied_reason text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.regulatory_evidence_package_foundations (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  package_code text,
  package_title text not null,
  package_type text not null,
  package_status text not null default 'Draft',
  scope_json jsonb,
  manifest_json jsonb,
  included_regulatory_item_count integer not null default 0,
  included_obligation_count integer not null default 0,
  included_evidence_count integer not null default 0,
  excluded_evidence_count integer not null default 0,
  restricted_evidence_count integer not null default 0,
  owner_user_id text,
  prepared_by text,
  prepared_at timestamptz,
  stale_status text,
  stale_reason text,
  notes text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  constraint regulatory_evidence_package_code_unique unique(company_id, package_code)
);

create table if not exists public.regulatory_evidence_package_items (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  package_id text not null references public.regulatory_evidence_package_foundations(id) on delete cascade,
  evidence_link_id text references public.regulatory_evidence_links(id) on delete set null,
  evidence_requirement_id text references public.regulatory_evidence_requirements(id) on delete set null,
  regulatory_item_id text references public.regulatory_register_items(id) on delete set null,
  obligation_id text references public.regulatory_obligations(id) on delete set null,
  included boolean not null default true,
  restricted boolean not null default false,
  excluded_reason text,
  added_by text,
  added_at timestamptz not null default now(),
  removed_by text,
  removed_at timestamptz,
  remove_reason text
);

create table if not exists public.regulatory_evidence_staleness_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  evidence_link_id text references public.regulatory_evidence_links(id) on delete set null,
  evidence_requirement_id text references public.regulatory_evidence_requirements(id) on delete set null,
  package_id text references public.regulatory_evidence_package_foundations(id) on delete set null,
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

create table if not exists public.regulatory_evidence_history_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  unit_id text,
  area_id text,
  equipment_id text,
  regulatory_item_id text references public.regulatory_register_items(id) on delete set null,
  obligation_id text references public.regulatory_obligations(id) on delete set null,
  evidence_requirement_id text references public.regulatory_evidence_requirements(id) on delete set null,
  evidence_link_id text references public.regulatory_evidence_links(id) on delete set null,
  evidence_request_id text references public.regulatory_evidence_requests(id) on delete set null,
  package_id text references public.regulatory_evidence_package_foundations(id) on delete set null,
  gap_id text references public.regulatory_evidence_gaps(id) on delete set null,
  event_type text not null,
  event_title text not null,
  event_description text,
  before_value_json jsonb,
  after_value_json jsonb,
  actor_user_id text,
  source_module text not null default 'Regulatory Evidence',
  source_record_id text,
  audit_log_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_reg_evidence_req_company_site_status on public.regulatory_evidence_requirements(company_id, site_id, requirement_status);
create index if not exists idx_reg_evidence_req_item on public.regulatory_evidence_requirements(regulatory_item_id);
create index if not exists idx_reg_evidence_req_obligation on public.regulatory_evidence_requirements(obligation_id);
create index if not exists idx_reg_evidence_req_due on public.regulatory_evidence_requirements(due_date);
create index if not exists idx_reg_evidence_links_status on public.regulatory_evidence_links(company_id, site_id, evidence_status);
create index if not exists idx_reg_evidence_links_review on public.regulatory_evidence_links(company_id, site_id, review_status);
create index if not exists idx_reg_evidence_links_readiness on public.regulatory_evidence_links(company_id, site_id, readiness_status);
create index if not exists idx_reg_evidence_links_item on public.regulatory_evidence_links(regulatory_item_id);
create index if not exists idx_reg_evidence_links_obligation on public.regulatory_evidence_links(obligation_id);
create index if not exists idx_reg_evidence_links_requirement on public.regulatory_evidence_links(evidence_requirement_id);
create index if not exists idx_reg_evidence_links_source on public.regulatory_evidence_links(source_module, source_record_id);
create index if not exists idx_reg_evidence_links_document on public.regulatory_evidence_links(document_id);
create index if not exists idx_reg_evidence_links_storage on public.regulatory_evidence_links(storage_file_id);
create index if not exists idx_reg_evidence_links_expiry on public.regulatory_evidence_links(expiry_date);
create index if not exists idx_reg_evidence_reviews_link on public.regulatory_evidence_reviews(evidence_link_id, reviewed_at desc);
create index if not exists idx_reg_evidence_requests_status on public.regulatory_evidence_requests(company_id, site_id, request_status);
create index if not exists idx_reg_evidence_requests_due on public.regulatory_evidence_requests(due_date);
create index if not exists idx_reg_evidence_gaps_status on public.regulatory_evidence_gaps(company_id, site_id, gap_status);
create index if not exists idx_reg_evidence_chain_link on public.regulatory_evidence_chain_events(evidence_link_id, created_at desc);
create index if not exists idx_reg_evidence_access_link on public.regulatory_evidence_access_events(evidence_link_id, accessed_at desc);
create index if not exists idx_reg_evidence_package_items_package on public.regulatory_evidence_package_items(package_id, evidence_link_id);
create index if not exists idx_reg_evidence_history_link on public.regulatory_evidence_history_events(evidence_link_id, created_at desc);

alter table public.regulatory_evidence_requirements enable row level security;
alter table public.regulatory_evidence_links enable row level security;
alter table public.regulatory_evidence_reviews enable row level security;
alter table public.regulatory_evidence_requests enable row level security;
alter table public.regulatory_evidence_gaps enable row level security;
alter table public.regulatory_evidence_chain_events enable row level security;
alter table public.regulatory_evidence_access_events enable row level security;
alter table public.regulatory_evidence_package_foundations enable row level security;
alter table public.regulatory_evidence_package_items enable row level security;
alter table public.regulatory_evidence_staleness_events enable row level security;
alter table public.regulatory_evidence_history_events enable row level security;

grant select, insert, update, delete on table
  public.regulatory_evidence_requirements,
  public.regulatory_evidence_links,
  public.regulatory_evidence_reviews,
  public.regulatory_evidence_requests,
  public.regulatory_evidence_gaps,
  public.regulatory_evidence_chain_events,
  public.regulatory_evidence_access_events,
  public.regulatory_evidence_package_foundations,
  public.regulatory_evidence_package_items,
  public.regulatory_evidence_staleness_events,
  public.regulatory_evidence_history_events
to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'regulatory_evidence_requirements',
    'regulatory_evidence_links',
    'regulatory_evidence_reviews',
    'regulatory_evidence_requests',
    'regulatory_evidence_gaps',
    'regulatory_evidence_chain_events',
    'regulatory_evidence_access_events',
    'regulatory_evidence_package_foundations',
    'regulatory_evidence_package_items',
    'regulatory_evidence_staleness_events',
    'regulatory_evidence_history_events'
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
  permissions text[][] := array[
    array['regulatory.evidence.view', 'Regulatory evidence view'],
    array['regulatory.evidence.dashboard.view', 'Regulatory evidence dashboard view'],
    array['regulatory.evidence.register.view', 'Regulatory evidence register view'],
    array['regulatory.evidence.requirement.view', 'Regulatory evidence requirement view'],
    array['regulatory.evidence.requirement.create', 'Regulatory evidence requirement create'],
    array['regulatory.evidence.requirement.edit', 'Regulatory evidence requirement edit'],
    array['regulatory.evidence.requirement.archive', 'Regulatory evidence requirement archive'],
    array['regulatory.evidence.link.view', 'Regulatory evidence link view'],
    array['regulatory.evidence.link.create', 'Regulatory evidence link create'],
    array['regulatory.evidence.link.edit', 'Regulatory evidence link edit'],
    array['regulatory.evidence.link.remove', 'Regulatory evidence link remove'],
    array['regulatory.evidence.link.replace', 'Regulatory evidence link replace'],
    array['regulatory.evidence.link.archive', 'Regulatory evidence link archive'],
    array['regulatory.evidence.upload', 'Regulatory evidence upload'],
    array['regulatory.evidence.link_document', 'Regulatory evidence link document'],
    array['regulatory.evidence.link_module_record', 'Regulatory evidence link module record'],
    array['regulatory.evidence.preview', 'Regulatory evidence preview'],
    array['regulatory.evidence.download', 'Regulatory evidence download'],
    array['regulatory.evidence.restricted.view', 'Regulatory restricted evidence view'],
    array['regulatory.evidence.restricted.manage', 'Regulatory restricted evidence manage'],
    array['regulatory.evidence.review.view', 'Regulatory evidence review view'],
    array['regulatory.evidence.review.submit', 'Regulatory evidence review submit'],
    array['regulatory.evidence.review.verify', 'Regulatory evidence review verify'],
    array['regulatory.evidence.review.reject', 'Regulatory evidence review reject'],
    array['regulatory.evidence.review.request_rework', 'Regulatory evidence review request rework'],
    array['regulatory.evidence.request.view', 'Regulatory evidence request view'],
    array['regulatory.evidence.request.create', 'Regulatory evidence request create'],
    array['regulatory.evidence.request.fulfill', 'Regulatory evidence request fulfill'],
    array['regulatory.evidence.request.cancel', 'Regulatory evidence request cancel'],
    array['regulatory.evidence.gap.view', 'Regulatory evidence gap view'],
    array['regulatory.evidence.gap.create', 'Regulatory evidence gap create'],
    array['regulatory.evidence.gap.edit', 'Regulatory evidence gap edit'],
    array['regulatory.evidence.gap.resolve', 'Regulatory evidence gap resolve'],
    array['regulatory.evidence.gap.create_action_foundation', 'Regulatory evidence gap create action foundation'],
    array['regulatory.evidence.package.view', 'Regulatory evidence package view'],
    array['regulatory.evidence.package.prepare', 'Regulatory evidence package prepare'],
    array['regulatory.evidence.package.include_restricted', 'Regulatory evidence package include restricted'],
    array['regulatory.evidence.chain.view', 'Regulatory evidence chain view'],
    array['regulatory.evidence.access_log.view', 'Regulatory evidence access log view'],
    array['regulatory.evidence.stale.view', 'Regulatory evidence stale view'],
    array['regulatory.evidence.history.view', 'Regulatory evidence history view'],
    array['regulatory.evidence.settings.edit', 'Regulatory evidence settings edit']
  ];
begin
  for tenant_row in select id from public."Tenant" loop
    foreach permission_pair slice 1 in array permissions loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_pair[1], 'Regulatory', permission_pair[2]
      where not exists (
        select 1
        from public."Permission"
        where "tenantId" = tenant_row.id and "key" = permission_pair[1]
      );
    end loop;
  end loop;
end $$;
