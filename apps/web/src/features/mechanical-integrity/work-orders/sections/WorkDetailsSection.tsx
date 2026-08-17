'use client';

import type { MiWorkOrderLookups } from '../../types/work-order.types';
import { Check, Field, Input, Select } from './WorkOrderFields';

export function WorkDetailsSection({ values, lookups, onChange }: { values: Record<string, any>; lookups?: MiWorkOrderLookups | undefined; onChange: (key: string, value: unknown) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Work order title"><Input value={values.title} onChange={(value) => onChange('title', value)} /></Field>
        <Field label="Work order type"><Select value={values.workOrderType} onChange={(value) => onChange('workOrderType', value)} options={lookups?.workOrderTypes} /></Field>
        <Field label="Work category"><Select value={values.workCategory} onChange={(value) => onChange('workCategory', value)} options={lookups?.workCategories} /></Field>
        <Field label="Work reason"><Input value={values.workReason} onChange={(value) => onChange('workReason', value)} /></Field>
        {['description','requiredWorkScope','repairMethod','expectedOutcome','acceptanceCriteria','workInstructions','dueDate','ownerUserId','assignedUserId','assignedTeamId','contractorVendor','notes'].map((key) => <Field key={key} label={key.replace(/([A-Z])/g, ' $1')}><Input value={values[key]} onChange={(value) => onChange(key, value)} /></Field>)}
      </div>
      <div className="grid gap-2 md:grid-cols-2"><Check label="Completion evidence required" checked={values.completionEvidenceRequired} onChange={(value) => onChange('completionEvidenceRequired', value)} /><Check label="Verification required" checked={values.verificationRequired} onChange={(value) => onChange('verificationRequired', value)} /></div>
    </div>
  );
}
