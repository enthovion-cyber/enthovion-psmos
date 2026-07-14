alter table if exists pssrs add column if not exists auto_created_from_moc boolean not null default false;
alter table if exists pssrs add column if not exists auto_creation_source_event text;
alter table if exists pssrs add column if not exists current_certificate_id text;
alter table if exists pssrs add column if not exists startup_certificate_status text not null default 'Missing';
alter table if exists pssrs add column if not exists certificate_version_policy text not null default 'supersede_on_change';

alter table if exists pssr_checklist_items add column if not exists regulatory_source text;
alter table if exists pssr_checklist_items add column if not exists regulatory_reference text;
alter table if exists pssr_checklist_items add column if not exists system_required boolean not null default false;
alter table if exists pssr_checklist_items add column if not exists deletion_locked boolean not null default false;
alter table if exists pssr_checklist_items add column if not exists bypass_locked boolean not null default false;
alter table if exists pssr_checklist_items add column if not exists startup_authorization_blocking boolean not null default false;
alter table if exists pssr_checklist_items add column if not exists certificate_required boolean not null default false;
alter table if exists pssr_checklist_items add column if not exists criticality_level text not null default 'Standard';
alter table if exists pssr_checklist_items add column if not exists bypass_allowed boolean not null default false;
alter table if exists pssr_checklist_items add column if not exists deferral_allowed boolean not null default true;
alter table if exists pssr_checklist_items add column if not exists management_acceptance_required boolean not null default false;
alter table if exists pssr_checklist_items add column if not exists management_acceptance_id text;
alter table if exists pssr_checklist_items add column if not exists auto_verification_link_id text;

alter table if exists pssr_punch_items add column if not exists criticality_level text not null default 'Standard';
alter table if exists pssr_punch_items add column if not exists bypass_allowed boolean not null default false;
alter table if exists pssr_punch_items add column if not exists deferral_allowed boolean not null default true;
alter table if exists pssr_punch_items add column if not exists management_acceptance_required boolean not null default false;
alter table if exists pssr_punch_items add column if not exists management_acceptance_id text;

alter table if exists moc_pssr_requirements add column if not exists startup_certificate_id text;
alter table if exists moc_pssr_requirements add column if not exists auto_created_pssr boolean not null default false;
alter table if exists moc_pssr_requirements add column if not exists certificate_status text not null default 'Missing';

create table if not exists pssr_auto_creation_policies (
  id text primary key,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  trigger_on_moc_approved boolean not null default true,
  trigger_on_moc_implementation boolean not null default false,
  high_risk_requires_pssr boolean not null default true,
  critical_risk_requires_pssr boolean not null default true,
  equipment_change_requires_pssr boolean not null default true,
  safety_system_change_requires_pssr boolean not null default true,
  operating_limits_change_requires_pssr boolean not null default true,
  chemistry_change_requires_pssr boolean not null default true,
  temporary_change_requires_pssr boolean not null default true,
  emergency_change_requires_pssr boolean not null default true,
  duplicate_policy text not null default 'sync_active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pssr_auto_creation_policy_site_idx on pssr_auto_creation_policies(tenant_id, site_id);

create table if not exists pssr_moc_auto_creation_logs (
  id text primary key,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  moc_id text not null,
  pssr_id text,
  trigger_reason text not null,
  trigger_event text not null,
  status text not null,
  message text,
  created_at timestamptz not null default now()
);

create table if not exists pssr_unit_hazard_profiles (
  id text primary key,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  unit_id text,
  area_id text,
  hazard_type text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_hazard_checklist_rules (
  id text primary key,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  hazard_type text not null,
  item_title text not null,
  item_description text,
  required boolean not null default true,
  required_before_startup boolean not null default true,
  evidence_required boolean not null default true,
  verification_required boolean not null default true,
  owner_role_id text,
  startup_blocking boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_management_acceptances (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  record_type text not null,
  record_id text not null,
  justification text not null,
  startup_impact_statement text not null,
  temporary_controls text,
  accepted_by text,
  accepted_at timestamptz,
  due_date date,
  owner_id text,
  status text not null default 'Requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_auto_verification_links (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  verification_type text not null,
  source_module text not null,
  source_record_id text,
  source_record_number text,
  required_status text not null default 'Verified',
  current_status text,
  verification_status text not null default 'Pending',
  verification_message text,
  startup_blocking boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_discipline_signoffs (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  discipline text not null,
  required boolean not null default true,
  assigned_user_id text,
  assigned_role_id text,
  status text not null default 'Pending',
  checklist_completion_percent integer not null default 0,
  blocking_items_count integer not null default 0,
  signed_by text,
  signed_at timestamptz,
  username_reentry_hash text,
  ip_address text,
  user_agent text,
  rejection_reason text,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(pssr_id, discipline)
);

create table if not exists pssr_discipline_checklist_items (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  signoff_id text not null references pssr_discipline_signoffs(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  discipline text not null,
  item_title text not null,
  item_description text,
  required boolean not null default true,
  startup_blocking boolean not null default true,
  status text not null default 'Open',
  evidence_required boolean not null default false,
  verification_required boolean not null default true,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_signoff_blocking_flags (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  signoff_id text not null references pssr_discipline_signoffs(id) on delete cascade,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  raised_by text,
  title text not null,
  description text,
  severity text not null default 'High',
  status text not null default 'Open',
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_startup_certificates (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  moc_id text,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  certificate_number text not null,
  version integer not null default 1,
  status text not null default 'Draft',
  file_key text,
  file_url text,
  issued_by text,
  issued_at timestamptz,
  superseded_by_certificate_id text,
  superseded_at timestamptz,
  secure_share_token_hash text,
  secure_share_expires_at timestamptz,
  qr_verification_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pssr_certificate_number_idx on pssr_startup_certificates(certificate_number);

create table if not exists pssr_secure_share_links (
  id text primary key,
  pssr_id text not null references pssrs(id) on delete cascade,
  certificate_id text references pssr_startup_certificates(id),
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  token_hash text not null unique,
  access_scope text not null default 'certificate_only',
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pssr_secure_share_access_logs (
  id text primary key,
  share_link_id text references pssr_secure_share_links(id) on delete cascade,
  pssr_id text not null,
  certificate_id text,
  tenant_id text not null,
  company_id text not null,
  site_id text not null,
  accessed_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  action text not null,
  metadata jsonb
);
