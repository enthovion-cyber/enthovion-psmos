export function LinkedRecordBulkActions({ selectedCount, onSyncAll, onExport }: { selectedCount: number; onSyncAll: () => void; onExport: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-300/10 bg-[#071525] p-3 text-sm text-slate-300">
      <span>{selectedCount ? `${selectedCount} selected` : 'Bulk link actions use backend permission checks and current filters.'}</span>
      <div className="flex gap-2"><button className="lopa-button-secondary" onClick={onSyncAll}>Sync Visible Links</button><button className="lopa-button-secondary" onClick={onExport}>Export Register</button></div>
    </div>
  );
}
