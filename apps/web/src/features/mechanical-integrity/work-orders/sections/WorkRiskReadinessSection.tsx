'use client';

import type { MiWorkOrderLookups } from '../../types/work-order.types';
import { Check, Field, Input, Select } from './WorkOrderFields';

export function WorkRiskReadinessSection({ values, lookups, onChange }: { values: Record<string, any>; lookups?: MiWorkOrderLookups | undefined; onChange: (key: string, value: unknown) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Priority"><Select value={values.priority} onChange={(value) => onChange('priority', value)} options={lookups?.priorities} /></Field>
        <Field label="Risk level"><Select value={values.riskLevel} onChange={(value) => onChange('riskLevel', value)} options={lookups?.riskLevels} /></Field>
        <Field label="Readiness impact"><Input value={values.readinessImpact} onChange={(value) => onChange('readinessImpact', value)} /></Field>
        <Field label="Startup blocker reason"><Input value={values.startupBlockerReason} onChange={(value) => onChange('startupBlockerReason', value)} /></Field>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">{(['safetyCriticalWork','psmCriticalWork','startupBlocker','operationAllowedBeforeCompletion','temporaryControlRequired','ffsRequired','engineeringReviewRequired','mocRequired','mocSuggested','pssrImpact','lopaSilImpact'] as string[]).map((key) => <Check key={key} label={key.replace(/([A-Z])/g, ' $1')} checked={values[key]} onChange={(value) => onChange(key, value)} />)}</div>
      <Field label="Temporary control description"><Input value={values.temporaryControlDescription} onChange={(value) => onChange('temporaryControlDescription', value)} /></Field>
    </div>
  );
}
