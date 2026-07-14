alter table permit_gas_tests
  add column if not exists test_type text not null default 'Initial',
  add column if not exists test_location text,
  add column if not exists tester_user_id text references "User"(id) on delete set null,
  add column if not exists tester_name text,
  add column if not exists instrument_serial_number text,
  add column if not exists calibration_date date,
  add column if not exists calibration_expiry_date date,
  add column if not exists ventilation_status text,
  add column if not exists weather_condition text,
  add column if not exists result_status text,
  add column if not exists next_retest_due_at timestamptz,
  add column if not exists retest_status text not null default 'Not Due',
  add column if not exists validation_details jsonb not null default '{}'::jsonb;

update permit_gas_tests
set
  tester_user_id = coalesce(tester_user_id, tester_id),
  calibration_expiry_date = coalesce(calibration_expiry_date, calibration_due_date),
  result_status = coalesce(result_status, result),
  next_retest_due_at = coalesce(next_retest_due_at, next_test_due_at),
  test_location = coalesce(test_location, 'Permit work area')
where true;

create table if not exists permit_gas_readings (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  gas_test_id text not null references permit_gas_tests(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  gas_code text not null,
  gas_name text not null,
  value numeric,
  unit text not null,
  min_limit numeric,
  max_limit numeric,
  pass_fail text not null default 'Pass',
  threshold_source text,
  created_at timestamptz not null default now()
);

create table if not exists permit_gas_test_history (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  gas_test_id text references permit_gas_tests(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  event_type text not null,
  description text not null,
  user_id text references "User"(id) on delete set null,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);

alter table permit_gas_thresholds
  add column if not exists gas_code text,
  add column if not exists gas_name text,
  add column if not exists unit text,
  add column if not exists min_limit numeric,
  add column if not exists max_limit numeric,
  add column if not exists alert_limit numeric,
  add column if not exists action_limit numeric,
  add column if not exists area_classification text,
  add column if not exists retest_interval_minutes integer not null default 120,
  add column if not exists auto_suspend_on_fail boolean not null default true,
  add column if not exists auto_suspend_on_overdue boolean not null default true,
  add column if not exists is_active boolean not null default true;

update permit_gas_thresholds
set
  gas_code = coalesce(gas_code, gas_key),
  gas_name = coalesce(gas_name, gas_key),
  unit = coalesce(unit, units),
  min_limit = coalesce(min_limit, min_value),
  max_limit = coalesce(max_limit, max_value)
where true;

alter table permit_gas_readings enable row level security;
alter table permit_gas_test_history enable row level security;

drop policy if exists "permit_gas_readings_service_role_all" on permit_gas_readings;
create policy "permit_gas_readings_service_role_all" on permit_gas_readings
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "permit_gas_test_history_service_role_all" on permit_gas_test_history;
create policy "permit_gas_test_history_service_role_all" on permit_gas_test_history
  for all
  to service_role
  using (true)
  with check (true);

create index if not exists permit_gas_readings_test_idx on permit_gas_readings(gas_test_id, gas_code);
create index if not exists permit_gas_readings_permit_idx on permit_gas_readings(permit_id, gas_code, created_at desc);
create index if not exists permit_gas_history_permit_idx on permit_gas_test_history(permit_id, created_at desc);
create index if not exists permit_gas_thresholds_lookup_idx on permit_gas_thresholds(tenant_id, site_id, permit_type, gas_code, is_active);

insert into "Permission" (id, "tenantId", key, "moduleKey", label)
values
  ('perm_ptw_gas_test_view', 'tenant_alkylation', 'ptw.gas_test.view', 'ptw', 'View PTW Gas Tests'),
  ('perm_ptw_gas_test_edit', 'tenant_alkylation', 'ptw.gas_test.edit', 'ptw', 'Edit PTW Gas Tests'),
  ('perm_ptw_gas_test_delete', 'tenant_alkylation', 'ptw.gas_test.delete', 'ptw', 'Delete PTW Gas Tests'),
  ('perm_ptw_gas_test_validate', 'tenant_alkylation', 'ptw.gas_test.validate', 'ptw', 'Validate PTW Gas Tests'),
  ('perm_ptw_gas_thresholds_manage', 'tenant_alkylation', 'ptw.gas_thresholds.manage', 'ptw', 'Manage PTW Gas Thresholds')
on conflict (id) do update set key = excluded.key, label = excluded.label;

insert into "RolePermission" ("roleId", "permissionId")
select r.id, p.id
from "Role" r
cross join "Permission" p
where r.id in ('role_platform_admin', 'role_corporate_admin', 'role_site_admin', 'role_hse_manager', 'role_permit_issuer', 'role_operations_supervisor', 'role_plant_manager')
  and p.id in ('perm_ptw_gas_test_view', 'perm_ptw_gas_test_add', 'perm_ptw_gas_test_edit', 'perm_ptw_gas_test_delete', 'perm_ptw_gas_test_validate', 'perm_ptw_gas_thresholds_manage')
on conflict do nothing;

insert into permit_gas_thresholds (id, tenant_id, company_id, site_id, permit_type, gas_key, gas_code, gas_name, units, unit, min_value, max_value, min_limit, max_limit, alert_limit, action_limit, retest_interval_minutes, auto_suspend_on_fail, auto_suspend_on_overdue, is_active, policy)
values
  ('ptw_thr_base_o2', 'tenant_alkylation', 'company_alkylation', 'site_jubail', null, 'O2', 'O2', 'Oxygen', '%', '%', 19.5, 23.5, 19.5, 23.5, null, null, 120, true, true, true, 'Valid oxygen range 19.5% to 23.5%.'),
  ('ptw_thr_base_h2s', 'tenant_alkylation', 'company_alkylation', 'site_jubail', null, 'H2S', 'H2S', 'Hydrogen Sulfide', 'ppm', 'ppm', null, 1, null, 1, 1, 50, 120, true, true, true, 'Default alert 1 ppm; IDLH reference 50 ppm.'),
  ('ptw_thr_base_co', 'tenant_alkylation', 'company_alkylation', 'site_jubail', null, 'CO', 'CO', 'Carbon Monoxide', 'ppm', 'ppm', null, 25, null, 25, 25, 1200, 120, true, true, true, 'Default alert 25 ppm; IDLH reference 1200 ppm.'),
  ('ptw_thr_base_so2', 'tenant_alkylation', 'company_alkylation', 'site_jubail', null, 'SO2', 'SO2', 'Sulfur Dioxide', 'ppm', 'ppm', null, 2, null, 2, 2, null, 120, true, true, true, 'Site configurable sulfur dioxide threshold.'),
  ('ptw_thr_base_cl2', 'tenant_alkylation', 'company_alkylation', 'site_jubail', null, 'CL2', 'Cl2', 'Chlorine', 'ppm', 'ppm', null, 0.5, null, 0.5, 0.5, null, 120, true, true, true, 'Site configurable chlorine threshold.'),
  ('ptw_thr_base_nh3', 'tenant_alkylation', 'company_alkylation', 'site_jubail', null, 'NH3', 'NH3', 'Ammonia', 'ppm', 'ppm', null, 25, null, 25, 25, null, 120, true, true, true, 'Site configurable ammonia threshold.'),
  ('ptw_thr_base_hf', 'tenant_alkylation', 'company_alkylation', 'site_jubail', null, 'HF', 'HF', 'Hydrogen Fluoride', 'ppm', 'ppm', null, 3, null, 3, 3, null, 120, true, true, true, 'Site configurable hydrogen fluoride threshold.'),
  ('ptw_thr_hot_lel_rich', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'HOT_WORK', 'LEL', 'LEL', 'Lower Explosive Limit', '%', '%', 0, 0, 0, 0, 0, 5, 120, true, true, true, 'Hot work default is 0% LEL unless site policy allows controlled <5% override.'),
  ('ptw_thr_confined_lel_rich', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'CONFINED_SPACE', 'LEL', 'LEL', 'Lower Explosive Limit', '%', '%', null, 10, null, 10, 10, null, 60, true, true, true, 'Confined space default LEL threshold <10%.'),
  ('ptw_thr_line_lel_rich', 'tenant_alkylation', 'company_alkylation', 'site_jubail', 'LINE_BREAKING', 'LEL', 'LEL', 'Lower Explosive Limit', '%', '%', null, 10, null, 10, 10, null, 60, true, true, true, 'Line breaking hazardous service default LEL threshold <10%.')
on conflict (id) do update set
  gas_code = excluded.gas_code,
  gas_name = excluded.gas_name,
  unit = excluded.unit,
  units = excluded.units,
  min_value = excluded.min_value,
  max_value = excluded.max_value,
  min_limit = excluded.min_limit,
  max_limit = excluded.max_limit,
  alert_limit = excluded.alert_limit,
  action_limit = excluded.action_limit,
  retest_interval_minutes = excluded.retest_interval_minutes,
  auto_suspend_on_fail = excluded.auto_suspend_on_fail,
  auto_suspend_on_overdue = excluded.auto_suspend_on_overdue,
  is_active = excluded.is_active,
  policy = excluded.policy,
  updated_at = now();
