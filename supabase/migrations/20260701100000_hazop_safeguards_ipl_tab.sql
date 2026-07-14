create table if not exists public.hazop_scenario_safeguards (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  node_id text references public.hazop_nodes(id) on delete set null,
  scenario_id text not null references public.hazop_scenarios(id) on delete cascade,
  safeguard_number text not null,
  safeguard_name text not null,
  safeguard_type text not null,
  safeguard_category text,
  description text not null,
  existing_or_proposed text not null default 'Existing',
  credited_for_risk_reduction boolean not null default false,
  ipl_candidate boolean not null default false,
  ipl_validation_status text not null default 'Not validated',
  equipment_id text,
  document_id text,
  document_version_id text,
  owner_id text,
  proof_test_required boolean not null default false,
  inspection_required boolean not null default false,
  evidence_required boolean not null default false,
  proof_test_status text not null default 'Not Required',
  gap_status text not null default 'None',
  action_status text not null default 'None',
  safety_system_type text,
  sif_tag text,
  interlock_id text,
  cause_effect_reference text,
  trip_setpoint text,
  final_element text,
  sensor_transmitter text,
  logic_solver text,
  target_sil text,
  proof_test_interval text,
  status text not null default 'Active',
  notes text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hazop_ipl_validations (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  scenario_id text not null references public.hazop_scenarios(id) on delete cascade,
  safeguard_id text not null references public.hazop_scenario_safeguards(id) on delete cascade,
  validation_status text not null default 'Not validated',
  validation_summary text,
  validated_by text,
  validated_at timestamptz,
  failed_criteria_count integer not null default 0,
  passed_criteria_count integer not null default 0,
  lopa_required_triggered boolean not null default false,
  lopa_trigger_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hazop_ipl_validation_items (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  validation_id text not null references public.hazop_ipl_validations(id) on delete cascade,
  criterion_key text not null,
  criterion_label text not null,
  result text not null default 'Not Applicable',
  required boolean not null default true,
  comment text,
  evidence_attachment_id text,
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hazop_safeguard_equipment_links (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null,
  safeguard_id text not null references public.hazop_scenario_safeguards(id) on delete cascade,
  equipment_id text not null,
  link_type text not null default 'Protected equipment',
  created_at timestamptz not null default now()
);

create table if not exists public.hazop_safeguard_document_links (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null,
  safeguard_id text not null references public.hazop_scenario_safeguards(id) on delete cascade,
  document_id text not null,
  document_version_id text,
  document_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.hazop_safeguard_test_status (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null,
  safeguard_id text not null references public.hazop_scenario_safeguards(id) on delete cascade,
  proof_test_required boolean not null default false,
  inspection_required boolean not null default false,
  test_frequency text,
  last_test_date date,
  next_test_due_date date,
  status text not null default 'Not Required',
  evidence_attachment_id text,
  linked_mi_record_id text,
  owner_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hazop_safeguard_gaps (
  id text primary key,
  tenant_id text not null,
  company_id text,
  site_id text,
  study_id text not null,
  node_id text,
  scenario_id text not null,
  safeguard_id text references public.hazop_scenario_safeguards(id) on delete cascade,
  gap_type text not null,
  gap_description text not null,
  severity text not null default 'Medium',
  status text not null default 'Open',
  owner_id text,
  due_date date,
  linked_action_id text,
  created_by text,
  closed_by text,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hazop_scenarios add column if not exists safeguard_count integer not null default 0;
alter table public.hazop_scenarios add column if not exists credited_safeguard_count integer not null default 0;
alter table public.hazop_scenarios add column if not exists ipl_candidate_count integer not null default 0;
alter table public.hazop_scenarios add column if not exists safeguard_gap_count integer not null default 0;

create index if not exists hazop_scenario_safeguards_study_idx on public.hazop_scenario_safeguards (tenant_id, study_id, scenario_id);
create index if not exists hazop_scenario_safeguards_ipl_idx on public.hazop_scenario_safeguards (tenant_id, study_id, ipl_candidate, ipl_validation_status);
create index if not exists hazop_ipl_validations_safeguard_idx on public.hazop_ipl_validations (tenant_id, study_id, safeguard_id, created_at desc);
create index if not exists hazop_safeguard_gaps_study_idx on public.hazop_safeguard_gaps (tenant_id, study_id, status);
create index if not exists hazop_safeguard_test_status_due_idx on public.hazop_safeguard_test_status (tenant_id, study_id, status, next_test_due_date);

alter table public.hazop_scenario_safeguards enable row level security;
alter table public.hazop_ipl_validations enable row level security;
alter table public.hazop_ipl_validation_items enable row level security;
alter table public.hazop_safeguard_equipment_links enable row level security;
alter table public.hazop_safeguard_document_links enable row level security;
alter table public.hazop_safeguard_test_status enable row level security;
alter table public.hazop_safeguard_gaps enable row level security;

do $$
begin
  if to_regclass('public.permissions') is not null then
    insert into public.permissions (key, module, action, name)
    values
      ('hazop.safeguards.view', 'hazop', 'view', 'View HAZOP safeguards'),
      ('hazop.safeguards.create', 'hazop', 'create', 'Create HAZOP safeguards'),
      ('hazop.safeguards.edit', 'hazop', 'edit', 'Edit HAZOP safeguards'),
      ('hazop.safeguards.delete', 'hazop', 'delete', 'Delete HAZOP safeguards'),
      ('hazop.safeguards.mark_credited', 'hazop', 'edit', 'Mark HAZOP safeguards credited'),
      ('hazop.safeguards.mark_ipl', 'hazop', 'edit', 'Mark HAZOP IPL candidates'),
      ('hazop.ipl.view', 'hazop', 'view', 'View HAZOP IPL validation'),
      ('hazop.ipl.validate', 'hazop', 'edit', 'Validate HAZOP IPL checklist'),
      ('hazop.ipl.finalize', 'hazop', 'approve', 'Finalize HAZOP IPL validation'),
      ('hazop.safeguards.gap.create', 'hazop', 'create', 'Create HAZOP safeguard gaps'),
      ('hazop.safeguards.gap.close', 'hazop', 'close', 'Close HAZOP safeguard gaps'),
      ('hazop.safeguards.export', 'hazop', 'export', 'Export HAZOP safeguards')
    on conflict (key) do nothing;
  end if;
end $$;
