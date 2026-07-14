-- LOPA study attachments use external storage; this schema stores only auditable metadata.
create table if not exists public.lopa_attachments (
  id text primary key, tenant_id text not null, company_id text, site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  attachment_number text not null, attachment_type text not null, evidence_category text,
  related_tab text, related_record_type text, related_record_id text,
  file_name text not null, original_file_name text, description text, file_type text, mime_type text, file_size bigint,
  storage_provider text not null default 'application-storage', storage_key text, file_hash text,
  version integer not null default 1, revision text, status text not null default 'Active', classification text,
  access_level text not null default 'Study team', required_evidence boolean not null default false, evidence_purpose text,
  tags_json jsonb not null default '[]'::jsonb, effective_date date, source_reference text,
  uploaded_by text, uploaded_at timestamptz not null default now(), updated_by text, updated_at timestamptz not null default now(),
  archived_by text, archived_at timestamptz, archive_reason text, deleted_by text, deleted_at timestamptz, delete_reason text,
  unique(tenant_id, lopa_study_id, attachment_number)
);
create table if not exists public.lopa_attachment_versions (
  id text primary key, tenant_id text not null, company_id text, site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade,
  attachment_id text not null references public.lopa_attachments(id) on delete cascade,
  version integer not null, revision text, file_name text not null, storage_key text, file_size bigint, file_hash text,
  change_reason text, uploaded_by text, uploaded_at timestamptz not null default now(), superseded_by_version_id text, status text not null default 'Active',
  unique(tenant_id, attachment_id, version)
);
create table if not exists public.lopa_attachment_document_links (
  id text primary key, tenant_id text not null, company_id text, site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade, attachment_id text references public.lopa_attachments(id) on delete set null,
  document_id text not null, document_number_snapshot text, document_title_snapshot text, document_revision_snapshot text, document_status_snapshot text,
  relationship text, required_evidence boolean not null default false, linked_by text, linked_at timestamptz not null default now(), unlinked_by text, unlinked_at timestamptz, unlink_reason text
);
create table if not exists public.lopa_attachment_evidence_mappings (
  id text primary key, tenant_id text not null, company_id text, site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade, attachment_id text references public.lopa_attachments(id) on delete cascade,
  document_link_id text references public.lopa_attachment_document_links(id) on delete cascade, related_tab text not null, related_record_type text, related_record_id text,
  evidence_purpose text not null, required boolean not null default false, blocking_if_missing boolean not null default false, notes text,
  created_by text, updated_by text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (attachment_id is not null or document_link_id is not null)
);
create table if not exists public.lopa_attachment_comments (
  id text primary key, tenant_id text not null, company_id text, site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade, attachment_id text not null references public.lopa_attachments(id) on delete cascade,
  comment_type text not null default 'General note', comment_text text not null, status text not null default 'Open', created_by text, updated_by text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.lopa_attachment_readiness (
  id text primary key, tenant_id text not null, company_id text, site_id text not null,
  lopa_study_id text not null references public.lopa_studies(id) on delete cascade, readiness_status text not null,
  required_evidence_status text not null, missing_required_count integer not null default 0, rejected_required_count integer not null default 0, restricted_required_count integer not null default 0,
  checklist_json jsonb not null default '[]'::jsonb, generated_at timestamptz not null default now(), generated_by_system boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id,lopa_study_id)
);

alter table public.lopa_history_events add column if not exists company_id text, add column if not exists site_id text, add column if not exists event_number text, add column if not exists event_category text, add column if not exists related_tab text, add column if not exists related_record_type text, add column if not exists related_record_id text, add column if not exists related_record_number text, add column if not exists actor_role text, add column if not exists reason text, add column if not exists before_values_json jsonb, add column if not exists after_values_json jsonb, add column if not exists source_system text default 'PSM OS', add column if not exists audit_log_id text, add column if not exists correlation_id text;

create index if not exists lopa_attachments_study_idx on public.lopa_attachments(tenant_id,lopa_study_id,deleted_at,archived_at,uploaded_at desc);
create index if not exists lopa_attachment_versions_idx on public.lopa_attachment_versions(tenant_id,attachment_id,version desc);
create index if not exists lopa_attachment_evidence_idx on public.lopa_attachment_evidence_mappings(tenant_id,lopa_study_id,related_tab,required);
create index if not exists lopa_history_events_filters_idx on public.lopa_history_events(tenant_id,lopa_study_id,event_category,severity,created_at desc);

alter table public.lopa_attachments enable row level security;
alter table public.lopa_attachment_versions enable row level security;
alter table public.lopa_attachment_document_links enable row level security;
alter table public.lopa_attachment_evidence_mappings enable row level security;
alter table public.lopa_attachment_comments enable row level security;
alter table public.lopa_attachment_readiness enable row level security;
grant select,insert,update,delete on public.lopa_attachments,public.lopa_attachment_versions,public.lopa_attachment_document_links,public.lopa_attachment_evidence_mappings,public.lopa_attachment_comments,public.lopa_attachment_readiness to authenticated;

do $$
declare k text; keys text[] := array['lopa.attachments.view','lopa.attachments.upload','lopa.attachments.edit','lopa.attachments.delete','lopa.attachments.archive','lopa.attachments.restore','lopa.attachments.download','lopa.attachments.preview','lopa.attachments.version.create','lopa.attachments.classification.manage','lopa.attachments.evidence.manage','lopa.attachments.document_link.manage','lopa.attachments.comments.manage','lopa.attachments.export','lopa.attachments.restricted.view','lopa.history.view','lopa.history.diff.view','lopa.history.audit_metadata.view','lopa.history.export','lopa.history.restricted.view'];
begin
  if to_regclass('public."Permission"') is not null then
    foreach k in array keys loop insert into public."Permission"("id","tenantId","key","moduleKey","label") select gen_random_uuid()::text,t."id",k,'LOPA',k from public."Tenant" t where not exists(select 1 from public."Permission" p where p."tenantId"=t."id" and p."key"=k); end loop;
    if to_regclass('public."RolePermission"') is not null and to_regclass('public."Role"') is not null then insert into public."RolePermission"("roleId","permissionId") select r."id",p."id" from public."Role" r join public."Permission" p on p."tenantId"=r."tenantId" where p."key"=any(keys) and lower(r."name") in ('super admin','company admin','site admin','hse manager','process safety lead','process safety engineer','plant manager') and not exists(select 1 from public."RolePermission" rp where rp."roleId"=r."id" and rp."permissionId"=p."id"); end if;
  end if;
end $$;
