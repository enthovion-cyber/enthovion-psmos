-- Operating Procedures & Safe Work Practices (OSHA 29 CFR 1910.119(f)) - Phase 6
-- MOC, PSI, HAZOP, & Incident Linking, Automated Change Flags, and MOC Closure Blocker.

create table if not exists public.op_change_flags (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  procedure_id text not null references public.op_procedures(id) on delete cascade,
  source_type text not null,
  source_id text not null,
  source_reference text not null,
  source_title text null,
  priority text not null default 'Medium',
  reason text not null,
  description text null,
  suggested_changes text null,
  status text not null default 'Open',
  blocks_moc_closure boolean not null default true,
  target_revision_id text null references public.op_revisions(id) on delete set null,
  flagged_by_user_id text null references public."User"(id) on delete set null,
  resolved_by_user_id text null references public."User"(id) on delete set null,
  resolved_at timestamptz null,
  resolution_notes text null,
  dismissal_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint op_change_flags_source_check check (source_type in ('MOC','PSI','HAZOP','LOPA','INCIDENT','AUDIT','MANUAL')),
  constraint op_change_flags_priority_check check (priority in ('Low','Medium','High','Critical')),
  constraint op_change_flags_status_check check (status in ('Open','In Progress','Resolved','Dismissed'))
);

create table if not exists public.op_linked_records (
  id text primary key,
  company_id text not null references public."Tenant"(id) on delete cascade,
  site_id text null,
  procedure_id text not null references public.op_procedures(id) on delete cascade,
  revision_id text null references public.op_revisions(id) on delete cascade,
  step_id text null references public.op_steps(id) on delete cascade,
  record_type text not null,
  record_id text not null,
  record_reference text not null,
  record_title text not null,
  sync_status text not null default 'In Sync',
  metadata jsonb not null default '{}'::jsonb,
  created_by text null references public."User"(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint op_linked_records_type_check check (record_type in ('PSI_SOL','PSI_CHEMICAL','PSI_DRAWING','EQUIPMENT','MOC','HAZOP_REC','INCIDENT_CAPA')),
  constraint op_linked_records_sync_check check (sync_status in ('In Sync','Change Flagged','Unlinked'))
);

-- Indexes for performance
create index if not exists idx_op_change_flags_proc on public.op_change_flags(procedure_id, status);
create index if not exists idx_op_change_flags_source on public.op_change_flags(company_id, source_type, source_id);
create index if not exists idx_op_change_flags_status on public.op_change_flags(company_id, status);
create index if not exists idx_op_linked_records_proc on public.op_linked_records(procedure_id, record_type);
create index if not exists idx_op_linked_records_ref on public.op_linked_records(company_id, record_type, record_id);

-- RLS
do $$
declare
  table_name text;
begin
  foreach table_name in array array['op_change_flags', 'op_linked_records'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_select_company_site', table_name);
    execute format('create policy %I on public.%I for select using (public.op_company_site_visible(company_id, site_id))', table_name || '_select_company_site', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_company_site', table_name);
    execute format('create policy %I on public.%I for insert with check (public.op_company_site_visible(company_id, site_id))', table_name || '_insert_company_site', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_company_site', table_name);
    execute format('create policy %I on public.%I for update using (public.op_company_site_visible(company_id, site_id)) with check (public.op_company_site_visible(company_id, site_id))', table_name || '_update_company_site', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_company_site', table_name);
    execute format('create policy %I on public.%I for delete using (public.op_company_site_visible(company_id, site_id))', table_name || '_delete_company_site', table_name);
  end loop;
end $$;

-- MOC Close Blocker Checker Function
create or replace function public.op_check_moc_procedure_blockers(p_company_id text, p_moc_id text)
returns table (
  has_unresolved_flags boolean,
  unresolved_count bigint,
  flagged_procedure_numbers text[]
) language plpgsql security definer as $$
begin
  return query
  select
    count(f.id) > 0 as has_unresolved_flags,
    count(f.id) as unresolved_count,
    coalesce(array_agg(p.procedure_number), '{}'::text[]) as flagged_procedure_numbers
  from public.op_change_flags f
  join public.op_procedures p on p.id = f.procedure_id
  where f.company_id = p_company_id
    and f.source_type = 'MOC'
    and f.source_id = p_moc_id
    and f.blocks_moc_closure = true
    and f.status in ('Open', 'In Progress');
end;
$$;
