alter table public.incident_history_events enable row level security;

drop policy if exists "incident_history_events tenant select" on public.incident_history_events;
drop policy if exists "incident_history_events tenant insert" on public.incident_history_events;
drop policy if exists "incident_history_events tenant update blocked" on public.incident_history_events;
drop policy if exists "incident_history_events tenant delete blocked" on public.incident_history_events;

create policy "incident_history_events tenant select"
on public.incident_history_events
for select
to authenticated
using (tenant_id = coalesce((auth.jwt() ->> 'tenantId'), (auth.jwt() ->> 'tenant_id')));

create policy "incident_history_events tenant insert"
on public.incident_history_events
for insert
to authenticated
with check (tenant_id = coalesce((auth.jwt() ->> 'tenantId'), (auth.jwt() ->> 'tenant_id')));

create policy "incident_history_events tenant update blocked"
on public.incident_history_events
for update
to authenticated
using (false)
with check (false);

create policy "incident_history_events tenant delete blocked"
on public.incident_history_events
for delete
to authenticated
using (false);
