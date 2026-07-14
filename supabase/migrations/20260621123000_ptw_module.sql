create table if not exists permit_types (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  code text not null,
  name text not null,
  color text not null default '#3b82f6',
  description text,
  requires_gas_test boolean not null default false,
  requires_isolation boolean not null default false,
  requires_rescue_plan boolean not null default false,
  requires_fire_watch boolean not null default false,
  default_duration_hours integer not null default 12,
  type_specific_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, code)
);

create table if not exists permits (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  unit_id text references "Unit"(id) on delete set null,
  area_id text references "Area"(id) on delete set null,
  permit_number text not null,
  permit_type_id text references permit_types(id) on delete restrict,
  permit_type text not null,
  title text not null,
  work_description text not null,
  status text not null default 'Draft',
  risk_level text not null default 'Medium',
  equipment_id text references "Equipment"(id) on delete set null,
  equipment_tag text,
  equipment_name text,
  location text,
  job_area text,
  issuer_id text references "User"(id) on delete set null,
  holder_id text references "User"(id) on delete set null,
  area_authority_id text references "User"(id) on delete set null,
  contractor_company_id text references "ContractorCompany"(id) on delete set null,
  planned_start_at timestamptz not null,
  planned_end_at timestamptz not null,
  issued_at timestamptz,
  activated_at timestamptz,
  suspended_at timestamptz,
  closed_at timestamptz,
  cancelled_at timestamptz,
  gps_latitude numeric,
  gps_longitude numeric,
  required_controls jsonb not null default '{}'::jsonb,
  type_specific_data jsonb not null default '{}'::jsonb,
  workflow_instance_id text,
  template_id text,
  extension_count integer not null default 0,
  max_personnel integer,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(site_id, permit_number)
);

create table if not exists permit_equipment (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  equipment_id text not null references "Equipment"(id) on delete cascade,
  relation_type text not null default 'Primary',
  risk_context jsonb not null default '{}'::jsonb,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(permit_id, equipment_id, relation_type)
);

