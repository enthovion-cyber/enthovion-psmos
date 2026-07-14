create table if not exists mocs (
  id text primary key,
  moc_number text not null,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text not null references "Company"(id) on delete cascade,
  site_id text not null references "Site"(id) on delete cascade,
  department_id text references "Department"(id) on delete set null,
  unit_id text references "Unit"(id) on delete set null,
  area_id text references "Area"(id) on delete set null,
  title text not null,
  description text not null,
  affected_system text,
  location_description text,
  change_description jsonb not null default '{}'::jsonb,
  like_for_like jsonb not null default '{}'::jsonb,
  change_type text not null,
  change_category text not null,
  priority text not null,
  risk_level text not null default 'Low',
  risk_score integer not null default 0,
  status text not null default 'Draft',
  originator_id text references "User"(id) on delete set null,
  requested_start_date date,
  target_implementation_date date,
  submitted_at timestamptz,
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mocs_number_key unique(tenant_id, moc_number),
  constraint mocs_status_check check (status in ('Draft','Submitted','Under Review','Approved','Implementation','Pending PSSR','Ready For Startup','Closed','Rejected','Cancelled','Overdue Temporary Change'))
);

create table if not exists moc_affected_equipment (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  moc_id text not null references mocs(id) on delete cascade,
  equipment_id text not null references "Equipment"(id) on delete cascade,
  role text not null default 'RELATED',
  equipment_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint moc_affected_equipment_unique unique(moc_id, equipment_id)
);

create table if not exists moc_risk_assessments (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  moc_id text not null references mocs(id) on delete cascade unique,
  safety_impact integer not null,
  environmental_impact integer not null,
  production_impact integer not null,
  total_score integer not null,
  risk_level text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists moc_impact_assessments (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  moc_id text not null references mocs(id) on delete cascade unique,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists moc_engineering_documents (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  moc_id text not null references mocs(id) on delete cascade,
  document_type text not null,
  title text not null,
  file_name text,
  mime_type text,
  size_bytes integer not null default 0,
  storage_key text,
  document_id text,
  justification text,
  uploaded_by text references "User"(id) on delete set null,
  uploaded_at timestamptz not null default now()
);

create table if not exists moc_required_actions (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  moc_id text not null references mocs(id) on delete cascade,
  action_type text not null,
  title text not null,
  description text,
  priority text not null default 'MEDIUM',
  required boolean not null default true,
  system_generated boolean not null default true,
  action_id text,
  status text not null default 'Preview',
  created_at timestamptz not null default now()
);

create table if not exists moc_temporary_controls (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  moc_id text not null references mocs(id) on delete cascade unique,
  expiry_date date not null,
  duration_days integer not null,
  reason text not null,
  risk_controls text not null,
  reversal_plan text not null,
  removal_owner_id text references "User"(id) on delete set null,
  extension_allowed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists moc_emergency_controls (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  moc_id text not null references mocs(id) on delete cascade unique,
  emergency_justification text not null,
  immediate_risk_controls text not null,
  implemented_by text references "User"(id) on delete set null,
  implementation_datetime timestamptz not null,
  post_review_due_date timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists moc_history_events (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  moc_id text not null references mocs(id) on delete cascade,
  event_type text not null,
  title text not null,
  description text,
  actor_id text references "User"(id) on delete set null,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists mocs_scope_idx on mocs(tenant_id, company_id, site_id, status, risk_level);
create index if not exists moc_affected_equipment_equipment_idx on moc_affected_equipment(tenant_id, equipment_id);
create index if not exists moc_history_events_moc_idx on moc_history_events(tenant_id, moc_id, created_at desc);

alter table mocs enable row level security;
alter table moc_affected_equipment enable row level security;
alter table moc_risk_assessments enable row level security;
alter table moc_impact_assessments enable row level security;
alter table moc_engineering_documents enable row level security;
alter table moc_required_actions enable row level security;
alter table moc_temporary_controls enable row level security;
alter table moc_emergency_controls enable row level security;
alter table moc_history_events enable row level security;

do $$
begin
  if to_regclass('public.permissions') is not null then
    insert into permissions (id, tenant_id, key, module, name)
    select 'perm_moc_view', 'tenant_alkylation', 'moc.view', 'moc', 'View MOC'
    where not exists (select 1 from permissions where key = 'moc.view');
    insert into permissions (id, tenant_id, key, module, name)
    select 'perm_moc_create', 'tenant_alkylation', 'moc.create', 'moc', 'Create MOC'
    where not exists (select 1 from permissions where key = 'moc.create');
    insert into permissions (id, tenant_id, key, module, name)
    select 'perm_moc_edit', 'tenant_alkylation', 'moc.edit', 'moc', 'Edit MOC'
    where not exists (select 1 from permissions where key = 'moc.edit');
    insert into permissions (id, tenant_id, key, module, name)
    select 'perm_moc_submit', 'tenant_alkylation', 'moc.submit', 'moc', 'Submit MOC'
    where not exists (select 1 from permissions where key = 'moc.submit');
    insert into permissions (id, tenant_id, key, module, name)
    select 'perm_moc_upload_documents', 'tenant_alkylation', 'moc.upload_documents', 'moc', 'Upload MOC Documents'
    where not exists (select 1 from permissions where key = 'moc.upload_documents');
    insert into permissions (id, tenant_id, key, module, name)
    select 'perm_moc_generate_actions', 'tenant_alkylation', 'moc.generate_actions', 'moc', 'Generate MOC Actions'
    where not exists (select 1 from permissions where key = 'moc.generate_actions');
  end if;
end $$;
