'use client';

import { useMemo, useState } from 'react';
import { safeOperatingLimitSchema } from '../schemas/safe-operating-limit.schema';
import { PsiButton, PsiErrorState } from '../shared/PsiUi';
import type { SafeOperatingLimitLookups } from '../types/safe-operating-limit.types';
import { ControlsSafeguardsSection } from './sections/ControlsSafeguardsSection';
import { DeviationConsequencesSection } from './sections/DeviationConsequencesSection';
import { LimitDocumentsSection } from './sections/LimitDocumentsSection';
import { LimitIdentitySection } from './sections/LimitIdentitySection';
import { LimitValuesSection } from './sections/LimitValuesSection';
import { OperatingParameterSection } from './sections/OperatingParameterSection';
import { OperatorResponseSection } from './sections/OperatorResponseSection';

export function SafeOperatingLimitForm({ initial, lookups, forcedUnitId, onSubmit, isSaving }: { initial?: Record<string, any> | undefined; lookups?: SafeOperatingLimitLookups | undefined; forcedUnitId?: string | undefined; onSubmit: (input: Record<string, any>) => void; isSaving?: boolean | undefined }) {
  const [value, setValue] = useState<Record<string, any>>({ status: 'Draft', limit_scope: 'Unit-level', criticality: 'Medium', parameter_type: 'Temperature', ...(initial ?? {}), ...(initial?.values ?? {}), ...(forcedUnitId ? { unit_id: forcedUnitId } : {}) });
  const [error, setError] = useState<string | null>(null);
  const disabledReason = useMemo(() => {
    const result = safeOperatingLimitSchema.safeParse(value);
    return result.success ? null : result.error.issues.map((issue) => issue.message).join(' ');
  }, [value]);
  const patch = (input: Record<string, any>) => setValue((current) => ({ ...current, ...input }));
  return (
    <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); const result = safeOperatingLimitSchema.safeParse(value); if (!result.success) { setError(result.error.issues.map((issue) => issue.message).join(' ')); return; } setError(null); onSubmit(value); }}>
      {error ? <PsiErrorState message={error} /> : null}
      <LimitIdentitySection value={value} lookups={lookups} forcedUnitId={forcedUnitId} onChange={patch} />
      <OperatingParameterSection value={value} onChange={patch} />
      <LimitValuesSection value={value} onChange={patch} />
      <DeviationConsequencesSection value={value} onChange={patch} />
      <OperatorResponseSection value={value} onChange={patch} />
      <ControlsSafeguardsSection value={value} lookups={lookups} onChange={patch} />
      <LimitDocumentsSection value={value} onChange={patch} />
      <div className="sticky bottom-4 flex flex-wrap justify-end gap-2 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 shadow-lg">
        <PsiButton variant="secondary" href="/process-safety-information/safe-operating-limits">Cancel</PsiButton>
        <PsiButton type="submit" disabled={isSaving || Boolean(disabledReason)} title={disabledReason ?? undefined}>{isSaving ? 'Saving...' : 'Save Safe Operating Limit'}</PsiButton>
      </div>
    </form>
  );
}
