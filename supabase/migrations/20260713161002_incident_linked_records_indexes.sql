create index if not exists idx_incident_linked_records_tenant_incident on public.incident_linked_records (tenant_id, incident_id);
create index if not exists idx_incident_linked_records_site on public.incident_linked_records (tenant_id, site_id);
create index if not exists idx_incident_linked_records_module on public.incident_linked_records (tenant_id, incident_id, module, record_type);
create index if not exists idx_incident_linked_records_status on public.incident_linked_records (tenant_id, incident_id, link_status, update_required);
create index if not exists idx_incident_linked_records_record on public.incident_linked_records (tenant_id, module, record_type, record_id);
create index if not exists idx_incident_required_links_incident on public.incident_required_links (tenant_id, incident_id, required_link_type);
create index if not exists idx_incident_record_impacts_incident on public.incident_record_impacts (tenant_id, incident_id, linked_record_id);
create index if not exists idx_incident_record_impacts_status on public.incident_record_impacts (tenant_id, incident_id, update_status, update_required);
create index if not exists idx_incident_linked_record_reviews_incident on public.incident_linked_record_reviews (tenant_id, incident_id, created_at desc);
