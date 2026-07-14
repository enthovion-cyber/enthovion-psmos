alter table moc_affected_equipment add column if not exists company_id text;
alter table moc_affected_equipment add column if not exists site_id text;
alter table moc_affected_equipment add column if not exists created_by text;
alter table moc_affected_equipment add column if not exists updated_at timestamptz not null default now();

alter table moc_risk_assessments add column if not exists company_id text;
alter table moc_risk_assessments add column if not exists site_id text;
alter table moc_risk_assessments add column if not exists created_by text;
alter table moc_risk_assessments add column if not exists rationale text;
alter table moc_risk_assessments add column if not exists before_risk jsonb not null default '{}'::jsonb;
alter table moc_risk_assessments add column if not exists after_risk jsonb not null default '{}'::jsonb;

alter table moc_impact_assessments add column if not exists company_id text;
alter table moc_impact_assessments add column if not exists site_id text;
alter table moc_impact_assessments add column if not exists created_by text;
alter table moc_engineering_documents add column if not exists company_id text;
alter table moc_engineering_documents add column if not exists site_id text;
alter table moc_engineering_documents add column if not exists created_by text;
alter table moc_engineering_documents add column if not exists controlled_document_status text;
alter table moc_engineering_documents add column if not exists version_label text;
alter table moc_required_actions add column if not exists company_id text;
alter table moc_required_actions add column if not exists site_id text;
alter table moc_required_actions add column if not exists created_by text;
alter table moc_required_actions add column if not exists owner_id text;
alter table moc_required_actions add column if not exists due_date date;
alter table moc_required_actions add column if not exists evidence_status text not null default 'Not Uploaded';
alter table moc_required_actions add column if not exists verification_status text not null default 'Not Verified';
alter table moc_required_actions add column if not exists linked_module text;
alter table moc_required_actions add column if not exists required_before_startup boolean not null default false;
alter table moc_required_actions add column if not exists required_before_closure boolean not null default true;
alter table moc_required_actions add column if not exists source_impact_answer text;
alter table moc_required_actions add column if not exists updated_at timestamptz not null default now();
alter table moc_temporary_controls add column if not exists company_id text;
alter table moc_temporary_controls add column if not exists site_id text;
alter table moc_temporary_controls add column if not exists created_by text;
alter table moc_temporary_controls add column if not exists extension_history jsonb not null default '[]'::jsonb;
alter table moc_emergency_controls add column if not exists company_id text;
alter table moc_emergency_controls add column if not exists site_id text;
alter table moc_emergency_controls add column if not exists created_by text;
alter table moc_emergency_controls add column if not exists review_status text not null default 'Pending';
alter table moc_emergency_controls add column if not exists review_owner_id text;
alter table moc_emergency_controls add column if not exists review_findings text;
alter table moc_emergency_controls add column if not exists reviewed_at timestamptz;
alter table moc_history_events add column if not exists company_id text;
alter table moc_history_events add column if not exists site_id text;
alter table moc_history_events add column if not exists related_record_type text;
alter table moc_history_events add column if not exists related_record_id text;
alter table moc_history_events add column if not exists related_url text;

