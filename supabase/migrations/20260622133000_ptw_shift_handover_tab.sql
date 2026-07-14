create table if not exists permit_shift_handovers (
  id text primary key,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  current_shift_name text not null,
  current_shift_start timestamptz not null,
  current_shift_end timestamptz not null,
  incoming_shift_name text not null,
  incoming_shift_start timestamptz not null,
  incoming_shift_end timestamptz,
  outgoing_supervisor_id text references "User"(id) on delete set null,
  outgoing_supervisor_name text not null,
  incoming_supervisor_id text references "User"(id) on delete set null,
  incoming_supervisor_name text not null,
  incoming_supervisor_contact text,
  permit_status_at_handover text not null,
  work_progress_status text not null default 'In Progress',
  work_progress_notes text,
  remaining_work text,
  hazards_observed text,
  special_precautions text,
  control_room_message text,
  incoming_supervisor_comments text,
  permit_expiry_at timestamptz,
  expires_within_two_hours boolean not null default false,
  isolation_status text not null default 'Not Reviewed',
  de_isolation_status text not null default 'Not Started',
  gas_test_status text not null default 'Not Reviewed',
  next_gas_retest_due timestamptz,
  workforce_status text not null default 'Not Reviewed',
  conflict_status text not null default 'Not Reviewed',
  checklist jsonb not null default '{}'::jsonb,
  acknowledgement_status text not null default 'Pending',
  acknowledged_by text references "User"(id) on delete set null,
  acknowledged_at timestamptz,
  acknowledgement_signature_id text,
  acknowledgement_signature text,
  acknowledgement_ip text,
  suspended_during_handover boolean not null default false,
  suspension_reason text,
  status text not null default 'Draft',
  created_by text references "User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint permit_shift_handovers_status_check check (status in ('Draft','Pending Incoming Acknowledgement','Acknowledged','Completed','Suspended','Cancelled')),
  constraint permit_shift_handovers_progress_check check (work_progress_status in ('Not Started','In Progress','Partially Complete','Complete','Stopped','Suspended'))
);

create table if not exists permit_handover_checklist_items (
  id text primary key,
  handover_id text not null references permit_shift_handovers(id) on delete cascade,
  permit_id text not null references permits(id) on delete cascade,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  checklist_key text not null,
  checklist_label text not null,
  is_required boolean not null default true,
  is_checked boolean not null default false,
  checked_by text references "User"(id) on delete set null,
  checked_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (handover_id, checklist_key)
);

create table if not exists permit_handover_history (
  id text primary key,
  permit_id text not null references permits(id) on delete cascade,
  handover_id text references permit_shift_handovers(id) on delete cascade,
  tenant_id text not null references "Tenant"(id) on delete cascade,
  company_id text references "Company"(id) on delete set null,
  site_id text not null references "Site"(id) on delete cascade,
  event_type text not null,
  description text not null,
  user_id text references "User"(id) on delete set null,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_permit_shift_handovers_permit on permit_shift_handovers(tenant_id, permit_id, created_at desc);
create index if not exists idx_permit_handover_checklist_handover on permit_handover_checklist_items(tenant_id, handover_id);
create index if not exists idx_permit_handover_history_permit on permit_handover_history(tenant_id, permit_id, created_at desc);

alter table permit_shift_handovers enable row level security;
alter table permit_handover_checklist_items enable row level security;
alter table permit_handover_history enable row level security;
