-- Mechanical Integrity Phase 1 - linked records and documents foundation.

create table if not exists public.mi_equipment_linked_records (
  id text primary key default gen_random_uuid()::text,
  equipment_id text not null references public.mi_equipment(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  linked_module text not null,
  linked_record_id text not null,
  linked_record_number text null,
  link_type text not null default 'Related',
  relationship_description text null,
  created_by text null,
  created_at timestamptz not null default now()
);

create table if not exists public.mi_equipment_documents (
  id text primary key default gen_random_uuid()::text,
  equipment_id text not null references public.mi_equipment(id) on delete cascade,
  company_id text not null,
  site_id text not null,
  document_id text null,
  file_id text null,
  document_type text not null,
  title text not null,
  version text null,
  status text null,
  linked_by text null,
  linked_at timestamptz not null default now()
);
