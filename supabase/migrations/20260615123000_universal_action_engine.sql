alter table public."Action"
  add column if not exists "actionNumber" text,
  add column if not exists "equipmentId" text references public."Equipment"(id) on delete set null,
  add column if not exists "siteId" text references public."Site"(id) on delete set null,
  add column if not exists "departmentId" text references public."Department"(id) on delete set null,
  add column if not exists "assignedDate" timestamp without time zone,
  add column if not exists "evidenceRequired" boolean not null default false,
  add column if not exists "verificationRequired" boolean not null default false,
  add column if not exists "verifiedById" text references public."User"(id) on delete set null,
  add column if not exists "verifiedAt" timestamp without time zone,
  add column if not exists "verificationNotes" text,
  add column if not exists "escalationLevel" integer not null default 0,
  add column if not exists "lastEscalationDate" timestamp without time zone;

create unique index if not exists "Action_actionNumber_key" on public."Action" ("actionNumber");
create index if not exists "Action_tenant_status_due_idx" on public."Action" ("tenantId", status, "dueDate");
create index if not exists "Action_owner_idx" on public."Action" ("assignedToId");
create index if not exists "Action_source_idx" on public."Action" ("tenantId", "moduleKey", "sourceType", "sourceId");

create table if not exists public."ActionComment" (
  id text primary key,
  "tenantId" text not null references public."Tenant"(id) on delete cascade,
  "actionId" text not null references public."Action"(id) on delete cascade,
  "parentCommentId" text references public."ActionComment"(id) on delete cascade,
  body text not null,
  "authorId" text not null references public."User"(id) on delete cascade,
  "createdAt" timestamp without time zone not null default current_timestamp,
  "updatedAt" timestamp without time zone not null default current_timestamp,
  "editedAt" timestamp without time zone
);

create table if not exists public."ActionEvidence" (
  id text primary key,
  "tenantId" text not null references public."Tenant"(id) on delete cascade,
  "actionId" text not null references public."Action"(id) on delete cascade,
  description text,
  "fileName" text not null,
  "mimeType" text not null,
  "sizeBytes" integer not null default 0,
  "storageKey" text not null,
  status text not null default 'UPLOADED',
  "uploadedById" text not null references public."User"(id) on delete cascade,
  "uploadedAt" timestamp without time zone not null default current_timestamp
);

create table if not exists public."ActionVerification" (
  id text primary key,
  "tenantId" text not null references public."Tenant"(id) on delete cascade,
  "actionId" text not null references public."Action"(id) on delete cascade,
  decision text not null,
  notes text,
  "verifiedById" text not null references public."User"(id) on delete cascade,
  "verifiedAt" timestamp without time zone not null default current_timestamp
);

create table if not exists public."ActionWatcher" (
  id text primary key,
  "tenantId" text not null references public."Tenant"(id) on delete cascade,
  "actionId" text not null references public."Action"(id) on delete cascade,
  "userId" text not null references public."User"(id) on delete cascade,
  "createdAt" timestamp without time zone not null default current_timestamp,
  unique ("actionId", "userId")
);

create table if not exists public."ActionHistory" (
  id text primary key,
  "tenantId" text not null references public."Tenant"(id) on delete cascade,
  "actionId" text not null references public."Action"(id) on delete cascade,
  event text not null,
  "actorId" text references public."User"(id) on delete set null,
  "before" jsonb,
  "after" jsonb,
  "createdAt" timestamp without time zone not null default current_timestamp
);

create table if not exists public."ActionEscalation" (
  id text primary key,
  "tenantId" text not null references public."Tenant"(id) on delete cascade,
  "actionId" text not null references public."Action"(id) on delete cascade,
  "level" integer not null,
  "recipientRole" text not null,
  "notifiedAt" timestamp without time zone not null default current_timestamp,
  "createdAt" timestamp without time zone not null default current_timestamp
);

create index if not exists "ActionComment_action_idx" on public."ActionComment" ("actionId", "createdAt");
create index if not exists "ActionEvidence_action_idx" on public."ActionEvidence" ("actionId", "uploadedAt");
create index if not exists "ActionHistory_action_idx" on public."ActionHistory" ("actionId", "createdAt");
