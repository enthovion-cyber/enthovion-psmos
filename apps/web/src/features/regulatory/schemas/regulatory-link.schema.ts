export function validateRegulatoryLink(values: Record<string, unknown>) {
  const errors: string[] = [];
  if (!String(values.linked_module ?? values.linkedModule ?? '').trim()) errors.push('Linked module is required.');
  if (!String(values.linked_record_id ?? values.linkedRecordId ?? '').trim()) errors.push('Linked record ID is required.');
  return errors;
}
