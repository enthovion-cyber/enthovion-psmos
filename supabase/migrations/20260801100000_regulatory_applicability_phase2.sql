alter table public.regulatory_jurisdictions
  add column if not exists parent_jurisdiction_id text references public.regulatory_jurisdictions(id),
  add column if not exists jurisdiction_description text,
  add column if not exists owner_user_id text,
  add column if not exists effective_date timestamptz,
  add column if not exists review_frequency text,
  add column if not exists next_review_date timestamptz,
  add column if not exists notes text;

alter table public.regulatory_settings
  add column if not exists require_applicability_assessment_for_active_item boolean not null default false,
  add column if not exists require_rationale_for_applicable boolean not null default true,
  add column if not exists require_rationale_for_partially_applicable boolean not null default true,
  add column if not exists require_review_for_critical_applicability boolean not null default true,
  add column if not exists require_review_for_not_applicable_critical_item boolean not null default true,
  add column if not exists default_applicability_review_frequency text default 'Annual',
  add column if not exists applicability_review_due_soon_days integer not null default 30,
  add column if not exists auto_create_gap_for_missing_applicability boolean not null default true,
  add column if not exists auto_create_gap_for_missing_rationale boolean not null default true,
  add column if not exists auto_mark_applicability_stale_on_scope_change boolean not null default true,
  add column if not exists auto_notify_owner_applicability_review_due boolean not null default false,
  add column if not exists auto_notify_owner_applicability_stale boolean not null default false;

