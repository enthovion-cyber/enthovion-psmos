-- Keeps Create from HAZOP operational when the original Phase 1 migration was applied incompletely.
do $$
begin
  if to_regclass('public.lopa_studies') is not null then
    create table if not exists public.lopa_source_snapshots (
      id text primary key,
      tenant_id text not null,
      lopa_study_id text references public.lopa_studies(id) on delete cascade,
      source_module text not null,
      source_record_id text not null,
      source_payload jsonb not null default '{}'::jsonb,
      created_by text,
      created_at timestamptz not null default now()
    );

    alter table public.lopa_source_snapshots
      add column if not exists source_payload jsonb not null default '{}'::jsonb,
      add column if not exists created_by text,
      add column if not exists created_at timestamptz not null default now();

    create index if not exists lopa_source_snapshots_study_idx
      on public.lopa_source_snapshots (tenant_id, lopa_study_id);

    alter table public.lopa_source_snapshots enable row level security;
    grant select, insert, update, delete on public.lopa_source_snapshots to authenticated;
  end if;
end $$;
