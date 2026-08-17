import { PsiCard } from '../../shared/PsiUi';
import type { ReliefSystemDetail } from '../../types/relief-system.types';

const linked = ['Equipment Registry', 'Equipment Design Basis', 'Safe Operating Limits', 'Mechanical Integrity Relief Device', 'Process Chemistry', 'MOC', 'PSSR', 'HAZOP/PHA', 'LOPA/SIL', 'PTW', 'Training', 'Universal Action Engine'];

export function ReliefLinkedRecordsTab({ detail }: { detail: ReliefSystemDetail }) {
  const basis = detail.reliefBasis;
  return (
    <PsiCard title="Linked Records" subtitle="Required integration links and safe snapshots across PSI, MI, MOC, PSSR, HAZOP, LOPA/SIL, PTW, Training, and Universal Action Engine.">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {linked.map((name) => (
          <div key={name} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
            <p className="font-semibold">{name}</p>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">{name === 'Equipment Registry' ? basis.protected_equipment_id : name === 'Mechanical Integrity Relief Device' ? basis.mi_relief_device_id ?? 'No linked MI relief device' : 'Backend linked-record snapshots are shown when configured.'}</p>
          </div>
        ))}
      </div>
    </PsiCard>
  );
}
