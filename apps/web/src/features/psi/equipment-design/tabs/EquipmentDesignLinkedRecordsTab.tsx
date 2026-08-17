import { PsiCard, PsiEmptyState } from '../../shared/PsiUi';
import type { EquipmentDesignDetail } from '../../types/equipment-design.types';

export function EquipmentDesignLinkedRecordsTab({ detail }: { detail: EquipmentDesignDetail }) {
  const links = [
    { label: 'Equipment Registry', value: detail.designBasis.equipment_id, type: 'Equipment' },
    { label: 'PSI Unit', value: detail.designBasis.unit_id, type: 'Unit' },
    { label: 'Mechanical Integrity impact', value: detail.designBasis.mi_readiness_impact ? 'Readiness impact' : '', type: 'MI' },
    { label: 'MOC requirement', value: detail.designBasis.moc_update_required ? 'MOC update required' : '', type: 'MOC' },
    { label: 'PSSR blocker', value: detail.designBasis.pssr_blocker ? 'PSSR blocker active' : '', type: 'PSSR' }
  ].filter((link) => link.value);
  if (!links.length) return <PsiEmptyState title="No linked records" message="No Equipment Registry, MI, SOL, relief, MOC, PSSR, HAZOP, LOPA, PTW, or training links were returned by backend." />;
  return (
    <PsiCard title="Linked Records" subtitle="Backend-derived relationship snapshot for Equipment Registry, MI, SOL, relief, MOC, PSSR, HAZOP, LOPA, PTW, and training workflows.">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {links.map((link) => (
          <div key={`${link.type}-${link.label}`} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{link.type}</p>
            <p className="mt-1 font-semibold">{link.label}</p>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">{String(link.value)}</p>
          </div>
        ))}
      </div>
    </PsiCard>
  );
}
