alter table public.incident_reporting_determinations
  drop constraint if exists incident_reporting_determinations_status_chk,
  add constraint incident_reporting_determinations_status_chk check (determination_status in ('Not Determined','Required','Not Required','Pending Review','Reviewed','Overridden')),
  drop constraint if exists incident_reporting_determinations_required_chk,
  add constraint incident_reporting_determinations_required_chk check (reporting_required in ('Yes','No','Not Determined')),
  drop constraint if exists incident_reporting_determinations_review_chk,
  add constraint incident_reporting_determinations_review_chk check (review_status in ('Not Requested','Requested','In Review','Approved','Rejected','Reopened'));

alter table public.incident_notifications
  drop constraint if exists incident_notifications_status_chk,
  add constraint incident_notifications_status_chk check (status in ('Draft','Queued','Sent','Delivered','Acknowledged','Failed','Cancelled','Overdue acknowledgement')),
  drop constraint if exists incident_notifications_channel_chk,
  add constraint incident_notifications_channel_chk check (channel in ('In-app','Email','SMS','Teams','Phone','External letter','Portal','Other'));

alter table public.incident_regulatory_reports
  drop constraint if exists incident_regulatory_reports_status_chk,
  add constraint incident_regulatory_reports_status_chk check (status in ('Not Determined','Required','Not Required','Draft','Data Missing','Ready for Review','Pending Approval','Approved','Submitted','Acknowledged','Rejected','Overdue','Cancelled')),
  drop constraint if exists incident_regulatory_reports_required_status_chk,
  add constraint incident_regulatory_reports_required_status_chk check (required_status in ('Yes','No','Not Determined','Required','Not Required'));

alter table public.incident_reporting_requirements
  drop constraint if exists incident_reporting_requirements_status_chk,
  add constraint incident_reporting_requirements_status_chk check (status in ('Missing','Incomplete','Complete','Not Required','Blocked','Redacted'));

alter table public.incident_external_stakeholder_notifications
  drop constraint if exists incident_external_stakeholder_status_chk,
  add constraint incident_external_stakeholder_status_chk check (status in ('Not Determined','Required','Not Required','Draft','Queued','Sent','Acknowledged','Failed','Overdue','Cancelled'));

alter table public.incident_reporting_reviews
  drop constraint if exists incident_reporting_reviews_status_chk,
  add constraint incident_reporting_reviews_status_chk check (status in ('Requested','In Review','Approved','Rejected','Reopened','Not Requested'));

create unique index if not exists uq_incident_reporting_determination_one
  on public.incident_reporting_determinations(tenant_id, incident_id);

create unique index if not exists uq_incident_reporting_requirement_key
  on public.incident_reporting_requirements(tenant_id, incident_id, coalesce(report_id, ''), requirement_key);
