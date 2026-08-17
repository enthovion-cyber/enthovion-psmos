-- Mechanical Integrity Phase 5 - inspection review and approval audit records.

create table if not exists public.mi_inspection_record_reviews (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Company"(id) on delete cascade,
  site_id text not null references public."Site"(id) on delete cascade,
  inspection_record_id text not null references public.mi_inspection_records(id) on delete cascade,
  reviewer_user_id text not null,
  review_action text not null,
  review_comments text null,
  critical_alerts_acknowledged boolean not null default false,
  findings_acknowledged boolean not null default false,
  e_signature_id text null,
  created_at timestamptz not null default now()
);
