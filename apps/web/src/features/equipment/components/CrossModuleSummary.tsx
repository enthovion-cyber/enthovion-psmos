import type { EquipmentSummary } from '@/services/equipment.service';

export function CrossModuleSummary({ summary, onSelect }: { summary?: EquipmentSummary | undefined; onSelect: (key: string) => void }) {
  const items = [
    ['PTW', summary?.ptwOpen ?? 0, 'ptw'],
    ['MOC', summary?.mocOpen ?? 0, 'moc'],
    ['HAZOP', summary?.hazopOpen ?? 0, 'hazop'],
    ['Documents', summary?.documents ?? 0, 'documents'],
    ['Actions', summary?.actionsOpen ?? 0, 'actions'],
    ['PSSR', summary?.pssrLinked ?? 0, 'pssr']
  ] as const;
  return (
    <div className="psm-card p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">Cross-Module Summary</h2>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {items.map(([label, count, key]) => <button key={key} onClick={() => onSelect(key)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-left transition hover:-translate-y-0.5 hover:border-info"><div className="text-[var(--psm-muted)]">{label}</div><div className="text-2xl font-semibold text-info">{count}</div></button>)}
      </div>
    </div>
  );
}
