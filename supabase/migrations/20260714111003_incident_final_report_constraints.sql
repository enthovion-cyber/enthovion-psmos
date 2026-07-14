alter table public.incident_report_templates
  drop constraint if exists incident_report_templates_type_check,
  add constraint incident_report_templates_type_check check (template_type in (
    'Full investigation report',
    'Executive summary',
    'PSM incident report',
    'Near miss report',
    'Regulatory support package',
    'CAPA summary report',
    'Lessons learned bulletin',
    'Evidence index',
    'Audit trail report',
    'Custom company/site template'
  ));

alter table public.incident_reports
  drop constraint if exists incident_reports_status_check,
  add constraint incident_reports_status_check check (status in (
    'Draft',
    'Generating',
    'Generated',
    'Failed',
    'Ready for Review',
    'Official',
    'Published',
    'Superseded',
    'Archived'
  ));

alter table public.incident_report_exports
  drop constraint if exists incident_report_exports_status_check,
  add constraint incident_report_exports_status_check check (status in (
    'Requested',
    'Running',
    'Completed',
    'Failed',
    'Archived'
  ));

alter table public.incident_report_reviews
  drop constraint if exists incident_report_reviews_status_check,
  add constraint incident_report_reviews_status_check check (status in (
    'Requested',
    'In Review',
    'Approved',
    'Rejected',
    'Reopened'
  ));

alter table public.incident_reports
  drop constraint if exists incident_reports_report_number_unique,
  add constraint incident_reports_report_number_unique unique (tenant_id, incident_id, report_number);

alter table public.incident_report_snapshots
  drop constraint if exists incident_report_snapshots_number_unique,
  add constraint incident_report_snapshots_number_unique unique (tenant_id, incident_id, snapshot_number);

do $$
declare
  tenant_record record;
  permission_row text[];
  permission_label text;
  permission_rows text[][] := array[
    array['incidents.final_report.view', 'View Incident Final Report'],
    array['incidents.final_report.configure', 'Configure Incident Final Report'],
    array['incidents.final_report.preview', 'Preview Incident Final Report'],
    array['incidents.final_report.generate', 'Generate Incident Final Report'],
    array['incidents.final_report.download', 'Download Incident Final Report'],
    array['incidents.final_report.export', 'Export Incident Final Report'],
    array['incidents.final_report.mark_official', 'Mark Incident Final Report Official'],
    array['incidents.final_report.publish', 'Publish Incident Final Report'],
    array['incidents.final_report.supersede', 'Supersede Incident Final Report'],
    array['incidents.final_report.archive', 'Archive Incident Final Report'],
    array['incidents.final_report.review.request', 'Request Incident Final Report Review'],
    array['incidents.final_report.review.approve', 'Approve Incident Final Report Review'],
    array['incidents.final_report.review.reject', 'Reject Incident Final Report Review'],
    array['incidents.evidence.export_package', 'Export Incident Evidence Package']
  ];
begin
  for tenant_record in select id from public."Tenant"
  loop
    foreach permission_row slice 1 in array permission_rows
    loop
      permission_label := permission_row[2];
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_record.id, permission_row[1], 'INCIDENTS', permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_record.id and "key" = permission_row[1]
      );
    end loop;
  end loop;
end $$;
