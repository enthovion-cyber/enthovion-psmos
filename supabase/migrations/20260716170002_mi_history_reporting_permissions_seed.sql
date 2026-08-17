do $$
declare
  tenant_row record;
  permission_key text;
  permission_label text;
begin
  for tenant_row in select "id" from public."Tenant"
  loop
    for permission_key, permission_label in
      select * from (values
        ('mechanical_integrity.history.view', 'View MI history'),
        ('mechanical_integrity.history.view_audit', 'View MI audit trail history'),
        ('mechanical_integrity.history.export', 'Export MI history'),
        ('mechanical_integrity.report.view', 'View MI reports'),
        ('mechanical_integrity.report.generate', 'Generate MI reports'),
        ('mechanical_integrity.report.manage_templates', 'Manage MI report templates'),
        ('mechanical_integrity.report.schedule', 'Schedule MI reports'),
        ('mechanical_integrity.report.export', 'Export MI reports'),
        ('mechanical_integrity.export.view', 'View MI export center'),
        ('mechanical_integrity.export.create', 'Create MI exports'),
        ('mechanical_integrity.export.download', 'Download MI exports'),
        ('mechanical_integrity.export.include_documents', 'Include documents in MI exports'),
        ('mechanical_integrity.export.include_audit', 'Include audit trail in MI exports'),
        ('mechanical_integrity.export.site_export', 'Run site-level MI exports'),
        ('mechanical_integrity.export.admin_all', 'Run all-scope MI exports')
      ) as permissions(key, label)
    loop
      insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
      select gen_random_uuid()::text, tenant_row."id", permission_key, 'MECHANICAL_INTEGRITY', permission_label
      where not exists (
        select 1 from public."Permission"
        where "tenantId" = tenant_row."id" and "key" = permission_key
      );
    end loop;
  end loop;
end $$;

insert into public.mi_report_templates (
  company_id,
  site_id,
  template_name,
  report_category,
  report_type,
  description,
  config_json,
  output_formats_json,
  created_by
)
select t."id", s."id", template_name, report_category, report_type, description, config_json::jsonb, output_formats_json::jsonb, 'system'
from public."Tenant" t
left join public."Site" s on s."tenantId" = t."id"
cross join (values
  ('MI Executive Summary', 'Management', 'MI Executive Summary', 'High-level site integrity status, overdue work, failed tests, readiness blockers, and approvals.', '{"includeSummaryCharts":true,"includeDetailTables":true}', '["PDF","Excel","CSV"]'),
  ('Equipment Integrity File', 'Equipment', 'Equipment Integrity File', 'Complete audit-ready equipment lifecycle file and export package foundation.', '{"includeDocuments":true,"includeHistory":true,"includeLinkedRecords":true}', '["PDF","Excel","ZIP evidence package","JSON"]'),
  ('Inspection Due / Overdue Report', 'Inspection / CML', 'Inspection Due / Overdue Report', 'Inspection plans, due dates, overdue status, and completion readiness.', '{"moduleFilters":["Inspection Plan","Inspection Record"]}', '["PDF","Excel","CSV"]'),
  ('PSV Due / Overdue Report', 'PSV / Relief', 'PSV Due / Overdue Report', 'Relief device registry, test dates, overdue devices, seals, and certificates.', '{"moduleFilters":["PSV / Relief Device","PSV Test"]}', '["PDF","Excel","CSV"]'),
  ('Fitness-for-Service Report', 'Readiness / Approval', 'Fitness-for-Service Report', 'Readiness decisions, startup blockers, restrictions, approvals, and open blockers.', '{"moduleFilters":["Readiness","Review & Approval"]}', '["PDF","Excel","CSV"]'),
  ('Missing Document Report', 'Documents', 'Missing Document Report', 'Required, missing, expired, waived, and readiness-impacting documents.', '{"moduleFilters":["Documents"]}', '["PDF","Excel","CSV"]')
) as templates(template_name, report_category, report_type, description, config_json, output_formats_json)
where not exists (
  select 1 from public.mi_report_templates existing
  where existing.company_id = t."id"
    and coalesce(existing.site_id, '') = coalesce(s."id", '')
    and existing.template_name = templates.template_name
);
