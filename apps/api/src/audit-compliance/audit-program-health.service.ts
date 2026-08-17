import { Injectable } from '@nestjs/common';
import { configurationHealthStatuses } from './audit-compliance.constants';

export type AuditHealthInput = {
  program?: Record<string, any> | null;
  scopes?: Record<string, any>[];
  standards?: Record<string, any>[];
  modules?: Record<string, any>[];
  frequency?: Record<string, any> | null;
  settings?: Record<string, any> | null;
};

@Injectable()
export class AuditProgramHealthService {
  calculate(input: AuditHealthInput) {
    const settings = input.settings ?? {};
    const program = input.program ?? {};
    const missing: string[] = [];
    if ((settings.require_scope_for_activation ?? true) && !(input.scopes ?? []).length) missing.push('Missing Scope');
    if ((settings.require_standards_for_activation ?? true) && !(input.standards ?? []).length) missing.push('Missing Standards');
    if (!program.owner_user_id && (settings.require_owner_for_activation ?? true)) missing.push('Missing Owner');
    if (!input.frequency?.audit_frequency) missing.push('Missing Frequency');
    if (!(input.modules ?? []).length) missing.push('Missing Modules');
    if (program.next_review_due && new Date(program.next_review_due).getTime() < Date.now() && (settings.auto_mark_review_overdue ?? true)) missing.push('Review Overdue');
    const criticality = String(program.criticality ?? '');
    if (!program.reviewer_user_id && ((criticality === 'Safety-Critical' && (settings.require_reviewer_for_safety_critical ?? true)) || (criticality === 'Regulatory-Critical' && (settings.require_reviewer_for_regulatory_critical ?? true)))) {
      missing.push('Needs Approval');
    }
    const uniqueMissing = [...new Set(missing)];
    const health = uniqueMissing[0] ?? 'Complete';
    const readyForScheduling = uniqueMissing.length === 0 && ['Active', 'Approved', 'Ready For Scheduling'].includes(String(program.program_status ?? ''));
    return {
      health: configurationHealthStatuses.includes(health as any) ? health : 'Configuration Incomplete',
      missing: uniqueMissing,
      readyForScheduling
    };
  }
}