create table if not exists moc_pssr_requirements (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  moc_id text not null references mocs(id) on delete cascade unique,
  required boolean not null default false,
  trigger_reason text,
  linked_pssr_id text,
  status text not null default 'Not Required',
  startup_blockers jsonb not null default '[]'::jsonb,
  readiness_score integer not null default 0,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists moc_communication_records (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  moc_id text not null references mocs(id) on delete cascade,
  record_type text not null default 'Communication',
  stakeholder_name text,
  stakeholder_role text,
  department_id text,
  message text,
  acknowledgement_required boolean not null default false,
  acknowledged_at timestamptz,
  sent_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists moc_training_requirements (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  moc_id text not null references mocs(id) on delete cascade,
  role_name text not null,
  training_topic text not null,
  required_before_startup boolean not null default true,
  status text not null default 'Open',
  linked_training_record_id text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists moc_attachments (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  moc_id text not null references mocs(id) on delete cascade,
  attachment_type text not null default 'Other files',
  title text not null,
  file_name text,
  mime_type text,
  size_bytes integer not null default 0,
  storage_key text,
  document_id text,
  uploaded_by text,
  uploaded_at timestamptz not null default now(),
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists moc_pssr_requirements_scope_idx on moc_pssr_requirements(tenant_id, site_id, moc_id);
create index if not exists moc_communication_records_moc_idx on moc_communication_records(tenant_id, moc_id, created_at desc);
create index if not exists moc_training_requirements_moc_idx on moc_training_requirements(tenant_id, moc_id, status);
create index if not exists moc_attachments_moc_idx on moc_attachments(tenant_id, moc_id, uploaded_at desc);

alter table moc_pssr_requirements enable row level security;
alter table moc_communication_records enable row level security;
alter table moc_training_requirements enable row level security;
alter table moc_attachments enable row level security;

do $$
begin
  if to_regclass('public.permissions') is not null then
    insert into permissions (id, tenant_id, key, module, name)
    select 'perm_moc_approve', 'tenant_alkylation', 'moc.approve', 'moc', 'Approve MOC'
    where not exists (select 1 from permissions where key = 'moc.approve');
    insert into permissions (id, tenant_id, key, module, name)
    select 'perm_moc_reject', 'tenant_alkylation', 'moc.reject', 'moc', 'Reject MOC'
    where not exists (select 1 from permissions where key = 'moc.reject');
    insert into permissions (id, tenant_id, key, module, name)
    select 'perm_moc_return', 'tenant_alkylation', 'moc.return', 'moc', 'Return MOC'
    where not exists (select 1 from permissions where key = 'moc.return');
    insert into permissions (id, tenant_id, key, module, name)
    select 'perm_moc_implementation_start', 'tenant_alkylation', 'moc.implementation.start', 'moc', 'Start MOC Implementation'
    where not exists (select 1 from permissions where key = 'moc.implementation.start');
    insert into permissions (id, tenant_id, key, module, name)
    select 'perm_moc_implementation_complete', 'tenant_alkylation', 'moc.implementation.complete', 'moc', 'Complete MOC Implementation'
    where not exists (select 1 from permissions where key = 'moc.implementation.complete');
    insert into permissions (id, tenant_id, key, module, name)
    select 'perm_moc_ready_for_startup', 'tenant_alkylation', 'moc.ready_for_startup', 'moc', 'Mark MOC Ready For Startup'
    where not exists (select 1 from permissions where key = 'moc.ready_for_startup');
    insert into permissions (id, tenant_id, key, module, name)
    select 'perm_moc_close', 'tenant_alkylation', 'moc.close', 'moc', 'Close MOC'
    where not exists (select 1 from permissions where key = 'moc.close');
    insert into permissions (id, tenant_id, key, module, name)
    select 'perm_moc_cancel', 'tenant_alkylation', 'moc.cancel', 'moc', 'Cancel MOC'
    where not exists (select 1 from permissions where key = 'moc.cancel');
    insert into permissions (id, tenant_id, key, module, name)
    select 'perm_moc_temporary_extend', 'tenant_alkylation', 'moc.temporary.extend', 'moc', 'Extend Temporary MOC'
    where not exists (select 1 from permissions where key = 'moc.temporary.extend');
    insert into permissions (id, tenant_id, key, module, name)
    select 'perm_moc_pssr_trigger', 'tenant_alkylation', 'moc.pssr.trigger', 'moc', 'Trigger MOC PSSR'
    where not exists (select 1 from permissions where key = 'moc.pssr.trigger');
    insert into permissions (id, tenant_id, key, module, name)
    select 'perm_moc_attachments_upload', 'tenant_alkylation', 'moc.attachments.upload', 'moc', 'Upload MOC Attachments'
    where not exists (select 1 from permissions where key = 'moc.attachments.upload');
    insert into permissions (id, tenant_id, key, module, name)
    select 'perm_moc_report_download', 'tenant_alkylation', 'moc.report.download', 'moc', 'Download MOC Report'
    where not exists (select 1 from permissions where key = 'moc.report.download');
  end if;
end $$;
