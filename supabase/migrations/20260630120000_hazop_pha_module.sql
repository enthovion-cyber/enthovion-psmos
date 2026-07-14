create table if not exists public.hazop_studies (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  company_id text,
  site_id text,
  unit_id text,
  area_id text,
  study_number text not null,
  title text not null,
  description text,
  study_type text not null default 'HAZOP',
  status text not null default 'Draft',
  study_leader_id text,
  facilitator_id text,
  scribe_id text,
  risk_matrix_id text,
  target_start_date date,
  target_completion_date date,
  actual_start_date timestamptz,
  actual_completion_date timestamptz,
  scope_summary text,
  exclusions text,
  linked_moc_id text,
  linked_pssr_id text,
  revalidation_due_date date,
  progress_percent integer not null default 0,
  lopa_required boolean not null default false,
  approved_at timestamptz,
  approved_by text,
  closed_at timestamptz,
  closed_by text,
  cancelled_at timestamptz,
  cancelled_by text,
  cancellation_reason text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, study_number)
);

create table if not exists public.hazop_study_settings (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  guideword_set text not null default 'Standard HAZOP',
  risk_method text not null default '5x5 Matrix',
  require_recommendation_for_high boolean not null default true,
  require_acceptance_for_no_action boolean not null default true,
  lopa_trigger_policy jsonb not null default '{"critical":true,"high_safety_critical":true}'::jsonb,
  session_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (study_id)
);

create table if not exists public.hazop_study_team_members (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  user_id text,
  name text not null,
  role text not null,
  discipline text,
  required boolean not null default false,
  attendance_status text not null default 'Invited',
  added_by text,
  added_at timestamptz not null default now()
);

