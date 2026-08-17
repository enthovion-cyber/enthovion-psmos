create table if not exists public.psi_drawings (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  unit_id text null,
  area_id text null,
  drawing_number text not null,
  drawing_title text not null,
  drawing_type text not null,
  discipline text not null,
  system_service text null,
  drawing_package text null,
  sheet_number text null,
  total_sheets integer null,
  drawing_scale text null,
  status text not null default 'Draft',
  critical_drawing boolean not null default false,
  psm_critical boolean not null default false,
  completeness_status text not null default 'Not Reviewed',
  completeness_score numeric null,
  conflict_status text not null default 'No Conflict',
  review_status text not null default 'Not Reviewed',
  moc_update_required boolean not null default false,
  pssr_blocker boolean not null default false,
  current_approved boolean not null default false,
  as_built_verified boolean not null default false,
  redline_status text null,
  owner_user_id text null,
  document_controller_id text null,
  process_engineer_id text null,
  discipline_engineer_id text null,
  operations_owner_id text null,
  hse_reviewer_id text null,
  last_review_date timestamptz null,
  next_review_due timestamptz null,
  notes text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null,
  archive_reason text null
);

create table if not exists public.psi_drawing_document_links (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  drawing_id text not null references public.psi_drawings(id) on delete cascade,
  document_id text not null,
  document_version_id text null,
  document_number text null,
  document_title text null,
  revision_number text null,
  revision_date timestamptz null,
  document_status text null,
  current_approved boolean not null default false,
  supersedes_document_id text null,
  superseded_by_document_id text null,
  issued_for_review_date timestamptz null,
  issued_for_construction_date timestamptz null,
  issued_as_built_date timestamptz null,
  approval_date timestamptz null,
  effective_date timestamptz null,
  document_language text null,
  file_type text null,
  source_system_reference text null,
  revision_notes text null,
  linked_by text null,
  linked_at timestamptz not null default now(),
  removed_by text null,
  removed_at timestamptz null,
  remove_reason text null,
  constraint psi_drawing_document_link_unique unique (company_id, drawing_id, document_id)
);

create table if not exists public.psi_drawing_scopes (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  drawing_id text not null references public.psi_drawings(id) on delete cascade,
  unit_id text null,
  department_id text null,
  area_id text null,
  building_location text null,
  battery_limits text null,
  system_service text null,
  related_process_step text null,
  related_operating_mode text null,
  related_utilities_json jsonb null,
  upstream_unit_id text null,
  downstream_unit_id text null,
  affected_units_json jsonb null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint psi_drawing_scope_one unique (company_id, drawing_id)
);

create table if not exists public.psi_drawing_relationships (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  drawing_id text not null references public.psi_drawings(id) on delete cascade,
  linked_module text not null,
  linked_record_id text not null,
  linked_record_label text null,
  relationship_type text not null,
  readiness_impact boolean not null default false,
  pssr_impact boolean not null default false,
  moc_impact boolean not null default false,
  notes text null,
  created_by text null,
  created_at timestamptz not null default now(),
  removed_by text null,
  removed_at timestamptz null,
  remove_reason text null
);

create table if not exists public.psi_drawing_tag_index (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  drawing_id text not null references public.psi_drawings(id) on delete cascade,
  unit_id text null,
  area_id text null,
  tag_number text not null,
  tag_type text not null,
  tag_description text null,
  service text null,
  linked_module text null,
  linked_record_id text null,
  sheet_page_reference text null,
  coordinate_reference text null,
  verification_status text not null default 'Unverified',
  source_method text not null default 'Manual',
  mismatch_reason text null,
  notes text null,
  created_by text null,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint psi_drawing_tag_unique unique (company_id, drawing_id, tag_number, tag_type)
);

create table if not exists public.psi_drawing_moc_redline_status (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  drawing_id text not null references public.psi_drawings(id) on delete cascade,
  redline_exists boolean not null default false,
  redline_status text null,
  redline_document_id text null,
  redline_owner_id text null,
  redline_due_date timestamptz null,
  moc_required boolean not null default false,
  linked_moc_id text null,
  moc_update_status text null,
  drawing_update_required_by_moc boolean not null default false,
  drawing_update_completed boolean not null default false,
  as_built_required boolean not null default false,
  as_built_verified boolean not null default false,
  as_built_verified_by text null,
  as_built_verified_at timestamptz null,
  field_walkdown_required boolean not null default false,
  field_walkdown_status text null,
  field_walkdown_evidence_document_id text null,
  comments text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint psi_drawing_moc_redline_one unique (company_id, drawing_id)
);

create table if not exists public.psi_drawing_completeness_evaluations (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  drawing_id text null references public.psi_drawings(id) on delete cascade,
  unit_id text null,
  check_key text not null,
  check_title text not null,
  status text not null,
  severity text not null,
  message text null,
  missing_reason text null,
  pssr_blocker boolean not null default false,
  action_required boolean not null default false,
  owner_user_id text null,
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint psi_drawing_completeness_unique unique (company_id, drawing_id, check_key)
);

