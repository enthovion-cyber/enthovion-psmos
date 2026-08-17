create table if not exists public.mi_safeguard_impairment_approvals (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  impairment_id text not null references public.mi_safeguard_impairments(id) on delete cascade,
  approval_stage text not null,
  approver_role text,
  approver_user_id text,
  action text not null,
  comments text,
  e_signature_id text,
  acted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.mi_safeguard_impairment_extensions (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  impairment_id text not null references public.mi_safeguard_impairments(id) on delete cascade,
  requested_extension_until timestamptz not null,
  extension_reason text not null,
  risk_reassessment_json jsonb not null default '{}'::jsonb,
  mitigation_update text,
  status text not null default 'Pending Approval',
  requested_by text not null,
  approved_by text,
  rejected_by text,
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mi_safeguard_impairment_restorations (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  impairment_id text not null references public.mi_safeguard_impairments(id) on delete cascade,
  restoration_time timestamptz not null,
  restored_by text not null,
  restoration_method text,
  safeguard_returned_to_normal boolean not null default false,
  functional_test_required boolean not null default false,
  functional_test_completed boolean not null default false,
  linked_test_record_id text,
  control_room_notified boolean not null default false,
  temporary_mitigation_removed boolean not null default false,
  seal_lock_restored boolean not null default false,
  evidence_document_id text,
  restoration_notes text,
  verified_by text,
  verification_result text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mi_safeguard_impairment_linked_records (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  impairment_id text not null references public.mi_safeguard_impairments(id) on delete cascade,
  linked_module text not null,
  linked_record_id text not null,
  linked_record_number text,
  relationship_type text not null default 'Related',
  summary_snapshot_json jsonb not null default '{}'::jsonb,
  restricted boolean not null default false,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.mi_safeguard_impairment_notifications (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  impairment_id text not null references public.mi_safeguard_impairments(id) on delete cascade,
  notification_type text not null,
  recipient_user_id text,
  recipient_role text,
  status text not null default 'Pending',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
