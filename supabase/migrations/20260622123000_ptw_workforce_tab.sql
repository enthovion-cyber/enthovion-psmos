alter table permit_workforce
  add column if not exists user_id text references "User"(id) on delete set null,
  add column if not exists worker_type text not null default 'Internal',
  add column if not exists employer_company text,
  add column if not exists contact_number text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists role_on_permit text,
  add column if not exists is_permit_holder boolean not null default false,
  add column if not exists is_performing_authority boolean not null default false,
  add column if not exists is_area_authority boolean not null default false,
  add column if not exists is_permit_issuer boolean not null default false,
  add column if not exists is_fire_watch boolean not null default false,
  add column if not exists is_attendant boolean not null default false,
  add column if not exists is_entry_supervisor boolean not null default false,
  add column if not exists is_gas_tester boolean not null default false,
  add column if not exists is_isolation_authority boolean not null default false,
  add column if not exists briefing_required boolean not null default true,
  add column if not exists briefing_completed boolean not null default false,
  add column if not exists briefing_completed_at timestamptz,
  add column if not exists briefing_completed_by text references "User"(id) on delete set null,
  add column if not exists signed_in boolean not null default false,
  add column if not exists signed_in_at timestamptz,
  add column if not exists signed_in_by text references "User"(id) on delete set null,
  add column if not exists signed_out boolean not null default false,
  add column if not exists signed_out_at timestamptz,
  add column if not exists signed_out_by text references "User"(id) on delete set null,
  add column if not exists status text not null default 'Planned',
  add column if not exists notes text;

update permit_workforce
set
  employer_company = coalesce(employer_company, company),
  contact_number = coalesce(contact_number, phone),
  role_on_permit = coalesce(role_on_permit, role, 'Worker'),
  briefing_completed = coalesce(briefing_completed, signed_briefing, false),
  briefing_completed_at = case when signed_briefing = true and briefing_completed_at is null then updated_at else briefing_completed_at end,
  signed_in = coalesce(signed_in, time_in is not null),
  signed_in_at = coalesce(signed_in_at, time_in),
  signed_out = coalesce(signed_out, time_out is not null),
  signed_out_at = coalesce(signed_out_at, time_out),
  is_permit_holder = coalesce(is_permit_holder, role = 'Permit Holder'),
  is_fire_watch = coalesce(is_fire_watch, role = 'Fire Watch'),
  status = case
    when time_out is not null then 'Signed Out'
    when time_in is not null then 'Signed In'
    when signed_briefing = true then 'Briefed'
    when signed_briefing = false then 'Briefing Pending'
    else status
  end
where true;

create table if not exists permit_briefings (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  briefing_title text not null,
  briefing_topic text not null,
  briefing_notes text,
  conducted_by text references "User"(id) on delete set null,
  conducted_at timestamptz not null default now(),
  required_for_all_workers boolean not null default true,
  completed_count integer not null default 0,
  missing_count integer not null default 0,
  status text not null default 'Open',
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists permit_workforce_history (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  workforce_id text references permit_workforce(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  event_type text not null,
  description text not null,
  user_id text references "User"(id) on delete set null,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);

alter table permit_briefings enable row level security;
alter table permit_workforce_history enable row level security;

drop policy if exists "permit_briefings_service_role_all" on permit_briefings;
create policy "permit_briefings_service_role_all" on permit_briefings
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "permit_workforce_history_service_role_all" on permit_workforce_history;
create policy "permit_workforce_history_service_role_all" on permit_workforce_history
  for all
  to service_role
  using (true)
  with check (true);

create index if not exists permit_workforce_role_idx on permit_workforce(permit_id, role_on_permit, status);
create index if not exists permit_workforce_signed_idx on permit_workforce(permit_id, signed_in, signed_out);
create index if not exists permit_briefings_permit_idx on permit_briefings(permit_id, conducted_at desc);
create index if not exists permit_workforce_history_permit_idx on permit_workforce_history(permit_id, created_at desc);

insert into "Permission" (id, "tenantId", key, "moduleKey", label)
values
  ('perm_ptw_workforce_view', 'tenant_alkylation', 'ptw.workforce.view', 'ptw', 'View PTW Workforce'),
  ('perm_ptw_workforce_add', 'tenant_alkylation', 'ptw.workforce.add', 'ptw', 'Add PTW Workforce'),
  ('perm_ptw_workforce_edit', 'tenant_alkylation', 'ptw.workforce.edit', 'ptw', 'Edit PTW Workforce'),
  ('perm_ptw_workforce_delete', 'tenant_alkylation', 'ptw.workforce.delete', 'ptw', 'Delete PTW Workforce'),
  ('perm_ptw_workforce_briefing', 'tenant_alkylation', 'ptw.workforce.briefing', 'ptw', 'Manage PTW Workforce Briefings'),
  ('perm_ptw_workforce_sign_in', 'tenant_alkylation', 'ptw.workforce.sign_in', 'ptw', 'PTW Workforce Sign In'),
  ('perm_ptw_workforce_sign_out', 'tenant_alkylation', 'ptw.workforce.sign_out', 'ptw', 'PTW Workforce Sign Out'),
  ('perm_ptw_workforce_accountability', 'tenant_alkylation', 'ptw.workforce.accountability', 'ptw', 'PTW Workforce Accountability')
on conflict (id) do update set key = excluded.key, label = excluded.label;

insert into "RolePermission" ("roleId", "permissionId")
select r.id, p.id
from "Role" r
cross join "Permission" p
where r.id in ('role_platform_admin', 'role_corporate_admin', 'role_site_admin', 'role_hse_manager', 'role_permit_issuer', 'role_operations_supervisor', 'role_plant_manager')
  and p.id in ('perm_ptw_workforce_view', 'perm_ptw_workforce_add', 'perm_ptw_workforce_edit', 'perm_ptw_workforce_delete', 'perm_ptw_workforce_briefing', 'perm_ptw_workforce_sign_in', 'perm_ptw_workforce_sign_out', 'perm_ptw_workforce_accountability')
on conflict do nothing;
