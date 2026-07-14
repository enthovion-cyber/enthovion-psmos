alter table public."SearchIndex"
  add column if not exists "siteId" text,
  add column if not exists "recordType" text,
  add column if not exists "recordNumber" text,
  add column if not exists "subtitle" text,
  add column if not exists "description" text,
  add column if not exists "status" text,
  add column if not exists "priority" text,
  add column if not exists "url" text,
  add column if not exists "metadata" jsonb,
  add column if not exists "createdAt" timestamp(3) not null default current_timestamp;

update public."SearchIndex"
set
  "recordType" = coalesce("recordType", "entityType"),
  "recordNumber" = coalesce("recordNumber", nullif("tags"[1], '')),
  "url" = coalesce("url", case
    when lower("moduleKey") = 'equipment' then '/equipment/' || "entityId"
    when lower("moduleKey") = 'actions' then '/actions/' || "entityId"
    else null
  end)
where "recordType" is null or "url" is null;

create table if not exists public."SearchHistory" (
  "id" text primary key,
  "userId" text not null references public."User"("id") on delete cascade on update cascade,
  "tenantId" text not null references public."Tenant"("id") on delete cascade on update cascade,
  "query" text not null,
  "selectedRecordId" text,
  "selectedModule" text,
  "createdAt" timestamp(3) not null default current_timestamp
);

create index if not exists "SearchIndex_tenantId_siteId_module_status_idx"
  on public."SearchIndex"("tenantId", "siteId", "moduleKey", "status");

create index if not exists "SearchIndex_full_text_idx"
  on public."SearchIndex"
  using gin (to_tsvector('english', coalesce("text", '') || ' ' || coalesce("title", '') || ' ' || coalesce("subtitle", '')));

create index if not exists "SearchHistory_user_tenant_created_idx"
  on public."SearchHistory"("tenantId", "userId", "createdAt" desc);

insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
select 'perm_search_reindex', "id", 'search.reindex', 'search', 'Reindex Search'
from public."Tenant"
on conflict ("tenantId", "key") do nothing;

insert into public."RolePermission" ("roleId", "permissionId")
select r."id", p."id"
from public."Role" r
join public."Permission" p on p."tenantId" = r."tenantId" and p."key" = 'search.reindex'
where r."key" in ('platform_admin', 'corporate_admin', 'site_admin', 'hse_manager')
on conflict ("roleId", "permissionId") do nothing;
