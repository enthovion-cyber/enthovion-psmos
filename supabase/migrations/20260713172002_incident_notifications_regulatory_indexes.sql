create index if not exists idx_incident_reporting_determinations_incident on public.incident_reporting_determinations(tenant_id, incident_id);
create index if not exists idx_incident_reporting_determinations_status on public.incident_reporting_determinations(tenant_id, site_id, determination_status, review_status);

create index if not exists idx_incident_notifications_incident on public.incident_notifications(tenant_id, incident_id, created_at desc);
create index if not exists idx_incident_notifications_status on public.incident_notifications(tenant_id, site_id, status, acknowledgement_due_at);
create index if not exists idx_incident_notifications_recipient on public.incident_notifications(tenant_id, recipient_user_id, status);

create index if not exists idx_incident_regulatory_reports_incident on public.incident_regulatory_reports(tenant_id, incident_id, created_at desc);
create index if not exists idx_incident_regulatory_reports_deadline on public.incident_regulatory_reports(tenant_id, site_id, status, deadline_at);
create index if not exists idx_incident_regulatory_reports_owner on public.incident_regulatory_reports(tenant_id, owner_id, status);

create index if not exists idx_incident_reporting_requirements_incident on public.incident_reporting_requirements(tenant_id, incident_id, status);
create index if not exists idx_incident_reporting_requirements_report on public.incident_reporting_requirements(tenant_id, report_id);

create index if not exists idx_incident_external_stakeholder_incident on public.incident_external_stakeholder_notifications(tenant_id, incident_id, created_at desc);
create index if not exists idx_incident_external_stakeholder_status on public.incident_external_stakeholder_notifications(tenant_id, site_id, status, deadline_at);

create index if not exists idx_incident_reporting_reviews_incident on public.incident_reporting_reviews(tenant_id, incident_id, created_at desc);
create index if not exists idx_incident_reporting_reviews_status on public.incident_reporting_reviews(tenant_id, site_id, status, due_date);
