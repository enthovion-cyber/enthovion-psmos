create table if not exists public.psi_units (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  department_id text,
  area_id text,
  unit_name text not null,
  unit_code text not null,
  unit_type text not null,
  description text,
  operating_status text not null default 'Draft',
  commissioning_date date,
  building_location text,
  battery_limits text,
  upstream_units_json jsonb,
  downstream_units_json jsonb,
  utilities_connected_json jsonb,
  interfaces_json jsonb,
  process_purpose text,
  normal_operation_summary text,
  process_flow_summary text,
  main_feed_streams_json jsonb,
  main_product_streams_json jsonb,
  waste_streams_json jsonb,
  utilities_used_json jsonb,
  operating_mode text,
  startup_shutdown_notes text,
  major_process_hazards text,
  major_chemical_hazards text,
  fire_explosion_hazards text,
  toxicity_hazards text,
  reactivity_hazards text,
  pressure_temperature_hazards text,
  environmental_hazards text,
  critical_safeguards_summary text,
  emergency_response_notes text,
  psi_owner_id text,
  process_engineer_id text,
  operations_owner_id text,
  hse_owner_id text,
  review_frequency_value integer,
  review_frequency_unit text,
  last_review_date date,
  next_review_due date,
  review_status text not null default 'Not Reviewed',
  psi_status text not null default 'Draft',
  completeness_score numeric(5,2),
  completeness_status text not null default 'Not Reviewed',
  critical_gap_count integer not null default 0,
  moc_update_required boolean not null default false,
  pssr_blocker boolean not null default false,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  constraint psi_units_unique_code_per_site unique (company_id, site_id, unit_code)
);

create table if not exists public.psi_unit_equipment_links (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  unit_id text not null references public.psi_units(id) on delete cascade,
  equipment_id text not null,
  relationship_type text not null default 'Unit Equipment',
  critical_to_unit boolean not null default false,
  created_by text,
  created_at timestamptz not null default now(),
  constraint psi_unit_equipment_unique unique (company_id, unit_id, equipment_id)
);

create table if not exists public.psi_completeness_requirements (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text,
  requirement_name text not null,
  category text not null,
  scope_type text not null default 'unit',
  unit_type text,
  required_condition_json jsonb,
  severity text not null default 'Medium',
  readiness_impact text,
  pssr_blocker_if_missing boolean not null default false,
  action_required_if_missing boolean not null default false,
  active boolean not null default true,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint psi_requirement_unique unique (company_id, site_id, category, requirement_name, unit_type)
);

create table if not exists public.psi_completeness_evaluations (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  unit_id text not null references public.psi_units(id) on delete cascade,
  requirement_id text references public.psi_completeness_requirements(id) on delete set null,
  category text not null,
  requirement_name text not null,
  status text not null default 'Not Reviewed',
  severity text not null default 'Medium',
  missing_reason text,
  linked_module text,
  linked_record_id text,
  linked_document_id text,
  owner_user_id text,
  due_date date,
  readiness_impact text,
  pssr_blocker boolean not null default false,
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint psi_eval_unique unique (company_id, unit_id, category, requirement_name)
);

create table if not exists public.psi_unit_linked_records (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  unit_id text not null references public.psi_units(id) on delete cascade,
  linked_module text not null,
  linked_record_id text not null,
  linked_record_number text,
  relationship_type text not null default 'Reference',
  readiness_impact text,
  created_by text,
  created_at timestamptz not null default now(),
  removed_by text,
  removed_at timestamptz,
  remove_reason text,
  constraint psi_linked_record_unique unique (company_id, unit_id, linked_module, linked_record_id)
);

create table if not exists public.psi_unit_document_links (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  unit_id text not null references public.psi_units(id) on delete cascade,
  document_id text not null,
  document_number text,
  document_title text,
  document_status text,
  document_revision text,
  document_type text,
  relationship_type text not null default 'Reference',
  required boolean not null default false,
  readiness_impact text,
  linked_by text,
  linked_at timestamptz not null default now(),
  removed_by text,
  removed_at timestamptz,
  remove_reason text,
  constraint psi_document_link_unique unique (company_id, unit_id, document_id)
);

create table if not exists public.psi_history_events (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  unit_id text,
  event_type text not null,
  event_title text not null,
  event_description text,
  before_value_json jsonb,
  after_value_json jsonb,
  actor_user_id text,
  source_module text not null default 'PSI',
  source_record_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.psi_review_records (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  unit_id text not null references public.psi_units(id) on delete cascade,
  review_number text not null,
  review_type text not null default 'PSI Profile Review',
  status text not null default 'Draft',
  submitted_by text,
  submitted_at timestamptz,
  approved_by text,
  approved_at timestamptz,
  rejected_by text,
  rejected_at timestamptz,
  rejection_reason text,
  approval_instance_id text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.psi_units enable row level security;
alter table public.psi_unit_equipment_links enable row level security;
alter table public.psi_completeness_requirements enable row level security;
alter table public.psi_completeness_evaluations enable row level security;
alter table public.psi_unit_linked_records enable row level security;
alter table public.psi_unit_document_links enable row level security;
alter table public.psi_history_events enable row level security;
alter table public.psi_review_records enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'psi_units' and policyname = 'psi_units_service_role_all') then
    create policy "psi_units_service_role_all" on public.psi_units for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'psi_unit_equipment_links' and policyname = 'psi_unit_equipment_links_service_role_all') then
    create policy "psi_unit_equipment_links_service_role_all" on public.psi_unit_equipment_links for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'psi_completeness_requirements' and policyname = 'psi_completeness_requirements_service_role_all') then
    create policy "psi_completeness_requirements_service_role_all" on public.psi_completeness_requirements for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'psi_completeness_evaluations' and policyname = 'psi_completeness_evaluations_service_role_all') then
    create policy "psi_completeness_evaluations_service_role_all" on public.psi_completeness_evaluations for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'psi_unit_linked_records' and policyname = 'psi_unit_linked_records_service_role_all') then
    create policy "psi_unit_linked_records_service_role_all" on public.psi_unit_linked_records for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'psi_unit_document_links' and policyname = 'psi_unit_document_links_service_role_all') then
    create policy "psi_unit_document_links_service_role_all" on public.psi_unit_document_links for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'psi_history_events' and policyname = 'psi_history_events_service_role_all') then
    create policy "psi_history_events_service_role_all" on public.psi_history_events for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'psi_review_records' and policyname = 'psi_review_records_service_role_all') then
    create policy "psi_review_records_service_role_all" on public.psi_review_records for all to service_role using (true) with check (true);
  end if;
