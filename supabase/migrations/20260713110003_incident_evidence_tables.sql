alter table public.incidents
  add column if not exists evidence_review_status text,
  add column if not exists evidence_review_requested_by text,
  add column if not exists evidence_review_requested_at timestamptz,
  add column if not exists evidence_review_decision text,
  add column if not exists evidence_review_decided_by text,
  add column if not exists evidence_review_decided_at timestamptz,
  add column if not exists evidence_review_reason text,
  add column if not exists evidence_readiness_status text;

alter table public.incident_initial_evidence
  add column if not exists evidence_number text,
  add column if not exists status text not null default 'Active',
  add column if not exists review_status text,
  add column if not exists required_evidence boolean not null default false,
  add column if not exists related_tab text,
  add column if not exists related_record_type text,
  add column if not exists related_record_id text,
  add column if not exists chain_of_custody_status text,
  add column if not exists document_control_link_id text,
  add column if not exists version_number integer not null default 1,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by text,
  add column if not exists updated_by text,
  add column if not exists updated_at timestamptz;

create table if not exists public.incident_evidence_versions (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  incident_id text,
  evidence_id text not null,
  version_number integer not null,
  file_name text,
  storage_provider text,
  storage_key text,
  file_type text,
  mime_type text,
  file_size bigint,
  change_reason text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.incident_evidence_mappings (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  incident_id text not null,
  evidence_id text not null,
  mapped_tab text,
  mapped_record_type text,
  mapped_record_id text,
  mapping_reason text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.incident_evidence_custody_events (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  incident_id text not null,
  evidence_id text not null,
  custody_event_type text,
  from_user_id text,
  to_user_id text,
  custody_location text,
  event_at timestamptz not null default now(),
  notes text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.incident_evidence_document_links (
  id text primary key,
  tenant_id text references public."Tenant"(id) on delete cascade,
  company_id text,
  site_id text,
  incident_id text not null,
  evidence_id text,
  document_id text,
  document_number_snapshot text,
  document_title_snapshot text,
  document_revision_snapshot text,
  document_status_snapshot text,
  link_reason text,
  created_by text,
  created_at timestamptz not null default now()
);
