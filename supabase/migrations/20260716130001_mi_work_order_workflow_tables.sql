create table if not exists public.mi_work_order_execution_logs (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public."Tenant"("id") on delete cascade,
  site_id text not null,
  work_order_id uuid not null references public.mi_work_orders(id) on delete cascade,
  actual_work_performed text null,
  parts_used_json jsonb null,
  measurements_json jsonb null,
  problems_found text null,
  additional_findings text null,
  completion_notes text null,
  result text not null,
  logged_by text not null,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint mi_work_order_execution_result_check check (result in ('Completed successfully','Completed with follow-up','Temporary repair completed','Permanent repair completed','Partially completed','Failed','Could not complete','Engineering review required'))
);

create table if not exists public.mi_work_order_verifications (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public."Tenant"("id") on delete cascade,
  site_id text not null,
  work_order_id uuid not null references public.mi_work_orders(id) on delete cascade,
  verification_method text not null,
  verification_result text not null,
  verified_by text not null,
  verification_date date not null default current_date,
  evidence_document_id text null,
  linked_test_record_id text null,
  linked_inspection_record_id text null,
  equipment_restored boolean not null default false,
  deficiency_corrected boolean not null default false,
  temporary_controls_removed boolean not null default false,
  readiness_impact_cleared boolean not null default false,
  startup_blocker_cleared boolean not null default false,
  closure_notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mi_work_order_verifications_result_check check (verification_result in ('Accepted','Rejected','Rework Required','Engineering Review Required'))
);

create table if not exists public.mi_work_order_linked_records (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public."Tenant"("id") on delete cascade,
  site_id text not null,
  work_order_id uuid not null references public.mi_work_orders(id) on delete cascade,
  linked_module text not null,
  linked_record_id text not null,
  linked_record_number text null,
  relationship_type text not null default 'Reference',
  required_for_close boolean not null default false,
  status_snapshot text null,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.mi_work_order_action_links (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public."Tenant"("id") on delete cascade,
  site_id text not null,
  work_order_id uuid not null references public.mi_work_orders(id) on delete cascade,
  action_id text not null,
  action_source text not null default 'Universal Action Engine',
  relationship_type text not null default 'Corrective Action',
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.mi_work_order_approvals (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public."Tenant"("id") on delete cascade,
  site_id text not null,
  work_order_id uuid not null references public.mi_work_orders(id) on delete cascade,
  approval_stage text not null default 'Approval',
  approver_role text null,
  approver_user_id text null,
  action text not null,
  comments text null,
  e_signature_id text null,
  acted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint mi_work_order_approvals_action_check check (action in ('Approved','Rejected','Requested','Withdrawn'))
);
