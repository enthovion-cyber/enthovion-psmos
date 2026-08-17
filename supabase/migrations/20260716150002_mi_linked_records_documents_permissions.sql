do $$
declare
  permission_key text;
  permission_label text;
begin
  for permission_key, permission_label in
    values
      ('mechanical_integrity.linked_record.view', 'View MI linked records'),
      ('mechanical_integrity.linked_record.create', 'Create MI linked records'),
      ('mechanical_integrity.linked_record.edit', 'Edit MI linked records'),
      ('mechanical_integrity.linked_record.remove', 'Remove MI linked records'),
      ('mechanical_integrity.linked_record.export', 'Export MI linked records'),
      ('mechanical_integrity.document_link.view', 'View MI document links'),
      ('mechanical_integrity.document_link.create', 'Create MI document links'),
      ('mechanical_integrity.document_link.remove', 'Remove MI document links'),
      ('mechanical_integrity.document_link.request', 'Request MI documents'),
      ('mechanical_integrity.document_link.export', 'Export MI document links'),
      ('mechanical_integrity.document_requirement.view', 'View MI document requirements'),
      ('mechanical_integrity.document_requirement.manage', 'Manage MI document requirements'),
      ('mechanical_integrity.document_requirement.evaluate', 'Evaluate MI document requirements'),
      ('mechanical_integrity.document_requirement.waive', 'Request MI document requirement waiver'),
      ('mechanical_integrity.document_requirement.approve_waiver', 'Approve MI document requirement waiver')
  loop
    insert into public."Permission" ("id", "tenantId", "key", "moduleKey", "label")
    select gen_random_uuid()::text, t."id", permission_key, 'MECHANICAL_INTEGRITY', permission_label
    from public."Tenant" t
    where not exists (
      select 1 from public."Permission" p
      where p."tenantId" = t."id" and p."key" = permission_key
    );
  end loop;
end $$;
