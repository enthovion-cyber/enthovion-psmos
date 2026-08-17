-- Mechanical Integrity Phase 5 - inspection evidence/report document links.

create table if not exists public.mi_inspection_record_documents (
  id text primary key default gen_random_uuid()::text,
  company_id text not null references public."Company"(id) on delete cascade,
  site_id text not null references public."Site"(id) on delete cascade,
  inspection_record_id text not null references public.mi_inspection_records(id) on delete cascade,
  equipment_id text not null references public.mi_equipment(id) on delete cascade,
  document_id text null,
  file_id text null,
  document_type text not null default 'Evidence',
  title text not null,
  version text null,
  status text not null default 'Linked',
  linked_by text not null,
  linked_at timestamptz not null default now()
);
