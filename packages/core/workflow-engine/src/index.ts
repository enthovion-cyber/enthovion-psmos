export type WorkflowDecision = 'Approved' | 'Rejected' | 'Returned' | 'Overridden';

export type WorkflowConditionRule = {
  field?: string;
  operator?: 'eq' | 'neq' | 'in' | 'not_in' | 'exists' | 'gte' | 'lte';
  value?: unknown;
  all?: WorkflowConditionRule[];
  any?: WorkflowConditionRule[];
};

export type WorkflowTemplateStep = {
  id: string;
  stepName: string;
  stepType: 'Approval' | 'Review' | 'Signoff' | 'Task' | 'System Check';
  sequence: number;
  approvalMode: 'Single' | 'All' | 'Any';
  parallelGroup?: string | null;
  conditionRule?: WorkflowConditionRule | null;
  slaHours?: number | null;
  isRequired: boolean;
  canReject: boolean;
  canOverride: boolean;
};

export type WorkflowRuntimeStep = WorkflowTemplateStep & {
  status: 'Pending' | 'Active' | 'Approved' | 'Rejected' | 'Skipped' | 'Overridden' | 'Returned';
  dueAt?: string | null;
};

export function nextEligibleSequence(steps: WorkflowRuntimeStep[], afterSequence = 0) {
  return steps
    .filter((step) => step.isRequired && step.status === 'Pending' && step.sequence > afterSequence)
    .sort((a, b) => a.sequence - b.sequence)[0]?.sequence ?? null;
}

export function sequenceComplete(steps: WorkflowRuntimeStep[], sequence: number) {
  return steps
    .filter((step) => step.isRequired && step.sequence === sequence)
    .every((step) => ['Approved', 'Skipped', 'Overridden'].includes(step.status));
}
