create table if not exists public.mi_readiness_action_links (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public."Tenant"("id") on delete cascade,
  site_id text not null,
  assessment_id uuid not null references public.mi_readiness_assessments(id) on delete cascade,
  blocker_id uuid null references public.mi_readiness_blockers(id) on delete set null,
  action_id text not null references public."Action"("id") on delete cascade,
  relationship_type text not null default 'Readiness Corrective Action',
  created_by text null,
  created_at timestamptz not null default now(),
  constraint mi_readiness_action_links_unique unique (company_id, assessment_id, action_id)
);

alter table public.mi_readiness_history_events
  add column if not exists event_category text null,
  add column if not exists related_record_type text null,
  add column if not exists related_record_id text null,
  add column if not exists related_record_number text null,
  add column if not exists actor_role text null,
  add column if not exists severity text null,
  add column if not exists reason text null,
  add column if not exists metadata_json jsonb null,
  add column if not exists audit_log_id text null,
  add column if not exists correlation_id text null;

create index if not exists idx_mi_readiness_action_links_company_site on public.mi_readiness_action_links(company_id, site_id);
create index if not exists idx_mi_readiness_action_links_assessment on public.mi_readiness_action_links(assessment_id);
create index if not exists idx_mi_readiness_action_links_action on public.mi_readiness_action_links(action_id);
create index if not exists idx_mi_readiness_history_category on public.mi_readiness_history_events(company_id, site_id, event_category);

alter table public.mi_readiness_action_links enable row level security;

drop policy if exists mi_readiness_action_links_select on public.mi_readiness_action_links;
create policy mi_readiness_action_links_select on public.mi_readiness_action_links
  for select using (company_id = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId', company_id));

drop policy if exists mi_readiness_action_links_modify on public.mi_readiness_action_links;
create policy mi_readiness_action_links_modify on public.mi_readiness_action_links
  for all using (company_id = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId', company_id))
  with check (company_id = coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'tenantId', company_id));
