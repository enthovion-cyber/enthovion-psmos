-- Operating Procedures & Safe Work Practices (OSHA 29 CFR 1910.119(f)) - Phase 1 Foundation
-- Procedure register, configurable types/categories, scopes, numbering, settings, immutable history and access log.

create table if not exists public.op_procedure_types (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  type_code text not null,
  type_name text not null,
  phase_group text not null default 'Operating Phase',
  osha_reference text null,
  is_safe_work_practice boolean not null default false,
  is_psm_required boolean not null default false,
  default_review_frequency_months integer not null default 12,
  number_prefix text not null default 'SOP',
  sort_order integer not null default 100,
  active boolean not null default true,
  is_system boolean not null default false,
  created_by text null references public."User"(id) on delete set null,
  updated_by text null references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint op_procedure_types_code_unique unique (company_id, type_code)
);

create table if not exists public.op_procedure_categories (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  category_code text not null,
  category_name text not null,
  description text null,
  sort_order integer not null default 100,
  active boolean not null default true,
  created_by text null references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint op_procedure_categories_code_unique unique (company_id, category_code)
);

create table if not exists public.op_procedures (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  department_id text null,
  area_id text null,
  unit_id text null,
  equipment_id text null,
  procedure_number text not null,
  title text not null,
  purpose text null,
  scope_summary text null,
  procedure_type_id text null references public.op_procedure_types(id) on delete set null,
  procedure_type_code text not null,
  category_id text null references public.op_procedure_categories(id) on delete set null,
  operating_mode text null,
  criticality text not null default 'Medium',
  is_psm_covered boolean not null default true,
  is_safe_work_practice boolean not null default false,
  is_template boolean not null default false,
  is_temporary boolean not null default false,
  temporary_expires_at date null,
  procedure_status text not null default 'Draft',
  certification_status text not null default 'Not Due',
  current_revision_id text null,
  current_revision_label text null,
  effective_date date null,
  owner_user_id text null references public."User"(id) on delete set null,
  sme_user_ids text[] not null default '{}',
  approver_user_id text null references public."User"(id) on delete set null,
  review_frequency_months integer not null default 12,
  last_certified_at date null,
  next_certification_due date null,
  language text null default 'en',
  regulatory_basis text[] not null default '{}',
  tags text[] not null default '{}',
  linked_moc_count integer not null default 0,
  linked_psi_count integer not null default 0,
  open_change_flag_count integer not null default 0,
  locked boolean not null default false,
  locked_by text null references public."User"(id) on delete set null,
  locked_at timestamptz null,
  lock_reason text null,
  notes text null,
  created_by text null references public."User"(id) on delete set null,
  updated_by text null references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by text null references public."User"(id) on delete set null,
  archive_reason text null,
  constraint op_procedures_number_unique unique (company_id, procedure_number),
  constraint op_procedures_status_check check (procedure_status in ('Draft','In Review','Review Complete','Pending Approval','Approved','Published','Under Revision','Superseded','Withdrawn','Rejected','Archived')),
  constraint op_procedures_cert_check check (certification_status in ('Not Due','Upcoming','Due','Overdue','Certified','Certified With Changes','Expired')),
  constraint op_procedures_criticality_check check (criticality in ('High','Medium','Low')),
  constraint op_procedures_frequency_check check (review_frequency_months between 1 and 60)
);

create table if not exists public.op_procedure_scopes (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  procedure_id text not null references public.op_procedures(id) on delete cascade,
  scope_type text not null,
  scope_record_id text null,
  scope_label text null,
  linked_by text null references public."User"(id) on delete set null,
  linked_at timestamptz not null default now(),
  removed_by text null references public."User"(id) on delete set null,
  removed_at timestamptz null,
  remove_reason text null,
  constraint op_procedure_scopes_type_check check (scope_type in ('Site','Area','Unit','Equipment','Operating Mode','Shift','Role','Crew','Chemical','Process System'))
);

