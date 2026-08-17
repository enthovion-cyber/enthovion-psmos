-- Mechanical Integrity Phase 6 - review records.

create table if not exists public.mi_criticality_reviews (
  id text primary key default gen_random_uuid()::text,
  assessment_id text not null references public.mi_criticality_assessments(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  equipment_id text not null,
  reviewer_user_id text,
  review_action text not null,
  review_comments text,
  signature_id text,
  critical_risk_acknowledged boolean not null default false,
  config_snapshot_acknowledged boolean not null default false,
  created_by text,
  created_at timestamptz not null default now()
);
