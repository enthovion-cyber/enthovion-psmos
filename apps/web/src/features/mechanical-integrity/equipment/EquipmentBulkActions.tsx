export function EquipmentBulkActions({ selectedCount }: { selectedCount: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 text-sm">
      <span className="text-[var(--psm-muted)]">{selectedCount ? `${selectedCount} selected` : 'Bulk actions become available after selecting equipment rows.'}</span>
      <div className="flex gap-2"><button className="psm-button psm-button-secondary" disabled title="Select rows first">Archive</button><button className="psm-button psm-button-secondary" disabled title="Select rows first">Export Selected</button></div>
    </div>
  );
}
