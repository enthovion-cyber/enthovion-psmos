import type { AuditProgram } from '../types/audit.types';

export function validateAuditProgramDraft(program: Partial<AuditProgram>) {
  const missing: string[] = [];
  if (!program.program_title?.trim()) missing.push('Program title');
  if (!program.program_code?.trim()) missing.push('Program code');
  if (!program.audit_type) missing.push('Audit type');
  if (!program.program_category) missing.push('Program category');
  if (!program.criticality) missing.push('Criticality');
  return missing;
}

export function validateAuditProgramActivation(program: Partial<AuditProgram>) {
  const missing = validateAuditProgramDraft(program);
  if (!(program.scopes ?? []).length) missing.push('At least one scope');
  if (!(program.standards ?? []).length) missing.push('At least one standard/regulation');
  if (!(program.modules ?? []).length) missing.push('At least one covered module');
  if (!program.frequency?.audit_frequency) missing.push('Audit frequency');
  if (!program.owner_user_id) missing.push('Program owner');
  if (!program.next_review_due && !program.frequency?.next_program_review_due) missing.push('Next review due');
  if (['Safety-Critical', 'Regulatory-Critical'].includes(String(program.criticality)) && !program.reviewer_user_id) missing.push('Program reviewer');
  return missing;
}
