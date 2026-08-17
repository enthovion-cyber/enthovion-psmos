create table if not exists public.mi_deficiency_temporary_controls (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  deficiency_id text not null references public.mi_deficiencies(id) on delete cascade,
  control_required boolean not null default false,
  control_description text,
  reduced_operating_envelope boolean not null default false,
  additional_monitoring boolean not null default false,
  temporary_repair boolean not null default false,
  extra_inspection_required boolean not null default false,
  manual_check_required boolean not null default false,
  operator_instruction text,
  expiry_date date,
  owner_user_id text,
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mi_deficiency_approvals (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  deficiency_id text references public.mi_deficiencies(id) on delete cascade,
  deviation_id text references public.mi_deviations(id) on delete cascade,
  approval_stage text not null,
  approver_role text,
  approver_user_id text,
  action text not null,
  comments text,
  e_signature_id text,
  acted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.mi_deficiency_verifications (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  deficiency_id text not null references public.mi_deficiencies(id) on delete cascade,
  correction_completed boolean not null default false,
  verification_method text,
  verification_date date,
  verified_by text,
  evidence_document_id text,
  linked_test_record_id text,
  linked_inspection_record_id text,
  action_completed boolean not null default false,
  temporary_controls_removed boolean not null default false,
  equipment_restored_to_normal boolean not null default false,
  readiness_impact_cleared boolean not null default false,
  verification_result text not null default 'Pending',
  closure_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mi_deficiency_linked_records (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  deficiency_id text references public.mi_deficiencies(id) on delete cascade,
  deviation_id text references public.mi_deviations(id) on delete cascade,
  linked_module text not null,
  linked_record_id text not null,
  linked_record_number text,
  relationship_type text not null default 'Reference',
  required_for_close boolean not null default false,
  status_snapshot text,
  created_by text,
  created_at timestamptz not null default now()
);
