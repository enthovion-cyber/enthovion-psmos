export function validateRegulatoryItem(values: Record<string, unknown>, finalStatus = values.register_status) {
  const errors: string[] = [];
  const activeLike = finalStatus && finalStatus !== 'Draft';
  if (activeLike && !String(values.requirement_title ?? '').trim()) errors.push('Requirement title is required.');
  if (activeLike && !String(values.source_type ?? '').trim()) errors.push('Source type is required.');
  if (activeLike && !String(values.jurisdiction_level ?? '').trim()) errors.push('Jurisdiction level is required.');
  if (activeLike && !String(values.category ?? '').trim()) errors.push('Category is required.');
  if (activeLike && !String(values.criticality ?? '').trim()) errors.push('Criticality is required.');
  if (finalStatus === 'Active' && !String(values.owner_user_id ?? '').trim()) errors.push('Active requirement requires an owner.');
  if (finalStatus === 'Active' && values.review_frequency !== 'On Change' && !String(values.next_review_date ?? '').trim()) errors.push('Active requirement requires a next review date.');
  if (['Critical', 'Safety-Critical', 'Environmental-Critical', 'PSM-Critical', 'Regulatory-Critical'].includes(String(values.criticality ?? '')) && !String(values.risk_basis ?? '').trim()) errors.push('Critical requirements require a risk basis.');
  if (values.applicability_status === 'Not Applicable' && !String(values.applicability_rationale ?? '').trim()) errors.push('Not Applicable requires an applicability rationale.');
  if (['Compliant Foundation', 'Partially Compliant Foundation', 'Non-Compliant Foundation'].includes(String(values.compliance_status ?? '')) && !String(values.status_rationale ?? '').trim()) errors.push('Compliance status foundation requires a rationale.');
  return errors;
}
