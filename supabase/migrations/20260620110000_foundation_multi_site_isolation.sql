alter table public."Company"
  add column if not exists "industry" text,
  add column if not exists "country" text,
  add column if not exists "timezone" text,
  add column if not exists "logoUrl" text,
  add column if not exists "address" text;

alter table public."Site"
  add column if not exists "country" text,
  add column if not exists "siteManagerId" text references public."User"(id) on delete set null,
  add column if not exists "emergencyContact" text,
  add column if not exists "status" text not null default 'ACTIVE';

alter table public."Department"
  add column if not exists "managerId" text references public."User"(id) on delete set null,
  add column if not exists "description" text;

alter table public."Unit"
  add column if not exists "description" text;

alter table public."Area"
  add column if not exists "description" text;

alter table public."Equipment"
  add column if not exists "companyId" text references public."Company"(id) on delete set null,
  add column if not exists "departmentId" text references public."Department"(id) on delete set null;

alter table public."Action"
  add column if not exists "companyId" text references public."Company"(id) on delete set null,
  add column if not exists "unitId" text references public."Unit"(id) on delete set null,
  add column if not exists "areaId" text references public."Area"(id) on delete set null;

alter table public."Document"
  add column if not exists "companyId" text references public."Company"(id) on delete set null,
  add column if not exists "siteId" text references public."Site"(id) on delete set null,
  add column if not exists "departmentId" text references public."Department"(id) on delete set null,
  add column if not exists "unitId" text references public."Unit"(id) on delete set null,
  add column if not exists "areaId" text references public."Area"(id) on delete set null,
  add column if not exists "equipmentId" text references public."Equipment"(id) on delete set null;

alter table public."Notification"
  add column if not exists "companyId" text references public."Company"(id) on delete set null,
  add column if not exists "siteId" text references public."Site"(id) on delete set null,
  add column if not exists "departmentId" text references public."Department"(id) on delete set null,
  add column if not exists "unitId" text references public."Unit"(id) on delete set null,
  add column if not exists "areaId" text references public."Area"(id) on delete set null,
  add column if not exists "equipmentId" text references public."Equipment"(id) on delete set null;

update public."Equipment" e
set "companyId" = s."companyId"
from public."Site" s
where e."siteId" = s.id and e."companyId" is null;

update public."Action" a
set "companyId" = s."companyId"
from public."Site" s
where a."siteId" = s.id and a."companyId" is null;

create index if not exists "Equipment_tenant_company_site_idx" on public."Equipment"("tenantId", "companyId", "siteId");
create index if not exists "Action_tenant_company_site_idx" on public."Action"("tenantId", "companyId", "siteId");
create index if not exists "Document_tenant_company_site_idx" on public."Document"("tenantId", "companyId", "siteId");
create index if not exists "Notification_tenant_company_site_idx" on public."Notification"("tenantId", "companyId", "siteId");
create index if not exists "UserSite_user_company_site_idx" on public."UserSite"("userId", "companyId", "siteId");

insert into public."Company" ("id", "tenantId", "name", "legalName", "code", "industry", "country", "timezone", "address", "status", "updatedAt")
values ('company_demo_chemicals', 'tenant_alkylation', 'Demo Chemicals', 'Demo Chemicals Ltd', 'DEMO', 'Chemical Manufacturing', 'Saudi Arabia', 'Asia/Riyadh', 'Jubail Industrial City', 'ACTIVE', now())
on conflict ("id") do update set "name" = excluded."name", "industry" = excluded."industry", "updatedAt" = now();

insert into public."Site" ("id", "tenantId", "companyId", "name", "code", "timezone", "country", "address", "status", "updatedAt")
values
  ('site_jubail_demo', 'tenant_alkylation', 'company_demo_chemicals', 'Jubail Plant', 'JUB', 'Asia/Riyadh', 'Saudi Arabia', 'Jubail Industrial City', 'ACTIVE', now()),
  ('site_yanbu_demo', 'tenant_alkylation', 'company_demo_chemicals', 'Yanbu Plant', 'YAN', 'Asia/Riyadh', 'Saudi Arabia', 'Yanbu Industrial City', 'ACTIVE', now())
on conflict ("tenantId", "code") do update set "companyId" = excluded."companyId", "name" = excluded."name", "status" = 'ACTIVE', "updatedAt" = now();

insert into public."Department" ("id", "tenantId", "siteId", "name", "code", "description", "updatedAt")
values
  ('dept_jubail_operations', 'tenant_alkylation', 'site_jubail_demo', 'Operations', 'OPS', 'Plant operations department', now()),
  ('dept_jubail_maintenance', 'tenant_alkylation', 'site_jubail_demo', 'Maintenance', 'MAINT', 'Mechanical and electrical maintenance', now()),
  ('dept_jubail_hse', 'tenant_alkylation', 'site_jubail_demo', 'HSE', 'HSE', 'Health, safety, and environment', now()),
  ('dept_jubail_engineering', 'tenant_alkylation', 'site_jubail_demo', 'Engineering', 'ENG', 'Plant engineering support', now())
on conflict ("id") do update set "description" = excluded."description", "updatedAt" = now();

insert into public."Unit" ("id", "tenantId", "siteId", "name", "code", "description", "updatedAt")
values
  ('unit_demo_utilities', 'tenant_alkylation', 'site_jubail_demo', 'Utilities', 'UTIL', 'Utilities process unit', now()),
  ('unit_demo_tank_farm', 'tenant_alkylation', 'site_jubail_demo', 'Tank Farm', 'TKF', 'Bulk storage and transfer area', now()),
  ('unit_demo_reactor', 'tenant_alkylation', 'site_jubail_demo', 'Reactor Area', 'RCT', 'Main reactor process area', now())