create table if not exists permit_isolations (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  energy_type text not null,
  source_description text not null,
  isolation_point text not null,
  valve_tag text,
  required_position text,
  normal_position text,
  lock_number text,
  lock_holder text,
  applied_by text references "User"(id) on delete set null,
  verified_by text references "User"(id) on delete set null,
  confirmed_by text references "User"(id) on delete set null,
  confirmed_at timestamptz,
  deisolated_by text references "User"(id) on delete set null,
  deisolated_at timestamptz,
  status text not null default 'Pending',
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists permit_gas_tests (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  tested_at timestamptz not null default now(),
  tester_id text references "User"(id) on delete set null,
  instrument_id text,
  calibration_due_date date,
  o2 numeric,
  lel numeric,
  h2s numeric,
  co numeric,
  custom_gases jsonb not null default '{}'::jsonb,
  gps_latitude numeric,
  gps_longitude numeric,
  permit_status_at_test text,
  result text not null default 'Pass',
  next_test_due_at timestamptz,
  notes text,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists permit_conflicts (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  conflicting_permit_id text references permits(id) on delete cascade,
  conflict_type text not null,
  severity text not null default 'High',
  description text not null,
  status text not null default 'Open',
  override_reason text,
  overridden_by text references "User"(id) on delete set null,
  overridden_at timestamptz,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists permit_workforce (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  worker_name text not null,
  company text,
  contractor_company_id text references "ContractorCompany"(id) on delete set null,
  trade text,
  role text,
  phone text,
  badge_id text,
  signed_briefing boolean not null default false,
  time_in timestamptz,
  time_out timestamptz,
  signature text,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists permit_handover (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  outgoing_shift text not null,
  incoming_shift text not null,
  outgoing_supervisor_id text references "User"(id) on delete set null,
  incoming_supervisor_id text references "User"(id) on delete set null,
  checklist jsonb not null default '{}'::jsonb,
  acknowledgement text,
  acknowledged_at timestamptz,
  gps_latitude numeric,
  gps_longitude numeric,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists permit_attachments (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  title text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  storage_key text not null,
  uploaded_by text references "User"(id) on delete set null,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists permit_history (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  event_type text not null,
  title text not null,
  description text,
  actor_id text references "User"(id) on delete set null,
  before_data jsonb,
  after_data jsonb,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists permit_signatures (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  signature_type text not null,
  signed_by text references "User"(id) on delete set null,
  role_name text,
  signature text,
  ip_address text,
  gps_latitude numeric,
  gps_longitude numeric,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists permit_extensions (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  old_expiry_at timestamptz not null,
  new_expiry_at timestamptz not null,
  reason text not null,
  approved_by text references "User"(id) on delete set null,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists permit_templates (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text references "Site"(id) on delete cascade,
  permit_type text not null,
  name text not null,
  description text,
  template_data jsonb not null default '{}'::jsonb,
  equipment_id text references "Equipment"(id) on delete set null,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists permit_closure_checklists (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  items jsonb not null default '{}'::jsonb,
  completed_by text references "User"(id) on delete set null,
  completed_at timestamptz,
  verifier_id text references "User"(id) on delete set null,
  verification_notes text,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(permit_id)
);

create table if not exists permit_map_locations (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  permit_id text references permits(id) on delete cascade,
  unit_id text references "Unit"(id) on delete set null,
  area_id text references "Area"(id) on delete set null,
  label text not null,
  x numeric not null default 0,
  y numeric not null default 0,
  radius_m numeric,
  status text not null default 'Active',
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists permit_gas_thresholds (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text references "Site"(id) on delete cascade,
  permit_type text,
  area_id text references "Area"(id) on delete cascade,
  fluid_service text,
  gas_key text not null,
  min_value numeric,
  max_value numeric,
  units text not null,
  policy text,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists permit_incompatible_matrix (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text references "Site"(id) on delete cascade,
  permit_type_a text not null,
  permit_type_b text not null,
  scope text not null default 'Area',
  severity text not null default 'High',
  rule text not null,
  override_allowed boolean not null default true,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, site_id, permit_type_a, permit_type_b, scope)
);

create index if not exists permits_scope_status_idx on permits(tenant_id, site_id, status, planned_end_at);
create index if not exists permits_equipment_idx on permits(tenant_id, equipment_id, status);
create index if not exists permits_type_idx on permits(tenant_id, permit_type, status);
create index if not exists permit_isolations_permit_idx on permit_isolations(permit_id, status);
create index if not exists permit_gas_tests_permit_idx on permit_gas_tests(permit_id, tested_at desc);
create index if not exists permit_conflicts_permit_idx on permit_conflicts(permit_id, status);
create index if not exists permit_workforce_permit_idx on permit_workforce(permit_id, time_out);
create index if not exists permit_history_permit_idx on permit_history(permit_id, created_at desc);

alter table permit_types enable row level security;
alter table permits enable row level security;
alter table permit_equipment enable row level security;
alter table permit_isolations enable row level security;
alter table permit_gas_tests enable row level security;
alter table permit_conflicts enable row level security;
alter table permit_workforce enable row level security;
alter table permit_handover enable row level security;
alter table permit_attachments enable row level security;
alter table permit_history enable row level security;
alter table permit_signatures enable row level security;
alter table permit_extensions enable row level security;
alter table permit_templates enable row level security;
alter table permit_closure_checklists enable row level security;
alter table permit_map_locations enable row level security;
alter table permit_gas_thresholds enable row level security;
alter table permit_incompatible_matrix enable row level security;

insert into "Permission" (id, "tenantId", key, "moduleKey", label)
values
  ('perm_ptw_view', 'tenant_alkylation', 'ptw.view', 'ptw', 'View PTW'),
  ('perm_ptw_create', 'tenant_alkylation', 'ptw.create', 'ptw', 'Create PTW'),
  ('perm_ptw_edit', 'tenant_alkylation', 'ptw.edit', 'ptw', 'Edit PTW'),
  ('perm_ptw_submit', 'tenant_alkylation', 'ptw.submit', 'ptw', 'Submit PTW'),
  ('perm_ptw_approve', 'tenant_alkylation', 'ptw.approve', 'ptw', 'Approve PTW'),
  ('perm_ptw_issue', 'tenant_alkylation', 'ptw.issue', 'ptw', 'Issue PTW'),
  ('perm_ptw_activate', 'tenant_alkylation', 'ptw.activate', 'ptw', 'Activate PTW'),
  ('perm_ptw_suspend', 'tenant_alkylation', 'ptw.suspend', 'ptw', 'Suspend PTW'),
  ('perm_ptw_extend', 'tenant_alkylation', 'ptw.extend', 'ptw', 'Extend PTW'),
  ('perm_ptw_close', 'tenant_alkylation', 'ptw.close', 'ptw', 'Close PTW'),
  ('perm_ptw_cancel', 'tenant_alkylation', 'ptw.cancel', 'ptw', 'Cancel PTW'),
  ('perm_ptw_gas_test_add', 'tenant_alkylation', 'ptw.gas_test.add', 'ptw', 'Add PTW Gas Test'),
  ('perm_ptw_isolation_confirm', 'tenant_alkylation', 'ptw.isolation.confirm', 'ptw', 'Confirm PTW Isolation'),
  ('perm_ptw_deisolation_confirm', 'tenant_alkylation', 'ptw.deisolation.confirm', 'ptw', 'Confirm PTW De-Isolation'),
  ('perm_ptw_conflict_override', 'tenant_alkylation', 'ptw.conflict.override', 'ptw', 'Override PTW Conflict'),
  ('perm_ptw_handover', 'tenant_alkylation', 'ptw.handover', 'ptw', 'PTW Handover'),
  ('perm_ptw_sign', 'tenant_alkylation', 'ptw.sign', 'ptw', 'Sign PTW'),
  ('perm_ptw_workforce_manage', 'tenant_alkylation', 'ptw.workforce.manage', 'ptw', 'Manage PTW Workforce'),
  ('perm_ptw_template_manage', 'tenant_alkylation', 'ptw.template.manage', 'ptw', 'Manage PTW Templates'),
  ('perm_ptw_export', 'tenant_alkylation', 'ptw.export', 'ptw', 'Export PTW')
on conflict (id) do update set key = excluded.key, label = excluded.label;

insert into "RolePermission" ("roleId", "permissionId")
select r.id, p.id
from "Role" r
cross join "Permission" p
where r.id in ('role_platform_admin', 'role_corporate_admin', 'role_site_admin', 'role_hse_manager', 'role_permit_issuer', 'role_operations_supervisor', 'role_plant_manager')
  and p.id like 'perm_ptw_%'
on conflict do nothing;

insert into permit_types (id, tenant_id, code, name, color, description, requires_gas_test, requires_isolation, requires_rescue_plan, requires_fire_watch, default_duration_hours, type_specific_fields)
values
  ('pt_hot_work', 'tenant_alkylation', 'HOT_WORK', 'Hot Work', '#ef4444', 'Welding, grinding, cutting, or ignition source work.', true, false, false, true, 12, '{"fireWatch":true,"lelPolicy":"0% default, <5% controlled override"}'),
  ('pt_cold_work', 'tenant_alkylation', 'COLD_WORK', 'Cold Work', '#06b6d4', 'Mechanical maintenance and non-intrusive work.', false, false, false, false, 12, '{}'),
  ('pt_confined_space', 'tenant_alkylation', 'CONFINED_SPACE', 'Confined Space', '#10b981', 'Atmospheric testing, rescue plan, entrant and attendant control.', true, false, true, false, 8, '{"entrantLog":true,"attendant":true,"rescueEquipment":true}'),
  ('pt_electrical_isolation', 'tenant_alkylation', 'ELECTRICAL_ISOLATION', 'Electrical Isolation / LOTO', '#f59e0b', 'Lockout/tagout register and electrical isolation verification.', false, true, false, false, 12, '{"lotoRegister":true}'),
  ('pt_excavation', 'tenant_alkylation', 'EXCAVATION', 'Excavation', '#f97316', 'Buried services, depth, barricade, and clearance controls.', false, false, false, false, 12, '{"buriedServicesCheck":true,"depthRequired":true}'),
  ('pt_radiography', 'tenant_alkylation', 'RADIOGRAPHY', 'Radiography', '#8b5cf6', 'Exclusion zones, monitoring, warning signs, and access control.', false, false, false, false, 8, '{"exclusionZone":true,"radiationMonitor":true}'),
  ('pt_working_at_height', 'tenant_alkylation', 'WORKING_AT_HEIGHT', 'Working at Height', '#3b82f6', 'Fall protection and rescue plan verification.', false, false, true, false, 12, '{"fallProtection":true,"rescueMethod":true}'),
  ('pt_line_breaking', 'tenant_alkylation', 'LINE_BREAKING', 'Line Breaking / Equipment Opening', '#eab308', 'Depressurisation, purge, contamination, and residual energy confirmation.', true, true, false, false, 8, '{"drainDown":true,"flushPurge":true}'),
  ('pt_simops', 'tenant_alkylation', 'SIMOPS', 'Simultaneous Operations / SIMOPS', '#64748b', 'SIMOPS review and conflict resolution.', false, false, false, false, 12, '{"simopsReview":true}')
on conflict (id) do update set name = excluded.name, color = excluded.color, updated_at = now();

insert into permit_gas_thresholds (id, tenant_id, company_id, site_id, permit_type, gas_key, min_value, max_value, units, policy)
values
  ('ptw_thr_hot_o2', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'HOT_WORK', 'O2', 19.5, 23.5, '%', 'Default safe oxygen range'),
  ('ptw_thr_hot_lel', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'HOT_WORK', 'LEL', 0, 0, '%', 'Strict hot work 0% LEL policy; controlled site override required for <5%'),
  ('ptw_thr_conf_lel', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'CONFINED_SPACE', 'LEL', null, 10, '%', 'Confined space default LEL threshold'),
  ('ptw_thr_h2s', 'tenant_alkylation', 'company_alkylation', 'site_jubail', null, 'H2S', null, 1, 'ppm', 'TLV guidance 1 ppm; IDLH 50 ppm reference'),
  ('ptw_thr_co', 'tenant_alkylation', 'company_alkylation', 'site_jubail', null, 'CO', null, 25, 'ppm', 'TLV guidance 25 ppm; IDLH 1200 ppm reference')
on conflict (id) do update set max_value = excluded.max_value, policy = excluded.policy, updated_at = now();

insert into permit_incompatible_matrix (id, tenant_id, company_id, site_id, permit_type_a, permit_type_b, scope, severity, rule, override_allowed)
values
  ('ptw_matrix_hot_confined_area', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'HOT_WORK', 'CONFINED_SPACE', 'Area', 'Critical', 'Hot work and confined space in same area require SIMOPS review.', true),
  ('ptw_matrix_hot_line_unit', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'HOT_WORK', 'LINE_BREAKING', 'Unit', 'Critical', 'Hot work and line breaking in same unit are blocked without Area Authority override.', true),
  ('ptw_matrix_radiography_area', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'RADIOGRAPHY', 'COLD_WORK', 'Area', 'High', 'Radiography exclusion zone conflicts with personnel work.', true)
on conflict (id) do update set rule = excluded.rule, updated_at = now();