create table if not exists public.regulatory_authorities (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  authority_code text,
  authority_name text not null,
  authority_type text not null,
  jurisdiction_level text,
  country text,
  state_province text,
  city_municipality text,
  website_url text,
  contact_foundation_json jsonb,
  inspection_authority boolean not null default false,
  permit_authority boolean not null default false,
  enforcement_authority boolean not null default false,
  notes text,
  authority_status text not null default 'Active',
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_jurisdiction_authorities (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  jurisdiction_id text not null references public.regulatory_jurisdictions(id) on delete cascade,
  authority_id text not null references public.regulatory_authorities(id) on delete cascade,
  primary_authority boolean not null default false,
  link_reason text,
  linked_by text,
  linked_at timestamptz not null default now(),
  removed_by text,
  removed_at timestamptz,
  remove_reason text
);

create table if not exists public.regulatory_jurisdiction_site_links (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text not null,
  jurisdiction_id text not null references public.regulatory_jurisdictions(id) on delete cascade,
  scope_note text,
  linked_by text,
  linked_at timestamptz not null default now(),
  removed_by text,
  removed_at timestamptz,
  remove_reason text
);

create table if not exists public.regulatory_applicability_profiles (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  profile_code text,
  profile_name text not null,
  profile_type text not null,
  profile_description text,
  category text,
  criticality text,
  jurisdiction_id text references public.regulatory_jurisdictions(id),
  authority_id text references public.regulatory_authorities(id),
  owner_user_id text,
  profile_status text not null default 'Draft',
  review_frequency text,
  next_review_date timestamptz,
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_applicability_criteria (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  profile_id text not null references public.regulatory_applicability_profiles(id) on delete cascade,
  sequence_no integer not null default 1,
  question_text text not null,
  question_type text not null default 'Yes / No',
  help_text text,
  required boolean not null default false,
  effect text not null default 'No Decision Effect',
  options_json jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_applicability_assessments (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  regulatory_item_id text references public.regulatory_register_items(id) on delete cascade,
  jurisdiction_id text references public.regulatory_jurisdictions(id),
  profile_id text references public.regulatory_applicability_profiles(id),
  assessment_number text,
  assessment_title text,
  assessment_method text not null default 'Manual Assessment',
  assessment_status text not null default 'Draft',
  applicability_status text not null default 'Not Assessed',
  rationale text,
  included_scope text,
  excluded_scope text,
  scope_summary_json jsonb,
  criteria_snapshot_json jsonb,
  source_snapshot_json jsonb,
  review_required boolean not null default false,
  stale boolean not null default false,
  stale_reason text,
  stale_at timestamptz,
  last_assessed_at timestamptz,
  next_review_date timestamptz,
  owner_user_id text,
  assessed_by text,
  submitted_by text,
  submitted_at timestamptz,
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_applicability_answers (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  assessment_id text not null references public.regulatory_applicability_assessments(id) on delete cascade,
  criterion_id text references public.regulatory_applicability_criteria(id),
  question_text text,
  answer_value text,
  answer_json jsonb,
  rationale text,
  answered_by text,
  answered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_applicability_scope_links (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  assessment_id text not null references public.regulatory_applicability_assessments(id) on delete cascade,
  scope_type text not null,
  scope_record_id text,
  scope_label text,
  included boolean not null default true,
  scope_reason text,
  created_by text,
  created_at timestamptz not null default now(),
  removed_by text,
  removed_at timestamptz,
  remove_reason text
);

create table if not exists public.regulatory_applicability_decisions (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  assessment_id text not null references public.regulatory_applicability_assessments(id) on delete cascade,
  regulatory_item_id text references public.regulatory_register_items(id),
  decision text not null,
  rationale text,
  included_scope text,
  excluded_scope text,
  decision_snapshot_json jsonb,
  decided_by text,
  decided_at timestamptz not null default now(),
  review_required boolean not null default false,
  superseded_at timestamptz,
  superseded_by text
);

create table if not exists public.regulatory_applicability_gaps (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  regulatory_item_id text references public.regulatory_register_items(id) on delete cascade,
  assessment_id text references public.regulatory_applicability_assessments(id) on delete cascade,
  gap_type text not null,
  gap_title text not null,
  gap_description text,
  severity text,
  blocking boolean not null default false,
  gap_status text not null default 'Open',
  owner_user_id text,
  due_date timestamptz,
  related_scope_json jsonb,
  linked_action_id text,
  created_by text,
  resolved_by text,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_applicability_staleness_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  assessment_id text references public.regulatory_applicability_assessments(id) on delete cascade,
  regulatory_item_id text references public.regulatory_register_items(id) on delete cascade,
  stale_reason text not null,
  source_change_type text,
  source_record_id text,
  detected_at timestamptz not null default now(),
  acknowledged_by text,
  acknowledged_at timestamptz,
  reassessment_id text
);

create table if not exists public.regulatory_applicability_history_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text,
  regulatory_item_id text,
  assessment_id text,
  event_type text not null,
  event_title text not null,
  event_description text,
  before_value_json jsonb,
  after_value_json jsonb,
  actor_user_id text,
  source_module text not null default 'Regulatory Applicability',
  source_record_id text,
  audit_log_id text,
  created_at timestamptz not null default now()
);

alter table public.regulatory_authorities enable row level security;
alter table public.regulatory_jurisdiction_authorities enable row level security;
alter table public.regulatory_jurisdiction_site_links enable row level security;
alter table public.regulatory_applicability_profiles enable row level security;
alter table public.regulatory_applicability_criteria enable row level security;
alter table public.regulatory_applicability_assessments enable row level security;
alter table public.regulatory_applicability_answers enable row level security;
alter table public.regulatory_applicability_scope_links enable row level security;
alter table public.regulatory_applicability_decisions enable row level security;
alter table public.regulatory_applicability_gaps enable row level security;
alter table public.regulatory_applicability_staleness_events enable row level security;
alter table public.regulatory_applicability_history_events enable row level security;

grant select, insert, update, delete on public.regulatory_authorities to authenticated;
grant select, insert, update, delete on public.regulatory_jurisdiction_authorities to authenticated;
grant select, insert, update, delete on public.regulatory_jurisdiction_site_links to authenticated;
grant select, insert, update, delete on public.regulatory_applicability_profiles to authenticated;
grant select, insert, update, delete on public.regulatory_applicability_criteria to authenticated;
grant select, insert, update, delete on public.regulatory_applicability_assessments to authenticated;
grant select, insert, update, delete on public.regulatory_applicability_answers to authenticated;
grant select, insert, update, delete on public.regulatory_applicability_scope_links to authenticated;
grant select, insert, update, delete on public.regulatory_applicability_decisions to authenticated;
grant select, insert, update, delete on public.regulatory_applicability_gaps to authenticated;
grant select, insert, update, delete on public.regulatory_applicability_staleness_events to authenticated;
grant select, insert, update, delete on public.regulatory_applicability_history_events to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'regulatory_authorities',
    'regulatory_jurisdiction_authorities',
    'regulatory_jurisdiction_site_links',
    'regulatory_applicability_profiles',
    'regulatory_applicability_criteria',
    'regulatory_applicability_assessments',
    'regulatory_applicability_answers',
    'regulatory_applicability_scope_links',
    'regulatory_applicability_decisions',
    'regulatory_applicability_gaps',
    'regulatory_applicability_staleness_events',
    'regulatory_applicability_history_events'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_select_company_site', table_name);
    execute format('create policy %I on public.%I for select using (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_select_company_site', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_company_site', table_name);
    execute format('create policy %I on public.%I for insert with check (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_insert_company_site', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_company_site', table_name);
    execute format('create policy %I on public.%I for update using (public.regulatory_company_site_visible(company_id, site_id)) with check (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_update_company_site', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_company_site', table_name);
    execute format('create policy %I on public.%I for delete using (public.regulatory_company_site_visible(company_id, site_id))', table_name || '_delete_company_site', table_name);
  end loop;
end $$;

create index if not exists regulatory_authorities_company_site_idx on public.regulatory_authorities(company_id, site_id, authority_status);
create index if not exists regulatory_authorities_search_idx on public.regulatory_authorities(company_id, authority_name, authority_code);
create index if not exists regulatory_jurisdiction_authorities_scope_idx on public.regulatory_jurisdiction_authorities(company_id, jurisdiction_id, authority_id) where removed_at is null;
create index if not exists regulatory_jurisdiction_site_links_scope_idx on public.regulatory_jurisdiction_site_links(company_id, site_id, jurisdiction_id) where removed_at is null;
create index if not exists regulatory_applicability_profiles_scope_idx on public.regulatory_applicability_profiles(company_id, site_id, profile_status);
create index if not exists regulatory_applicability_criteria_profile_idx on public.regulatory_applicability_criteria(company_id, profile_id, sequence_no);
create index if not exists regulatory_applicability_assessments_scope_idx on public.regulatory_applicability_assessments(company_id, site_id, applicability_status, assessment_status);
create index if not exists regulatory_applicability_assessments_item_idx on public.regulatory_applicability_assessments(company_id, regulatory_item_id, stale);
create index if not exists regulatory_applicability_answers_assessment_idx on public.regulatory_applicability_answers(company_id, assessment_id);
create index if not exists regulatory_applicability_scope_links_assessment_idx on public.regulatory_applicability_scope_links(company_id, assessment_id, scope_type) where removed_at is null;
create index if not exists regulatory_applicability_decisions_assessment_idx on public.regulatory_applicability_decisions(company_id, assessment_id, decided_at desc);
create index if not exists regulatory_applicability_gaps_scope_idx on public.regulatory_applicability_gaps(company_id, site_id, gap_status, gap_type);
create index if not exists regulatory_applicability_stale_idx on public.regulatory_applicability_staleness_events(company_id, assessment_id, detected_at desc);
create index if not exists regulatory_applicability_history_idx on public.regulatory_applicability_history_events(company_id, assessment_id, created_at desc);

do $$
declare
  permission_key text;
  permission_label text;
  tenant_row record;
  permission_keys text[] := array[
    'regulatory.jurisdiction.dashboard.view',
    'regulatory.jurisdiction.archive',
    'regulatory.jurisdiction.reactivate',
    'regulatory.authority.view',
    'regulatory.authority.create',
    'regulatory.authority.edit',
    'regulatory.authority.archive',
    'regulatory.authority.link',
    'regulatory.applicability.view',
    'regulatory.applicability.dashboard.view',
    'regulatory.applicability.matrix.view',
    'regulatory.applicability.assessment.create',
    'regulatory.applicability.assessment.edit',
    'regulatory.applicability.assessment.submit',
    'regulatory.applicability.assessment.archive',
    'regulatory.applicability.decision.make',
    'regulatory.applicability.decision.review',
    'regulatory.applicability.decision.override',
    'regulatory.applicability.profile.view',
    'regulatory.applicability.profile.create',
    'regulatory.applicability.profile.edit',
    'regulatory.applicability.profile.archive',
    'regulatory.applicability.criteria.manage',
    'regulatory.applicability.gap.view',
    'regulatory.applicability.gap.manage',
    'regulatory.applicability.stale.view',
    'regulatory.applicability.history.view',
    'regulatory.applicability.settings.edit'
  ];
begin
  for tenant_row in select id from public."Tenant" loop
    foreach permission_key in array permission_keys loop
      permission_label := initcap(replace(replace(permission_key, 'regulatory.', ''), '_', ' '));
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_key, 'regulatory', permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_row.id and "key" = permission_key
      );
    end loop;
  end loop;
end $$;
