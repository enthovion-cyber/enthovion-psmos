-- Mechanical Integrity Phase 4 - inspection plan controlled document links.

create table if not exists public.mi_inspection_plan_documents (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  site_id text not null,
  plan_id text not null references public.mi_inspection_plans(id) on delete cascade,
  document_id text null,
  file_id text null,
  document_type text not null default 'Reference',
  title text not null,
  version text null,
  status text not null default 'Linked',
  linked_by text null,
  linked_at timestamptz not null default now()
);
