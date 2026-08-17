'use client';

import { KeyValueGrid, SectionCard } from '../../safeguards/SafeguardUiPrimitives';
import { RestrictionList } from '../RestrictionList';
import type { MiReadinessRestriction } from '../../types/readiness.types';

type Props = {
  form: Record<string, any>;
  restrictions?: MiReadinessRestriction[];
  onChange: (key: string, value: unknown) => void;
};

export function RestrictionsConditionsSection({ form, restrictions, onChange }: Props) {
  return (
    <SectionCard title="5. Restrictions / Conditions" description="Capture operating limits, controls, review date, and accountable owner for Fit With Restrictions or temporary deviation decisions.">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="grid gap-3">
          <label className="text-sm font-semibold">Restriction description
            <textarea rows={3} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.restrictionDescription} onChange={(event) => onChange('restrictionDescription', event.target.value)} />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-semibold">Restriction type
              <input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.restrictionType} onChange={(event) => onChange('restrictionType', event.target.value)} />
            </label>
            <label className="text-sm font-semibold">Expiry / next review
              <input type="date" className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.restrictionExpiryDate} onChange={(event) => onChange('restrictionExpiryDate', event.target.value)} />
            </label>
            <label className="text-sm font-semibold">Owner user ID
              <input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.restrictionOwnerUserId} onChange={(event) => onChange('restrictionOwnerUserId', event.target.value)} />
            </label>
            <label className="text-sm font-semibold">Reduced pressure / rate / temperature
              <input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.reducedLimits} onChange={(event) => onChange('reducedLimits', event.target.value)} />
            </label>
          </div>
          <label className="text-sm font-semibold">Temporary controls / monitoring
            <textarea rows={3} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.temporaryControls} onChange={(event) => onChange('temporaryControls', event.target.value)} />
          </label>
        </div>
        <div className="space-y-3">
          <KeyValueGrid items={[
            ['Active restriction required when decision is restricted', 'Yes'],
            ['Owner required', 'Yes'],
            ['Expiry/review required', 'Yes']
          ]} />
          <RestrictionList restrictions={restrictions ?? []} />
        </div>
      </div>
    </SectionCard>
  );
}
