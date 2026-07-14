-- Completes the LOPA Attachments and History PDF data surface. File bytes remain
-- in the existing storage provider; this migration stores only auditable metadata.

alter table public.lopa_attachments
  add column if not exists confidential boolean not null default false,
  add column if not exists restricted boolean not null default false,
  add column if not exists external_sharing_allowed boolean not null default false,
  add column if not exists retention_category text,
  add column if not exists owner_id text,
  add column if not exists permission_notes text,
  add column if not exists reviewed_by text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists scan_status text,
  add column if not exists scan_details text;

alter table public.lopa_studies
  add column if not exists attachment_readiness_status text not null default 'Not Ready',
  add column if not exists attachment_missing_required_count integer not null default 0;

alter table public.lopa_attachment_versions
  add column if not exists mime_type text,
  add column if not exists original_file_name text,
  add column if not exists restored_by text,
  add column if not exists restored_at timestamptz;

alter table public.lopa_attachment_document_links
  add column if not exists document_type_snapshot text,
  add column if not exists document_owner_snapshot text,
  add column if not exists effective_date_snapshot date,
  add column if not exists last_refreshed_at timestamptz,
  add column if not exists status_changed boolean not null default false,
  add column if not exists refresh_warning text;

alter table public.lopa_attachment_readiness
  add column if not exists warning_count integer not null default 0,
  add column if not exists blocker_count integer not null default 0,
  add column if not exists required_controlled_documents_count integer not null default 0;

alter table public.lopa_history_events
  add column if not exists event_title text,
  add column if not exists event_description text,
  add column if not exists actor_user_id text,
  add column if not exists metadata_json jsonb,
  add column if not exists source_api text,
  add column if not exists request_id text,
  add column if not exists integrity_hash text,
  add column if not exists retention_status text not null default 'Active';

create index if not exists lopa_attachments_filters_pdf_idx
  on public.lopa_attachments(tenant_id, lopa_study_id, attachment_type, evidence_category, related_tab, status, classification, access_level, uploaded_at desc);
create index if not exists lopa_history_pdf_filters_idx
  on public.lopa_history_events(tenant_id, lopa_study_id, event_type, event_category, severity, actor_user_id, created_at desc);

-- LOPA history is append-only. Existing service writes only insert events, while this
-- trigger prevents ordinary update/delete paths from silently changing audit evidence.
create or replace function public.prevent_lopa_history_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'LOPA history events are immutable';
end;
$$;

drop trigger if exists lopa_history_events_immutable on public.lopa_history_events;
create trigger lopa_history_events_immutable
before update or delete on public.lopa_history_events
for each row execute function public.prevent_lopa_history_mutation();

alter table public.lopa_attachments enable row level security;
alter table public.lopa_attachment_versions enable row level security;
alter table public.lopa_attachment_document_links enable row level security;
alter table public.lopa_attachment_evidence_mappings enable row level security;
alter table public.lopa_attachment_comments enable row level security;
alter table public.lopa_attachment_readiness enable row level security;

grant select, insert, update, delete on public.lopa_attachments, public.lopa_attachment_versions,
  public.lopa_attachment_document_links, public.lopa_attachment_evidence_mappings,
  public.lopa_attachment_comments, public.lopa_attachment_readiness to authenticated;

do $$
declare k text;
keys text[] := array[
  'lopa.attachments.classification.manage','lopa.attachments.evidence.manage',
  'lopa.attachments.document_link.manage','lopa.attachments.comments.manage',
  'lopa.attachments.version.create','lopa.attachments.restricted.view',
  'lopa.history.diff.view','lopa.history.audit_metadata.view','lopa.history.restricted.view'
];
begin
  if to_regclass('public."Permission"') is not null then
    foreach k in array keys loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant."id", k, 'LOPA', k
      from public."Tenant" tenant
      where not exists (
        select 1 from public."Permission" permission
        where permission."tenantId" = tenant."id" and permission."key" = k
      );
    end loop;
  end if;
end $$;
