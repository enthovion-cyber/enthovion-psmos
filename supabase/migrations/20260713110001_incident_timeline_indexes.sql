create index if not exists idx_incident_timeline_events_incident on public.incident_timeline_events(tenant_id, incident_id, event_time);
create index if not exists idx_incident_timeline_events_phase on public.incident_timeline_events(tenant_id, incident_id, phase);
create index if not exists idx_incident_timeline_events_status on public.incident_timeline_events(tenant_id, incident_id, status);
create index if not exists idx_incident_timeline_gaps_incident on public.incident_timeline_gaps(tenant_id, incident_id, status);
create index if not exists idx_incident_timeline_gaps_event on public.incident_timeline_gaps(tenant_id, timeline_event_id);
