-- Mechanical Integrity Phase 6 - consequence/likelihood scores.

create table if not exists public.mi_criticality_consequence_scores (
  id text primary key default gen_random_uuid()::text,
  assessment_id text not null references public.mi_criticality_assessments(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  equipment_id text not null,
  dimension_key text not null,
  dimension_label text not null,
  score numeric,
  score_label text,
  description text,
  justification text,
  evidence_document_id text,
  weight numeric not null default 1,
  required boolean not null default true,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, dimension_key)
);

create table if not exists public.mi_criticality_likelihood_scores (
  id text primary key default gen_random_uuid()::text,
  assessment_id text not null references public.mi_criticality_assessments(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  equipment_id text not null,
  dimension_key text not null,
  dimension_label text not null,
  score numeric,
  score_label text,
  description text,
  justification text,
  data_source text,
  auto_suggested_score numeric,
  manual_override_score numeric,
  override_reason text,
  weight numeric not null default 1,
  required boolean not null default true,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, dimension_key)
);
