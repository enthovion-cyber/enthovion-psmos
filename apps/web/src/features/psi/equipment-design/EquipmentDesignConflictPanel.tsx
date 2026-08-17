import { DesignBasisConflictBadge } from '../shared/DesignBasisConflictBadge';
import { PsiCard, PsiEmptyState } from '../shared/PsiUi';

export function EquipmentDesignConflictPanel({ conflicts }: { conflicts: Array<Record<string, unknown>> }) {
  if (!conflicts.length) return <PsiEmptyState title="No design conflicts found" message="The backend conflict engine did not return SOL, relief, MI, material, document, MOC, or PSSR conflicts for this record." />;
  return (
    <PsiCard title="Conflict Results" subtitle="Backend-generated conflicts across SOL, relief, MI, material compatibility, documents, MOC/PSSR, and linked PSI data.">
      <div className="space-y-3">
        {conflicts.map((conflict) => (
          <div key={String(conflict.id ?? conflict.conflict_key)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{String(conflict.conflict_title ?? conflict.conflict_key ?? 'Conflict')}</p>
              <DesignBasisConflictBadge value={String(conflict.status ?? conflict.severity ?? 'Open')} />
            </div>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">{String(conflict.description ?? conflict.recommended_resolution ?? 'No description returned by backend.')}</p>
            {conflict.override_reason ? <p className="mt-2 text-xs text-warning">Override: {String(conflict.override_reason)}</p> : null}
          </div>
        ))}
      </div>
    </PsiCard>
  );
}
