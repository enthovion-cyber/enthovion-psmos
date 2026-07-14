create index if not exists idx_incident_barrier_analysis_tenant_incident on public.incident_barrier_analysis (tenant_id, incident_id);
create index if not exists idx_incident_barriers_tenant_incident on public.incident_barriers (tenant_id, incident_id);
create index if not exists idx_incident_barriers_site on public.incident_barriers (tenant_id, site_id);
create index if not exists idx_incident_barriers_status on public.incident_barriers (tenant_id, performance_status, failure_status);
create index if not exists idx_incident_barriers_type on public.incident_barriers (tenant_id, barrier_type);
create index if not exists idx_incident_barriers_followup on public.incident_barriers (tenant_id, followup_required) where deleted_at is null;
create index if not exists idx_incident_barrier_followups_incident on public.incident_barrier_followups (tenant_id, incident_id);
create index if not exists idx_incident_barrier_followups_barrier on public.incident_barrier_followups (tenant_id, barrier_id);
create index if not exists idx_incident_barrier_reviews_incident on public.incident_barrier_reviews (tenant_id, incident_id, created_at desc);