create table if not exists public.hazop_study_sessions (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  session_number integer not null default 1,
  title text not null,
  planned_start timestamptz,
  planned_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  status text not null default 'Planned',
  notes text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.hazop_nodes (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  parent_node_id text references public.hazop_nodes(id) on delete set null,
  node_number text not null,
  title text not null,
  description text,
  design_intent text,
  equipment_ids jsonb not null default '[]'::jsonb,
  document_ids jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  status text not null default 'Draft',
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (study_id, node_number)
);

create table if not exists public.hazop_deviations (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  node_id text not null references public.hazop_nodes(id) on delete cascade,
  guideword text not null,
  parameter text not null,
  deviation text not null,
  design_intent text,
  sort_order integer not null default 0,
  status text not null default 'Open',
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hazop_scenarios (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  node_id text not null references public.hazop_nodes(id) on delete cascade,
  deviation_id text references public.hazop_deviations(id) on delete set null,
  scenario_number text not null,
  cause text not null,
  consequence text not null,
  existing_safeguards text,
  severity integer not null default 1,
  likelihood integer not null default 1,
  risk_score integer not null default 1,
  risk_level text not null default 'Low',
  residual_severity integer,
  residual_likelihood integer,
  residual_risk_score integer,
  residual_risk_level text,
  lopa_required boolean not null default false,
  recommendation_required boolean not null default false,
  acceptance_required boolean not null default false,
  status text not null default 'Open',
  owner_id text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (study_id, scenario_number)
);

create table if not exists public.hazop_causes (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  scenario_id text not null references public.hazop_scenarios(id) on delete cascade,
  description text not null,
  category text,
  created_at timestamptz not null default now()
);

create table if not exists public.hazop_consequences (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  scenario_id text not null references public.hazop_scenarios(id) on delete cascade,
  description text not null,
  impact_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.hazop_safeguards (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  scenario_id text not null references public.hazop_scenarios(id) on delete cascade,
  safeguard_type text not null default 'Existing',
  description text not null,
  ipl_credit boolean not null default false,
  effectiveness text,
  owner_id text,
  status text not null default 'Active',
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.hazop_recommendations (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  scenario_id text references public.hazop_scenarios(id) on delete cascade,
  recommendation_number text not null,
  title text not null,
  description text not null,
  priority text not null default 'Medium',
  owner_id text,
  due_date date,
  status text not null default 'Open',
  action_id text,
  evidence_summary text,
  closed_at timestamptz,
  closed_by text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (study_id, recommendation_number)
);

create table if not exists public.hazop_risk_assessments (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  scenario_id text not null references public.hazop_scenarios(id) on delete cascade,
  stage text not null default 'Initial',
  severity integer not null,
  likelihood integer not null,
  risk_score integer not null,
  risk_level text not null,
  rationale text,
  assessed_by text,
  assessed_at timestamptz not null default now()
);

create table if not exists public.hazop_linked_records (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  record_type text not null,
  record_id text not null,
  record_number text,
  title text,
  link_reason text,
  created_by text,
  created_at timestamptz not null default now(),
  unique (study_id, record_type, record_id)
);

create table if not exists public.hazop_attachments (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  file_name text not null,
  file_type text,
  file_size bigint,
  storage_path text,
  category text not null default 'General',
  description text,
  uploaded_by text,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.hazop_history_events (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  event_type text not null,
  title text not null,
  description text,
  actor_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.hazop_signoffs (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  study_id text not null references public.hazop_studies(id) on delete cascade,
  role text not null,
  required boolean not null default true,
  status text not null default 'Pending',
  assigned_user_id text,
  signed_by text,
  signed_at timestamptz,
  signature_id text,
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.hazop_guidewords (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  guideword text not null,
  description text,
  active boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists public.hazop_parameters (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  parameter text not null,
  description text,
  active boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists public.hazop_node_templates (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  name text not null,
  description text,
  nodes jsonb not null default '[]'::jsonb,
  active boolean not null default true
);

create table if not exists public.hazop_risk_matrices (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  name text not null,
  matrix_type text not null default '5x5',
  active boolean not null default true
);

create table if not exists public.hazop_risk_matrix_levels (
  id text primary key default gen_random_uuid()::text,
  matrix_id text not null references public.hazop_risk_matrices(id) on delete cascade,
  min_score integer not null,
  max_score integer not null,
  level text not null,
  color text not null,
  requires_recommendation boolean not null default false,
  requires_lopa boolean not null default false
);

create table if not exists public.hazop_lopa_trigger_rules (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  name text not null,
  risk_level text not null,
  safety_critical_only boolean not null default false,
  active boolean not null default true
);

create table if not exists public.hazop_revalidation_policies (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  study_type text not null,
  interval_months integer not null default 60,
  reminder_days integer not null default 180,
  active boolean not null default true
);

create index if not exists hazop_studies_tenant_site_status_idx on public.hazop_studies (tenant_id, site_id, status);
create index if not exists hazop_nodes_study_idx on public.hazop_nodes (study_id, sort_order);
create index if not exists hazop_scenarios_study_risk_idx on public.hazop_scenarios (study_id, risk_level, status);
create index if not exists hazop_recommendations_study_status_idx on public.hazop_recommendations (study_id, status);
create index if not exists hazop_history_study_created_idx on public.hazop_history_events (study_id, created_at desc);

alter table public.hazop_studies enable row level security;
alter table public.hazop_study_settings enable row level security;
alter table public.hazop_study_team_members enable row level security;
alter table public.hazop_study_sessions enable row level security;
alter table public.hazop_nodes enable row level security;
alter table public.hazop_deviations enable row level security;
alter table public.hazop_scenarios enable row level security;
alter table public.hazop_causes enable row level security;
alter table public.hazop_consequences enable row level security;
alter table public.hazop_safeguards enable row level security;
alter table public.hazop_recommendations enable row level security;
alter table public.hazop_risk_assessments enable row level security;
alter table public.hazop_linked_records enable row level security;
alter table public.hazop_attachments enable row level security;
alter table public.hazop_history_events enable row level security;
alter table public.hazop_signoffs enable row level security;
alter table public.hazop_guidewords enable row level security;
alter table public.hazop_parameters enable row level security;
alter table public.hazop_node_templates enable row level security;
alter table public.hazop_risk_matrices enable row level security;
alter table public.hazop_risk_matrix_levels enable row level security;
alter table public.hazop_lopa_trigger_rules enable row level security;
alter table public.hazop_revalidation_policies enable row level security;

grant select, insert, update, delete on all tables in schema public to authenticated;

insert into public.hazop_guidewords (guideword, description, sort_order)
select v.guideword, v.description, v.sort_order
from (values
  ('No', 'Complete absence of intended flow or action', 10),
  ('More', 'Quantitative increase above design intent', 20),
  ('Less', 'Quantitative decrease below design intent', 30),
  ('As Well As', 'Additional activity or material present', 40),
  ('Part Of', 'Only part of intended activity occurs', 50),
  ('Reverse', 'Opposite of intended direction or action', 60),
  ('Other Than', 'Substitution or different material/action', 70)
) as v(guideword, description, sort_order)
where not exists (select 1 from public.hazop_guidewords g where g.tenant_id is null and g.guideword = v.guideword);

insert into public.hazop_parameters (parameter, description, sort_order)
select v.parameter, v.description, v.sort_order
from (values
  ('Flow', 'Process flow rate or direction', 10),
  ('Pressure', 'Process pressure', 20),
  ('Temperature', 'Process temperature', 30),
  ('Level', 'Liquid or solids level', 40),
  ('Composition', 'Chemical composition or concentration', 50),
  ('Utilities', 'Steam, power, instrument air, cooling water', 60)
) as v(parameter, description, sort_order)
where not exists (select 1 from public.hazop_parameters p where p.tenant_id is null and p.parameter = v.parameter);

insert into public.hazop_risk_matrices (name, matrix_type)
select 'Standard 5x5 PSM Matrix', '5x5'
where not exists (select 1 from public.hazop_risk_matrices where tenant_id is null and name = 'Standard 5x5 PSM Matrix');

insert into public.hazop_risk_matrix_levels (matrix_id, min_score, max_score, level, color, requires_recommendation, requires_lopa)
select m.id, v.min_score, v.max_score, v.level, v.color, v.requires_recommendation, v.requires_lopa
from public.hazop_risk_matrices m
cross join (values
  (1, 4, 'Low', '#22c55e', false, false),
  (5, 9, 'Medium', '#f59e0b', false, false),
  (10, 16, 'High', '#f97316', true, false),
  (17, 25, 'Critical', '#ef4444', true, true)
) as v(min_score, max_score, level, color, requires_recommendation, requires_lopa)
where m.tenant_id is null and m.name = 'Standard 5x5 PSM Matrix'
  and not exists (select 1 from public.hazop_risk_matrix_levels l where l.matrix_id = m.id and l.level = v.level);

insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label", "action", "description")
select gen_random_uuid()::text, t."id", p.key, 'hazop', p.label, p.action, p.description
from public."Tenant" t
cross join (values
  ('hazop.dashboard.view', 'View HAZOP Dashboard', 'view', 'View HAZOP dashboard'),
  ('hazop.view', 'View HAZOP Studies', 'view', 'View HAZOP studies'),
  ('hazop.create', 'Create HAZOP Study', 'create', 'Create HAZOP/PHA studies'),
  ('hazop.edit', 'Edit HAZOP Study', 'edit', 'Edit open HAZOP/PHA studies'),
  ('hazop.delete', 'Delete HAZOP Study', 'delete', 'Delete draft HAZOP/PHA studies'),
  ('hazop.cancel', 'Cancel HAZOP Study', 'cancel', 'Cancel HAZOP/PHA studies'),
  ('hazop.close', 'Close HAZOP Study', 'close', 'Close approved HAZOP/PHA studies'),
  ('hazop.node.view', 'View HAZOP Nodes', 'view', 'View nodes and deviations'),
  ('hazop.node.create', 'Create HAZOP Nodes', 'create', 'Create nodes'),
  ('hazop.node.edit', 'Edit HAZOP Nodes', 'edit', 'Edit nodes'),
  ('hazop.node.delete', 'Delete HAZOP Nodes', 'delete', 'Delete nodes'),
  ('hazop.scenario.view', 'View HAZOP Scenarios', 'view', 'View scenarios'),
  ('hazop.scenario.create', 'Create HAZOP Scenarios', 'create', 'Create scenarios'),
  ('hazop.scenario.edit', 'Edit HAZOP Scenarios', 'edit', 'Edit scenarios and risk ranking'),
  ('hazop.scenario.delete', 'Delete HAZOP Scenarios', 'delete', 'Delete scenarios'),
  ('hazop.risk.edit', 'Edit HAZOP Risk', 'edit', 'Edit risk ranking'),
  ('hazop.recommendation.view', 'View HAZOP Recommendations', 'view', 'View recommendations'),
  ('hazop.recommendation.create', 'Create HAZOP Recommendations', 'create', 'Create recommendations'),
  ('hazop.recommendation.edit', 'Edit HAZOP Recommendations', 'edit', 'Edit recommendations'),
  ('hazop.recommendation.close', 'Close HAZOP Recommendations', 'close', 'Close recommendations'),
  ('hazop.action.create', 'Create Action From HAZOP', 'create', 'Create universal actions from HAZOP recommendations'),
  ('hazop.team.manage', 'Manage HAZOP Team', 'manage', 'Manage study team'),
  ('hazop.session.manage', 'Manage HAZOP Sessions', 'manage', 'Manage sessions'),
  ('hazop.sign', 'Sign HAZOP Study', 'sign', 'Sign HAZOP review or approval requirements'),
  ('hazop.approve', 'Approve HAZOP Study', 'approve', 'Approve HAZOP/PHA study'),
  ('hazop.attachments.upload', 'Upload HAZOP Attachments', 'upload', 'Upload HAZOP attachments'),
  ('hazop.attachments.download', 'Download HAZOP Attachments', 'download', 'Download HAZOP attachments'),
  ('hazop.export', 'Export HAZOP', 'export', 'Export HAZOP reports and registers'),
  ('hazop.config.manage', 'Manage HAZOP Config', 'manage', 'Manage guidewords, matrices, and templates')
) as p(key, label, action, description)
where not exists (select 1 from public."Permission" existing where existing."tenantId" = t."id" and existing."key" = p.key);

insert into public."RolePermission" ("roleId", "permissionId")
select r."id", p."id"
from public."Role" r
join public."Permission" p on p."tenantId" = r."tenantId"
where r."key" in ('platform_admin', 'corporate_admin', 'site_admin', 'super_admin', 'hse_manager', 'process_engineer')
  and p."moduleKey" = 'hazop'
on conflict do nothing;
