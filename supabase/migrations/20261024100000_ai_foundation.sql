-- AI foundation: tamper-evident audit, verified relationship graph, knowledge chunks, settings.
create extension if not exists vector;

create table if not exists public."AiAuditEvent" (
  "id" text primary key,
  "tenantId" text not null references public."Tenant"("id") on delete cascade,
  "siteId" text,
  "userId" text,
  "kind" text not null,
  "model" text,
  "promptVersion" text,
  "request" jsonb,
  "response" jsonb,
  "sourceIds" text[] not null default '{}',
  "validation" jsonb,
  "prevHash" text,
  "hash" text not null,
  "createdAt" timestamp(3) not null default current_timestamp
);
create index if not exists "AiAuditEvent_tenant_created_idx" on public."AiAuditEvent"("tenantId", "createdAt" desc);

create or replace function public.ai_audit_immutable() returns trigger as $$
begin
  raise exception 'AiAuditEvent is append-only';
end;
$$ language plpgsql;

drop trigger if exists "AiAuditEvent_no_update" on public."AiAuditEvent";
create trigger "AiAuditEvent_no_update" before update or delete on public."AiAuditEvent"
  for each row execute function public.ai_audit_immutable();

-- Relationships distinguish verified links from AI proposals.
create table if not exists public."AiRelationship" (
  "id" text primary key,
  "tenantId" text not null references public."Tenant"("id") on delete cascade,
  "siteId" text,
  "fromType" text not null,
  "fromId" text not null,
  "toType" text not null,
  "toId" text not null,
  "relation" text not null,
  "status" text not null default 'PROPOSED' check ("status" in ('PROPOSED','VERIFIED','REJECTED','SUPERSEDED')),
  "source" text,
  "sourceRevision" text,
  "confidence" numeric,
  "verifiedBy" text,
  "verifiedAt" timestamp(3),
  "effectiveDate" date,
  "createdAt" timestamp(3) not null default current_timestamp
);
create index if not exists "AiRelationship_from_idx" on public."AiRelationship"("tenantId", "fromType", "fromId");
create index if not exists "AiRelationship_to_idx" on public."AiRelationship"("tenantId", "toType", "toId");

create table if not exists public."AiKnowledgeChunk" (
  "id" text primary key,
  "tenantId" text not null references public."Tenant"("id") on delete cascade,
  "siteId" text,
  "recordType" text not null,
  "recordId" text not null,
  "revision" text,
  "page" int,
  "content" text not null,
  "embedding" vector(1536),
  "embeddingModel" text,
  "sourceUpdatedAt" timestamp(3),
  "createdAt" timestamp(3) not null default current_timestamp
);
create index if not exists "AiKnowledgeChunk_scope_idx" on public."AiKnowledgeChunk"("tenantId", "siteId", "recordType");

create table if not exists public."AiSetting" (
  "tenantId" text primary key references public."Tenant"("id") on delete cascade,
  "enabled" boolean not null default false,
  "approvedModels" text[] not null default '{}',
  "retentionDays" int not null default 365,
  "updatedAt" timestamp(3) not null default current_timestamp
);

insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
select 'perm_ai_copilot_use_' || "id", "id", 'ai.copilot.use', 'ai', 'Use PSM Copilot'
from public."Tenant"
on conflict do nothing;
