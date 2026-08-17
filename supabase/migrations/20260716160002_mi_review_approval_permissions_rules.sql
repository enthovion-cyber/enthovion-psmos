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
        ('mechanical_integrity.review.view', 'View MI review approvals'),
        ('mechanical_integrity.review.inbox', 'View MI approval inbox'),
        ('mechanical_integrity.review.submit', 'Submit MI record for review'),
        ('mechanical_integrity.review.approve', 'Approve MI review item'),
        ('mechanical_integrity.review.reject', 'Reject MI review item'),
        ('mechanical_integrity.review.return', 'Return MI review item for correction'),
        ('mechanical_integrity.review.delegate', 'Delegate MI approval'),
        ('mechanical_integrity.review.escalate', 'Escalate MI approval'),
        ('mechanical_integrity.review.override_validation', 'Override MI approval validation'),
        ('mechanical_integrity.review.configure_rules', 'Configure MI approval rules'),
        ('mechanical_integrity.review.view_internal_comments', 'View internal MI approval comments'),
        ('mechanical_integrity.review.export', 'Export MI approvals')
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

insert into public.mi_approval_rules (
  company_id,
  site_id,
  rule_name,
  source_module,
  record_type,
  risk_level,
  safety_critical,
  psm_critical,
  readiness_impact,
  startup_blocker,
  approval_chain_json,
  e_signature_required,
  due_duration_value,
  due_duration_unit
)
select t."id", s."id", rule_name, source_module, record_type, risk_level, safety_critical, psm_critical, readiness_impact, startup_blocker, approval_chain_json::jsonb, e_signature_required, due_duration_value, due_duration_unit
from public."Tenant" t
left join public."Site" s on s."tenantId" = t."id"
cross join (values
  ('MI Low Risk Owner Review', 'Mechanical Integrity', null, 'Low', false, false, false, false, '[{"stageName":"Owner Review","approverRole":"Equipment Owner","slaHours":24}]', false, 2, 'days'),
  ('MI Medium Risk Engineering Review', 'Mechanical Integrity', null, 'Medium', null, null, null, false, '[{"stageName":"Owner Review","approverRole":"Equipment Owner","slaHours":24},{"stageName":"Engineering Review","approverRole":"Inspection Engineer","slaHours":24}]', false, 3, 'days'),
  ('MI High Risk Process Safety Review', 'Mechanical Integrity', null, 'High', null, null, null, null, '[{"stageName":"Engineering Review","approverRole":"Inspection Engineer","slaHours":24},{"stageName":"HSE / Process Safety Review","approverRole":"HSE Manager","slaHours":24}]', true, 2, 'days'),
  ('MI Critical Management Approval', 'Mechanical Integrity', null, 'Critical', null, null, null, null, '[{"stageName":"Engineering Review","approverRole":"Inspection Engineer","slaHours":24},{"stageName":"HSE / Process Safety Review","approverRole":"HSE Manager","slaHours":24},{"stageName":"Management Approval","approverRole":"Plant Manager","slaHours":24}]', true, 1, 'days'),
  ('Readiness Startup Approval', 'Readiness', null, null, null, null, true, true, '[{"stageName":"Equipment Owner Approval","approverRole":"Equipment Owner","slaHours":24},{"stageName":"Inspection Engineer Approval","approverRole":"Inspection Engineer","slaHours":24},{"stageName":"HSE / Process Safety Approval","approverRole":"HSE Manager","slaHours":24}]', true, 1, 'days'),
  ('Bypass Impairment Approval', 'Bypass / Impairment', null, null, null, null, true, null, '[{"stageName":"Operations Review","approverRole":"Operations Representative","slaHours":12},{"stageName":"Maintenance Review","approverRole":"Maintenance Representative","slaHours":12},{"stageName":"Engineering Approval","approverRole":"Inspection Engineer","slaHours":12},{"stageName":"HSE Approval","approverRole":"HSE Manager","slaHours":12}]', true, 1, 'days'),
  ('Document Waiver Approval', 'Document Waiver', null, null, null, null, true, null, '[{"stageName":"Document Owner Review","approverRole":"Document Owner","slaHours":24},{"stageName":"Engineering Approval","approverRole":"Inspection Engineer","slaHours":24},{"stageName":"HSE Approval","approverRole":"HSE Manager","slaHours":24}]', true, 2, 'days')
) as rules(rule_name, source_module, record_type, risk_level, safety_critical, psm_critical, readiness_impact, startup_blocker, approval_chain_json, e_signature_required, due_duration_value, due_duration_unit)
where not exists (
  select 1 from public.mi_approval_rules existing
  where existing.company_id = t."id"
    and coalesce(existing.site_id, '') = coalesce(s."id", '')
    and existing.rule_name = rules.rule_name
);
