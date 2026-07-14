create index if not exists idx_incident_history_events_tenant_incident_created on public.incident_history_events (tenant_id, incident_id, created_at desc);
create index if not exists idx_incident_history_events_type on public.incident_history_events (tenant_id, incident_id, event_type);
create index if not exists idx_incident_history_events_tab on public.incident_history_events (tenant_id, incident_id, related_tab);
create index if not exists idx_incident_history_events_actor on public.incident_history_events (tenant_id, incident_id, actor_user_id);
create index if not exists idx_incident_history_events_record on public.incident_history_events (tenant_id, related_record_type, related_record_id);