end $$;

create index if not exists psi_units_company_site_idx on public.psi_units(company_id, site_id);
create index if not exists psi_units_psi_status_idx on public.psi_units(psi_status);
create index if not exists psi_units_completeness_status_idx on public.psi_units(completeness_status);
create index if not exists psi_units_next_review_due_idx on public.psi_units(next_review_due);
create index if not exists psi_unit_equipment_links_equipment_idx on public.psi_unit_equipment_links(equipment_id);
create index if not exists psi_completeness_evaluations_unit_status_severity_idx on public.psi_completeness_evaluations(unit_id, status, severity);
create index if not exists psi_history_events_unit_created_idx on public.psi_history_events(unit_id, created_at desc);
create index if not exists psi_unit_linked_records_unit_idx on public.psi_unit_linked_records(unit_id, linked_module);
create index if not exists psi_unit_document_links_unit_idx on public.psi_unit_document_links(unit_id, document_type);
create index if not exists psi_review_records_unit_status_idx on public.psi_review_records(unit_id, status);

insert into public.psi_completeness_requirements (
  id, company_id, site_id, requirement_name, category, scope_type, severity, readiness_impact, pssr_blocker_if_missing, action_required_if_missing, active
)
select gen_random_uuid()::text, t.id, null, req.requirement_name, req.category, 'unit', req.severity, req.readiness_impact, req.pssr_blocker_if_missing, req.action_required_if_missing, true
from public."Tenant" t
cross join (values
  ('Chemical hazards / SDS', 'Chemical hazards / SDS', 'High', 'PSSR and HAZOP readiness', true, true),
  ('Process chemistry basis', 'Process chemistry', 'High', 'HAZOP and operating envelope readiness', true, true),
  ('Safe operating limits', 'Safe operating limits', 'High', 'Operating readiness', true, true),
  ('Consequences of deviation', 'Consequences of deviation', 'High', 'Risk assessment readiness', true, true),
  ('Maximum intended inventory', 'Maximum intended inventory', 'Medium', 'Emergency planning readiness', false, true),
  ('PFD / P&ID linked', 'PFD / P&ID', 'High', 'Document readiness', true, true),
  ('Equipment design basis', 'Equipment design basis', 'High', 'Mechanical integrity readiness', true, true),
  ('Relief system design basis', 'Relief system design basis', 'High', 'Relief and PSSR readiness', true, true),
  ('Electrical classification', 'Electrical classification', 'Medium', 'Ignition control readiness', false, true),
  ('Material compatibility', 'Material compatibility', 'Medium', 'Integrity readiness', false, true),
  ('Safeguards / controls basis', 'Safeguards / controls', 'High', 'LOPA and safeguard readiness', true, true),
  ('SOP / operating procedures', 'SOP / operating procedures', 'Medium', 'Operations readiness', false, true),
  ('Emergency response info', 'Emergency response info', 'Medium', 'Emergency response readiness', false, true),
  ('Required approvals', 'Required approvals', 'High', 'Review readiness', true, true),
  ('Required documents', 'Required documents', 'High', 'Document readiness', true, true)
) as req(requirement_name, category, severity, readiness_impact, pssr_blocker_if_missing, action_required_if_missing)
where not exists (
  select 1 from public.psi_completeness_requirements existing
  where existing.company_id = t.id
    and existing.site_id is null
    and existing.category = req.category
    and existing.requirement_name = req.requirement_name
);

insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
select gen_random_uuid()::text, t.id, p.key, 'psi', p.label
from public."Tenant" t
cross join (values
  ('psi.view', 'View PSI'),
  ('psi.dashboard.view', 'View PSI Dashboard'),
  ('psi.unit.view', 'View PSI Units'),
  ('psi.unit.create', 'Create PSI Unit'),
  ('psi.unit.edit', 'Edit PSI Unit'),
  ('psi.unit.archive', 'Archive PSI Unit'),
  ('psi.unit.submit_review', 'Submit PSI Unit For Review'),
  ('psi.unit.approve', 'Approve PSI Unit'),
  ('psi.unit.reject', 'Reject PSI Unit'),
  ('psi.completeness.view', 'View PSI Completeness'),
  ('psi.completeness.run', 'Run PSI Completeness Check'),
  ('psi.completeness.manage_requirements', 'Manage PSI Completeness Requirements'),
  ('psi.linked_record.view', 'View PSI Linked Records'),
  ('psi.linked_record.create', 'Create PSI Linked Record'),
  ('psi.linked_record.remove', 'Remove PSI Linked Record'),
  ('psi.document.view', 'View PSI Documents'),
  ('psi.document.link', 'Link PSI Document'),
  ('psi.document.remove', 'Remove PSI Document'),
  ('psi.change_history.view', 'View PSI Change History'),
  ('psi.export', 'Export PSI')
) as p(key, label)
where not exists (
  select 1 from public."Permission" existing
  where existing."tenantId" = t.id and existing."key" = p.key
);