on conflict ("siteId", "code") do update set "description" = excluded."description", "updatedAt" = now();

insert into public."Area" ("id", "tenantId", "unitId", "name", "code", "description", "updatedAt")
values
  ('area_demo_boiler_house', 'tenant_alkylation', 'unit_demo_utilities', 'Boiler House', 'BOILER', 'Steam generation area', now()),
  ('area_demo_pump_area', 'tenant_alkylation', 'unit_demo_utilities', 'Pump Area', 'PUMP', 'Pump equipment area', now()),
  ('area_demo_loading_bay', 'tenant_alkylation', 'unit_demo_tank_farm', 'Loading Bay', 'LOAD', 'Truck loading and unloading bay', now())
on conflict ("unitId", "code") do update set "description" = excluded."description", "updatedAt" = now();

insert into public."UserSite" ("userId", "siteId", "companyId")
values
  ('user_imran_shah', 'site_jubail_demo', 'company_demo_chemicals'),
  ('user_imran_shah', 'site_yanbu_demo', 'company_demo_chemicals')
on conflict ("userId", "siteId") do update set "companyId" = excluded."companyId";

alter table public."Company" enable row level security;
alter table public."Site" enable row level security;
alter table public."Department" enable row level security;
alter table public."Unit" enable row level security;
alter table public."Area" enable row level security;
alter table public."Equipment" enable row level security;
alter table public."Action" enable row level security;
alter table public."Document" enable row level security;
alter table public."Notification" enable row level security;
alter table public."SearchIndex" enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['Company','Site','Department','Unit','Area','Equipment','Action','Document','Notification','SearchIndex']
  loop
    execute format('drop policy if exists "%s_service_role_all" on public."%s"', table_name, table_name);
    execute format('create policy "%s_service_role_all" on public."%s" for all to service_role using (true) with check (true)', table_name, table_name);
  end loop;
end $$;

drop policy if exists "Company_authenticated_scope" on public."Company";
create policy "Company_authenticated_scope" on public."Company"
for select to authenticated
using (
  "tenantId" = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  and (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'corporate_view')::boolean, false)
    or id in (select jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'company_ids', '[]'::jsonb)))
  )
);

drop policy if exists "Site_authenticated_scope" on public."Site";
create policy "Site_authenticated_scope" on public."Site"
for select to authenticated
using (
  "tenantId" = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  and (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'corporate_view')::boolean, false)
    or id in (select jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'site_ids', '[]'::jsonb)))
  )
);

drop policy if exists "Department_authenticated_scope" on public."Department";
create policy "Department_authenticated_scope" on public."Department"
for select to authenticated
using (
  "tenantId" = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  and (
    "siteId" is null
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'corporate_view')::boolean, false)
    or "siteId" in (select jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'site_ids', '[]'::jsonb)))
  )
);

drop policy if exists "Unit_authenticated_scope" on public."Unit";
create policy "Unit_authenticated_scope" on public."Unit"
for select to authenticated
using (
  "tenantId" = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  and (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'corporate_view')::boolean, false)
    or "siteId" in (select jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'site_ids', '[]'::jsonb)))
  )
);

drop policy if exists "Area_authenticated_scope" on public."Area";
create policy "Area_authenticated_scope" on public."Area"
for select to authenticated
using (
  "tenantId" = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  and (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'corporate_view')::boolean, false)
    or exists (
      select 1 from public."Unit" u
      where u.id = "Area"."unitId"
      and u."siteId" in (select jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'site_ids', '[]'::jsonb)))
    )
  )
);

drop policy if exists "Equipment_authenticated_scope" on public."Equipment";
create policy "Equipment_authenticated_scope" on public."Equipment"
for select to authenticated
using (
  "tenantId" = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  and (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'corporate_view')::boolean, false)
    or "siteId" in (select jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'site_ids', '[]'::jsonb)))
  )
);

drop policy if exists "Action_authenticated_scope" on public."Action";
create policy "Action_authenticated_scope" on public."Action"
for select to authenticated
using (
  "tenantId" = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  and (
    "siteId" is null
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'corporate_view')::boolean, false)
    or "siteId" in (select jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'site_ids', '[]'::jsonb)))
  )
);

drop policy if exists "Document_authenticated_scope" on public."Document";
create policy "Document_authenticated_scope" on public."Document"
for select to authenticated
using (
  "tenantId" = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  and (
    "siteId" is null
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'corporate_view')::boolean, false)
    or "siteId" in (select jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'site_ids', '[]'::jsonb)))
  )
);

drop policy if exists "Notification_authenticated_scope" on public."Notification";
create policy "Notification_authenticated_scope" on public."Notification"
for select to authenticated
using (
  "tenantId" = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  and "userId" = (auth.jwt() ->> 'sub')
  and (
    "siteId" is null
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'corporate_view')::boolean, false)
    or "siteId" in (select jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'site_ids', '[]'::jsonb)))
  )
);

drop policy if exists "SearchIndex_authenticated_scope" on public."SearchIndex";
create policy "SearchIndex_authenticated_scope" on public."SearchIndex"
for select to authenticated
using (
  "tenantId" = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  and (
    "siteId" is null
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'corporate_view')::boolean, false)
    or "siteId" in (select jsonb_array_elements_text(coalesce(auth.jwt() -> 'app_metadata' -> 'site_ids', '[]'::jsonb)))
  )
);
