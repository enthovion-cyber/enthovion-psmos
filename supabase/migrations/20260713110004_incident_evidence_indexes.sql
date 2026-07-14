create index if not exists idx_incident_initial_evidence_status on public.incident_initial_evidence(tenant_id, incident_id, status);
create index if not exists idx_incident_initial_evidence_review on public.incident_initial_evidence(tenant_id, incident_id, review_status);
create index if not exists idx_incident_initial_evidence_required on public.incident_initial_evidence(tenant_id, incident_id, required_evidence);
create index if not exists idx_incident_evidence_versions_evidence on public.incident_evidence_versions(tenant_id, evidence_id, version_number desc);
create index if not exists idx_incident_evidence_mappings_incident on public.incident_evidence_mappings(tenant_id, incident_id, evidence_id);
create index if not exists idx_incident_evidence_custody_incident on public.incident_evidence_custody_events(tenant_id, incident_id, evidence_id, event_at desc);
create index if not exists idx_incident_evidence_document_links_incident on public.incident_evidence_document_links(tenant_id, incident_id, evidence_id);
