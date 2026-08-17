import { RestrictionStatusBadge } from '../shared/RestrictionStatusBadge';
import { KeyValueGrid, cardValue } from '../safeguards/SafeguardUiPrimitives';
import type { MiReadinessRestriction } from '../types/readiness.types';

export function RestrictionList({ restrictions }: { restrictions?: MiReadinessRestriction[] | undefined }) {
  if (!restrictions?.length) return <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-5 text-sm text-[var(--psm-muted)]">No operating restrictions recorded.</div>;
  return (
    <div className="grid gap-3">
      {restrictions.map((item) => (
        <article key={item.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{cardValue(item.restriction_type)}</h3>
              <p className="text-sm text-[var(--psm-muted)]">{item.restriction_description}</p>
            </div>
            <RestrictionStatusBadge status={item.status} />
          </div>
          <KeyValueGrid items={[
            ['Reduced pressure', item.reduced_pressure],
            ['Reduced temperature', item.reduced_temperature],
            ['Reduced rate', item.reduced_rate],
            ['Additional monitoring', item.additional_monitoring],
            ['Temporary controls', item.temporary_controls],
            ['Expiry', item.expiry_date],
            ['Owner', item.owner_user_id]
          ]} />
        </article>
      ))}
    </div>
  );
}
