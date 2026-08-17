import { PsiCard, PsiEmptyState } from '../../shared/PsiUi';
import type { EquipmentDesignDetail } from '../../types/equipment-design.types';

export function EquipmentDesignChangeHistoryTab({ detail }: { detail: EquipmentDesignDetail }) {
  if (!detail.history.length) return <PsiEmptyState title="No equipment design history yet" message="Create, update, conflict check, completeness check, MI sync, document link, review, archive, and import events will appear here from immutable PSI history." />;
  return (
    <PsiCard title="Change History" subtitle="Immutable PSI equipment design basis history and audit integration.">
      <div className="space-y-3">
        {detail.history.map((event) => (
          <div key={String(event.id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{String(event.event_title ?? event.event_type ?? 'History event')}</p>
              <span className="text-xs text-[var(--psm-muted)]">{event.created_at ? new Date(String(event.created_at)).toLocaleString() : 'No timestamp'}</span>
            </div>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">{String(event.event_description ?? event.reason ?? 'No event description returned.')}</p>
          </div>
        ))}
      </div>
    </PsiCard>
  );
}
