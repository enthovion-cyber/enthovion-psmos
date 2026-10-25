-- Regulatory Register Phase 10: Change Management + Update Monitoring foundation.
create table if not exists public.regulatory_change_sources (
  id text primary key,
  company_id text not null,
  site_id text null,
  source_code text null,
  source_title text not null,
  source_type text not null,
  authority_id text null,
  jurisdiction_id text null,
  source_url text null,
  monitoring_frequency_foundation text null,
  owner_user_id text null,
  last_checked_at timestamptz null,
  next_check_at timestamptz null,
  source_status text not null default 'Active',
  notes text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null
);
create table if not exists public.regulatory_changes (
  id text primary key,
  company_id text not null,
  site_id text null,
  department_id text null,
  unit_id text null,
  area_id text null,
  equipment_id text null,
  change_code text null,
  change_title text not null,
  change_type text not null,
  source_type text not null,
  change_source_id text null references public.regulatory_change_sources(id) on delete
  set null,
    authority_id text null,
    jurisdiction_id text null,
    regulatory_item_id text null,
    obligation_id text null,
    source_reference text null,
    source_url text null,
    source_document_id text null,
    published_date timestamptz null,
    detected_date timestamptz null,
    effective_date timestamptz null,
    change_summary text null,
    change_description text null,
    manual_entry_reason text null,
    change_status text not null default 'Draft',
    impact_status text not null default 'Not Assessed',
    criticality text null,
    preliminary_impact_flags_json jsonb null,
    owner_user_id text null,
    reviewer_user_id text null,
    review_due_date timestamptz null,
    approval_package_id text null,
    implemented_by text null,
    implemented_at timestamptz null,
    implementation_note text null,
    notes text null,
    created_by text null,
    updated_by text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    archived_at timestamptz null,
    archived_by text null,
    archive_reason text null
);
create table if not exists public.regulatory_change_impact_assessments (
  id text primary key,
  company_id text not null,
  site_id text null,
  change_id text not null references public.regulatory_changes(id) on delete cascade,
  assessment_code text null,
  assessment_title text not null,
  assessment_status text not null default 'Draft',
  impact_status text not null default 'Not Assessed',
  impact_summary text null,
  impact_rationale text null,
  affected_scope_json jsonb null,
  applicability_impact_status text null,
  obligation_impact_status text null,
  compliance_impact_status text null,
  evidence_impact_status text null,
  audit_mapping_impact_status text null,
  action_impact_status text null,
  report_impact_status text null,
  criticality text null,
  assessor_user_id text null,
  reviewer_user_id text null,
  assessed_at timestamptz null,
  review_due_date timestamptz null,
  review_package_id text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null
);
create table if not exists public.regulatory_change_affected_records (
  id text primary key,
  company_id text not null,
  site_id text null,
  change_id text not null references public.regulatory_changes(id) on delete cascade,
  impact_assessment_id text null references public.regulatory_change_impact_assessments(id) on delete
  set null,
    affected_record_type text not null,
    affected_record_id text not null,
    regulatory_item_id text null,
    obligation_id text null,
    impact_action text not null default 'Review Required',
    impact_status text not null default 'Pending',
    impact_reason text null,
    stale_marked boolean not null default false,
    stale_reason text null,
    owner_user_id text null,
    due_date timestamptz null,
    action_id text null,
    review_package_id text null,
    source_snapshot_json jsonb null,
    created_by text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create table if not exists public.regulatory_change_version_comparisons (
  id text primary key,
  company_id text not null,
  site_id text null,
  change_id text not null references public.regulatory_changes(id) on delete cascade,
  regulatory_item_id text null,
  previous_version text null,
  new_version text null,
  changed_fields_json jsonb null,
  comparison_summary text null,
  effective_date_changed boolean not null default false,
  scope_changed boolean not null default false,
  applicability_changed boolean not null default false,
  obligation_changed boolean not null default false,
  evidence_requirement_changed boolean not null default false,
  compliance_deadline_changed boolean not null default false,
  created_by text null,
  created_at timestamptz not null default now()
);
create table if not exists public.regulatory_change_actions (
  id text primary key,
  company_id text not null,
  site_id text null,
  change_id text not null references public.regulatory_changes(id) on delete cascade,
  impact_assessment_id text null,
  affected_record_id text null,
  action_type text not null,
  action_title text not null,
  action_status text not null default 'Open',
  owner_user_id text null,
  due_date timestamptz null,
  universal_action_id text null,
  action_link_id text null,
  created_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.regulatory_change_notifications (
  id text primary key,
  company_id text not null,
  site_id text null,
  change_id text not null references public.regulatory_changes(id) on delete cascade,
  recipient_user_id text not null,
  notification_type text not null,
  notification_status text not null default 'Pending',
  message_summary text null,
  sent_at timestamptz null,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);
create table if not exists public.regulatory_change_staleness_events (
  id text primary key,
  company_id text not null,
  site_id text null,
  change_id text null references public.regulatory_changes(id) on delete cascade,
  affected_record_type text null,
  affected_record_id text null,
  stale_trigger_type text not null,
  source_module text not null,
  source_record_id text null,
  stale_reason text not null,
  detected_at timestamptz not null default now(),
  resolved_by text null,
  resolved_at timestamptz null,
  resolution_note text null,
  created_at timestamptz not null default now()
);
create table if not exists public.regulatory_change_history_events (
  id text primary key,
  company_id text not null,
  site_id text null,
  unit_id text null,
  area_id text null,
  equipment_id text null,
  change_id text null references public.regulatory_changes(id) on delete cascade,
  impact_assessment_id text null,
  affected_record_id text null,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text null,
  source_module text not null,
  source_record_id text null,
  audit_log_id text null,
  created_at timestamptz not null default now()
);
alter table public.regulatory_settings
add column if not exists require_impact_assessment_for_new_update boolean not null default true,
  add column if not exists require_review_for_high_impact_change boolean not null default true,
  add column if not exists require_review_for_psm_critical_change boolean not null default true,
  add column if not exists require_review_for_safety_critical_change boolean not null default true,
  add column if not exists require_review_for_environmental_critical_change boolean not null default true,
  add column if not exists auto_mark_applicability_stale_on_regulatory_change boolean not null default true,
  add column if not exists auto_mark_compliance_stale_on_regulatory_change boolean not null default true,
  add column if not exists auto_mark_evidence_stale_on_regulatory_change boolean not null default true,
  add column if not exists auto_mark_audit_mapping_stale_on_regulatory_change boolean not null default true,
  add column if not exists auto_mark_reports_stale_on_regulatory_change boolean not null default true,
  add column if not exists auto_create_action_for_critical_change boolean not null default false,
  add column if not exists auto_notify_impacted_owners boolean not null default true,
  add column if not exists regulatory_change_review_due_days integer not null default 30,
  add column if not exists regulatory_source_check_due_soon_days integer not null default 7;
create index if not exists regulatory_changes_company_site_status_idx on public.regulatory_changes(company_id, site_id, change_status);
create index if not exists regulatory_changes_company_site_impact_idx on public.regulatory_changes(company_id, site_id, impact_status);
create index if not exists regulatory_changes_item_idx on public.regulatory_changes(regulatory_item_id);
create index if not exists regulatory_changes_obligation_idx on public.regulatory_changes(obligation_id);
create index if not exists regulatory_changes_jurisdiction_idx on public.regulatory_changes(jurisdiction_id);
create index if not exists regulatory_changes_owner_idx on public.regulatory_changes(owner_user_id);
create index if not exists regulatory_changes_effective_date_idx on public.regulatory_changes(effective_date);
create index if not exists regulatory_change_sources_company_site_status_idx on public.regulatory_change_sources(company_id, site_id, source_status);
create index if not exists regulatory_change_assessments_change_status_idx on public.regulatory_change_impact_assessments(change_id, assessment_status);
create index if not exists regulatory_change_affected_lookup_idx on public.regulatory_change_affected_records(
  change_id,
  affected_record_type,
  affected_record_id
);
create index if not exists regulatory_change_actions_change_status_idx on public.regulatory_change_actions(change_id, action_status);
create index if not exists regulatory_change_history_change_time_idx on public.regulatory_change_history_events(change_id, created_at);
do $$
declare table_name text;
begin foreach table_name in array array ['regulatory_change_sources','regulatory_changes','regulatory_change_impact_assessments','regulatory_change_affected_records','regulatory_change_version_comparisons','regulatory_change_actions','regulatory_change_notifications','regulatory_change_staleness_events','regulatory_change_history_events'] loop execute format(
  'alter table public.%I enable row level security',
  table_name
);
execute format(
  'drop policy if exists %I on public.%I',
  table_name || '_server_only_policy',
  table_name
);
execute format(
  'create policy %I on public.%I for all to authenticated using (false) with check (false)',
  table_name || '_server_only_policy',
  table_name
);
end loop;
end $$;
do $$
declare tenant_id text;
p record;
begin for tenant_id in
select id
from public."Tenant" loop for p in
select *
from (
    values (
        'regulatory.change.view',
        'View regulatory changes'
      ),
(
        'regulatory.change.dashboard.view',
        'View regulatory change dashboard'
      ),
(
        'regulatory.change.register.view',
        'View regulatory change register'
      ),
(
        'regulatory.change.create',
        'Create regulatory change'
      ),
(
        'regulatory.change.edit',
        'Edit regulatory change'
      ),
(
        'regulatory.change.archive',
        'Archive regulatory change'
      ),
(
        'regulatory.change.implement',
        'Implement regulatory change'
      ),
(
        'regulatory.change.compare_versions',
        'Compare regulatory versions'
      ),
(
        'regulatory.change.source.view',
        'View change sources'
      ),
(
        'regulatory.change.source.create',
        'Create change source'
      ),
(
        'regulatory.change.source.edit',
        'Edit change source'
      ),
(
        'regulatory.change.source.archive',
        'Archive change source'
      ),
(
        'regulatory.change.watchlist.view',
        'View source watchlist'
      ),
(
        'regulatory.change.impact.view',
        'View change impacts'
      ),
(
        'regulatory.change.impact.create',
        'Create change impact assessment'
      ),
(
        'regulatory.change.impact.edit',
        'Edit change impact assessment'
      ),
(
        'regulatory.change.impact.approve_foundation',
        'Approve change impact foundation'
      ),
(
        'regulatory.change.affected_records.view',
        'View affected records'
      ),
(
        'regulatory.change.affected_records.manage',
        'Manage affected records'
      ),
(
        'regulatory.change.mark_stale_records',
        'Mark impacted records stale'
      ),
(
        'regulatory.change.create_action_foundation',
        'Create action from change'
      ),
(
        'regulatory.change.submit_review',
        'Submit change review'
      ),
(
        'regulatory.change.history.view',
        'View change history'
      ),
(
        'regulatory.change.settings.edit',
        'Edit change settings'
      )
  ) as permissions(permission_key, permission_label) loop
insert into public."Permission"("id", "tenantId", "key", "moduleKey", "label")
select gen_random_uuid()::text,
  tenant_id,
  p.permission_key,
  'REGULATORY',
  p.permission_label
where not exists(
    select 1
    from public."Permission"
    where "tenantId" = tenant_id
      and "key" = p.permission_key
  );
end loop;
end loop;
end $$;