create table if not exists public.psi_drawing_conflict_results (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  drawing_id text null references public.psi_drawings(id) on delete cascade,
  unit_id text null,
  conflict_type text not null,
  conflict_status text not null,
  severity text not null,
  message text not null,
  compared_module text null,
  compared_record_id text null,
  compared_value_json jsonb null,
  current_value_json jsonb null,
  override_required boolean not null default false,
  override_approved boolean not null default false,
  override_reason text null,
  override_approved_by text null,
  override_approved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.psi_drawing_as_built_verifications (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  drawing_id text not null references public.psi_drawings(id) on delete cascade,
  verification_type text not null,
  verification_status text not null,
  verified_by text null,
  verified_at timestamptz null,
  field_walkdown_date timestamptz null,
  evidence_document_id text null,
  findings_summary text null,
  mismatches_found boolean not null default false,
  action_required boolean not null default false,
  comments text null,
  created_by text null,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_drawing_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  unit_id text null,
  drawing_id text null,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text null,
  source_module text not null default 'PSI Drawings / P&IDs',
  source_record_id text null,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_drawing_import_jobs (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  uploaded_by text null,
  file_name text not null,
  file_key text null,
  status text not null default 'Preview Ready',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  error_rows integer not null default 0,
  created_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  error_report_key text null,
  preview_json jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.psi_drawings enable row level security;
alter table public.psi_drawing_document_links enable row level security;
alter table public.psi_drawing_scopes enable row level security;
alter table public.psi_drawing_relationships enable row level security;
alter table public.psi_drawing_tag_index enable row level security;
alter table public.psi_drawing_moc_redline_status enable row level security;
alter table public.psi_drawing_completeness_evaluations enable row level security;
alter table public.psi_drawing_conflict_results enable row level security;
alter table public.psi_drawing_as_built_verifications enable row level security;
alter table public.psi_drawing_history_events enable row level security;
alter table public.psi_drawing_import_jobs enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'psi_drawings',
    'psi_drawing_document_links',
    'psi_drawing_scopes',
    'psi_drawing_relationships',
    'psi_drawing_tag_index',
    'psi_drawing_moc_redline_status',
    'psi_drawing_completeness_evaluations',
    'psi_drawing_conflict_results',
    'psi_drawing_as_built_verifications',
    'psi_drawing_history_events',
    'psi_drawing_import_jobs'
  ]
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = table_name || '_service_role_all'
    ) then
      execute format('create policy %I on public.%I for all to service_role using (true) with check (true)', table_name || '_service_role_all', table_name);
    end if;
  end loop;
end $$;

create index if not exists psi_drawings_company_site_unit_idx on public.psi_drawings(company_id, site_id, unit_id);
create index if not exists psi_drawings_number_idx on public.psi_drawings(drawing_number);
create index if not exists psi_drawings_type_idx on public.psi_drawings(drawing_type);
create index if not exists psi_drawings_current_idx on public.psi_drawings(current_approved);
create index if not exists psi_drawings_pssr_idx on public.psi_drawings(pssr_blocker);
create index if not exists psi_drawings_moc_idx on public.psi_drawings(moc_update_required);
create index if not exists psi_drawings_review_due_idx on public.psi_drawings(next_review_due);
create index if not exists psi_drawing_document_links_drawing_document_idx on public.psi_drawing_document_links(drawing_id, document_id);
create index if not exists psi_drawing_relationships_lookup_idx on public.psi_drawing_relationships(drawing_id, linked_module, linked_record_id);
create index if not exists psi_drawing_tag_index_drawing_tag_idx on public.psi_drawing_tag_index(drawing_id, tag_number);
create index if not exists psi_drawing_tag_index_type_tag_idx on public.psi_drawing_tag_index(tag_type, tag_number);
create index if not exists psi_drawing_conflicts_status_idx on public.psi_drawing_conflict_results(drawing_id, conflict_status);
create index if not exists psi_drawing_history_created_idx on public.psi_drawing_history_events(drawing_id, created_at desc);

insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
select gen_random_uuid()::text, t.id, p.key, 'psi', p.label
from public."Tenant" t
cross join (values
  ('psi.drawing.view', 'View PSI Drawings / P&IDs'),
  ('psi.drawing.create', 'Create PSI Drawing'),
  ('psi.drawing.edit', 'Edit PSI Drawing'),
  ('psi.drawing.archive', 'Archive PSI Drawing'),
  ('psi.drawing.import', 'Import PSI Drawings'),
  ('psi.drawing.export', 'Export PSI Drawings'),
  ('psi.drawing.link_document', 'Link PSI Drawing Document'),
  ('psi.drawing.remove_document', 'Remove PSI Drawing Document'),
  ('psi.drawing.manage_scope', 'Manage PSI Drawing Scope'),
  ('psi.drawing.manage_relationships', 'Manage PSI Drawing Relationships'),
  ('psi.drawing.manage_tag_index', 'Manage PSI Drawing Tag Index'),
  ('psi.drawing.import_tag_index', 'Import PSI Drawing Tag Index'),
  ('psi.drawing.manage_redlines', 'Manage PSI Drawing Redlines'),
  ('psi.drawing.verify_as_built', 'Verify PSI Drawing As-Built'),
  ('psi.drawing.run_completeness_check', 'Run PSI Drawing Completeness Check'),
  ('psi.drawing.run_conflict_check', 'Run PSI Drawing Conflict Check'),
  ('psi.drawing.submit_review', 'Submit PSI Drawing Review'),
  ('psi.drawing.approve', 'Approve PSI Drawing'),
  ('psi.drawing.reject', 'Reject PSI Drawing'),
  ('psi.drawing.override_conflict', 'Override PSI Drawing Conflict')
) as p(key, label)
where not exists (
  select 1 from public."Permission" existing
  where existing."tenantId" = t.id and existing."key" = p.key
);