create table if not exists public.op_numbering_rules (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  prefix text not null,
  scope_key text not null default 'GLOBAL',
  padding integer not null default 4,
  next_sequence integer not null default 1,
  updated_at timestamptz not null default now(),
  constraint op_numbering_rules_unique unique (company_id, prefix, scope_key)
);

create table if not exists public.op_settings (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  default_review_frequency_months integer not null default 12,
  certification_grace_days integer not null default 0,
  reminder_days integer[] not null default '{60,30,7}',
  require_two_person_approval boolean not null default true,
  lock_on_publish boolean not null default true,
  require_moc_for_revision boolean not null default false,
  block_moc_closure_on_open_flags boolean not null default true,
  execution_ack_gate text not null default 'Warn',
  number_format text not null default '{PREFIX}-{UNIT}-{SEQ}',
  uncontrolled_print_watermark boolean not null default true,
  updated_by text null references public."User"(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint op_settings_company_site_unique unique (company_id, site_id),
  constraint op_settings_ack_gate_check check (execution_ack_gate in ('Off','Warn','Block'))
);

create table if not exists public.op_history_events (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  procedure_id text null references public.op_procedures(id) on delete set null,
  revision_id text null,
  event_type text not null,
  event_title text not null,
  event_description text null,
  before_value_json jsonb null,
  after_value_json jsonb null,
  actor_user_id text null references public."User"(id) on delete set null,
  source_module text not null default 'Operating Procedures',
  audit_log_id text null,
  created_at timestamptz not null default now()
);

create table if not exists public.op_access_logs (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  procedure_id text not null references public.op_procedures(id) on delete cascade,
  revision_id text null,
  user_id text null references public."User"(id) on delete set null,
  access_type text not null,
  channel text null,
  ip_address text null,
  user_agent text null,
  created_at timestamptz not null default now(),
  constraint op_access_logs_type_check check (access_type in ('View','Print','Download','Export','Execute'))
);

-- Indexes
create index if not exists idx_op_procedures_scope_status on public.op_procedures(company_id, site_id, procedure_status);
create index if not exists idx_op_procedures_unit on public.op_procedures(company_id, unit_id);
create index if not exists idx_op_procedures_area on public.op_procedures(company_id, area_id);
create index if not exists idx_op_procedures_type on public.op_procedures(company_id, procedure_type_code);
create index if not exists idx_op_procedures_cert on public.op_procedures(company_id, certification_status, next_certification_due);
create index if not exists idx_op_procedures_owner on public.op_procedures(owner_user_id);
create index if not exists idx_op_procedure_scopes_proc on public.op_procedure_scopes(procedure_id, scope_type, scope_record_id);
create index if not exists idx_op_history_proc on public.op_history_events(procedure_id, created_at desc);
create index if not exists idx_op_access_logs_proc on public.op_access_logs(procedure_id, created_at desc);
create index if not exists idx_op_access_logs_user on public.op_access_logs(user_id, created_at desc);

-- RLS (company + selected site isolation; API uses service role and enforces scope too)
create or replace function public.op_jwt_tenant_id()
returns text language plpgsql stable as $$
begin
  return coalesce(nullif(auth.jwt() ->> 'tenantId', ''), nullif(auth.jwt() ->> 'tenant_id', ''));
exception when others then
  return null;
end;
$$;

create or replace function public.op_jwt_site_id()
returns text language plpgsql stable as $$
begin
  return coalesce(nullif(auth.jwt() ->> 'selectedSiteId', ''), nullif(auth.jwt() ->> 'activeSiteId', ''));
exception when others then
  return null;
end;
$$;

create or replace function public.op_company_site_visible(row_company_id text, row_site_id text)
returns boolean language sql stable as $$
  select row_company_id = public.op_jwt_tenant_id()
    and (row_site_id is null or public.op_jwt_site_id() is null or row_site_id = public.op_jwt_site_id());
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'op_procedure_types','op_procedure_categories','op_procedures','op_procedure_scopes',
    'op_numbering_rules','op_settings','op_history_events','op_access_logs'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_select_company_site', table_name);
    execute format('create policy %I on public.%I for select using (public.op_company_site_visible(company_id, site_id))', table_name || '_select_company_site', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_company_site', table_name);
    execute format('create policy %I on public.%I for insert with check (public.op_company_site_visible(company_id, site_id))', table_name || '_insert_company_site', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_company_site', table_name);
    execute format('create policy %I on public.%I for update using (public.op_company_site_visible(company_id, site_id)) with check (public.op_company_site_visible(company_id, site_id))', table_name || '_update_company_site', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_company_site', table_name);
    execute format('create policy %I on public.%I for delete using (public.op_company_site_visible(company_id, site_id))', table_name || '_delete_company_site', table_name);
  end loop;
end $$;

-- Immutable history & access logs
create or replace function public.prevent_op_log_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'Operating procedure history and access logs are immutable';
end;
$$;

drop trigger if exists trg_op_history_no_update on public.op_history_events;
create trigger trg_op_history_no_update before update or delete on public.op_history_events
for each row execute function public.prevent_op_log_mutation();

drop trigger if exists trg_op_access_logs_no_update on public.op_access_logs;
create trigger trg_op_access_logs_no_update before update or delete on public.op_access_logs
for each row execute function public.prevent_op_log_mutation();

-- Seed system procedure types (1910.119(f)(1) + (f)(4)), categories, and permissions per tenant
do $$
declare
  tenant_row record;
  t record;
  permission_key text;
  permission_label text;
  permission_keys text[] := array[
    'op.view','op.dashboard.view','op.register.view',
    'op.procedure.view','op.procedure.create','op.procedure.edit','op.procedure.archive','op.procedure.reactivate',
    'op.procedure.lock','op.procedure.unlock','op.procedure.assign_owner',
    'op.scope.view','op.scope.manage',
    'op.revision.author','op.review.perform','op.approve','op.publish',
    'op.certify','op.certification.manage','op.annual_statement.sign',
    'op.execution.start','op.execution.perform','op.execution.witness','op.execution.release_hold','op.execution.review','op.execution.abort',
    'op.change_flag.manage','op.template.manage',
    'op.access_log.view','op.history.view','op.report.view','op.report.export',
    'op.settings.view','op.settings.edit'
  ];
begin
  for tenant_row in select id from public."Tenant" loop
    for t in select * from (values
      ('INITIAL_STARTUP','Initial Startup','Operating Phase','1910.119(f)(1)(i)(A)',false,true,'SOP',10),
      ('NORMAL_OPERATION','Normal Operation','Operating Phase','1910.119(f)(1)(i)(B)',false,true,'SOP',20),
      ('TEMPORARY_OPERATION','Temporary Operation','Operating Phase','1910.119(f)(1)(i)(C)',false,true,'TOP',30),
      ('EMERGENCY_SHUTDOWN','Emergency Shutdown','Operating Phase','1910.119(f)(1)(i)(D)',false,true,'ESD',40),
      ('EMERGENCY_OPERATION','Emergency Operation','Operating Phase','1910.119(f)(1)(i)(E)',false,true,'EOP',50),
      ('NORMAL_SHUTDOWN','Normal Shutdown','Operating Phase','1910.119(f)(1)(i)(F)',false,true,'SOP',60),
      ('STARTUP_AFTER_TURNAROUND','Startup After Turnaround / Emergency Shutdown','Operating Phase','1910.119(f)(1)(i)(G)',false,true,'SOP',70),
      ('OPERATING_LIMITS','Operating Limits & Deviation Response','Operating Limits','1910.119(f)(1)(ii)',false,true,'OLD',80),
      ('SAFETY_HEALTH','Safety & Health Considerations','Safety & Health','1910.119(f)(1)(iii)',false,true,'SHC',90),
      ('SAFETY_SYSTEMS','Safety Systems & Functions','Safety Systems','1910.119(f)(1)(iv)',false,true,'SSF',100),
      ('SWP_LOTO','Lockout / Tagout','Safe Work Practice','1910.119(f)(4); 1910.147',true,true,'SWP',110),
      ('SWP_CONFINED_SPACE','Confined Space Entry','Safe Work Practice','1910.119(f)(4); 1910.146',true,true,'SWP',120),
      ('SWP_LINE_BREAK','Opening Process Equipment / Line Breaking','Safe Work Practice','1910.119(f)(4)',true,true,'SWP',130),
      ('SWP_ENTRY_CONTROL','Control of Entrance (Maintenance, Contractor, Lab)','Safe Work Practice','1910.119(f)(4)',true,true,'SWP',140),
      ('SWP_HOT_WORK','Hot Work','Safe Work Practice','1910.119(k)',true,true,'SWP',150),
      ('SWP_EXCAVATION','Excavation','Safe Work Practice',null,true,false,'SWP',160),
      ('SWP_WORK_AT_HEIGHT','Working at Height','Safe Work Practice',null,true,false,'SWP',170),
      ('SWP_LIFTING','Lifting & Rigging','Safe Work Practice',null,true,false,'SWP',180),
      ('SWP_SIMOPS','Simultaneous Operations','Safe Work Practice',null,true,false,'SWP',190),
      ('MAINTENANCE','Maintenance Procedure','Other','1910.119(j)(2)',false,true,'MNT',200),
      ('LABORATORY','Laboratory / Sampling','Other',null,false,false,'LAB',210),
      ('LOADING_UNLOADING','Loading / Unloading','Other',null,false,false,'LUL',220),
      ('BATCH_RECIPE','Batch Recipe','Other',null,false,false,'BAT',230),
      ('JSA','Job Safety Analysis','Other',null,true,false,'JSA',240),
      ('WORK_INSTRUCTION','Work Instruction','Other',null,false,false,'WI',250),
      ('OPERATOR_ROUNDS','Operator Rounds','Other',null,false,false,'RND',260),
      ('STANDING_ORDER','Standing Order','Other',null,false,false,'STO',270)
    ) as v(code,name,grp,ref,swp,req,prefix,sort) loop
      insert into public.op_procedure_types (id, company_id, type_code, type_name, phase_group, osha_reference, is_safe_work_practice, is_psm_required, number_prefix, sort_order, is_system)
      values (gen_random_uuid()::text, tenant_row.id, t.code, t.name, t.grp, t.ref, t.swp, t.req, t.prefix, t.sort, true)
      on conflict (company_id, type_code) do nothing;
    end loop;

    insert into public.op_procedure_categories (id, company_id, category_code, category_name, sort_order)
    select gen_random_uuid()::text, tenant_row.id, c.code, c.name, c.sort
    from (values ('OPERATIONS','Operations',10),('MAINTENANCE','Maintenance',20),('SAFETY','Safety',30),('ENVIRONMENTAL','Environmental',40),('LABORATORY','Laboratory',50),('LOGISTICS','Logistics',60)) as c(code,name,sort)
    on conflict (company_id, category_code) do nothing;

    insert into public.op_settings (id, company_id, site_id)
    select gen_random_uuid()::text, tenant_row.id, null
    where not exists (select 1 from public.op_settings where company_id = tenant_row.id and site_id is null);

    foreach permission_key in array permission_keys loop
      permission_label := initcap(replace(replace(permission_key, 'op.', ''), '_', ' '));
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row.id, permission_key, 'operating_procedures', permission_label
      where not exists (select 1 from public."Permission" where "tenantId" = tenant_row.id and "key" = permission_key);
    end loop;
  end loop;
end $$;
