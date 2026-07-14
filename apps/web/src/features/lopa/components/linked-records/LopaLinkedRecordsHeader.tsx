export function LopaLinkedRecordsHeader({ readOnly, onAdd, onSyncAll, onExport, syncing }: { readOnly?: boolean; onAdd: () => void; onSyncAll: () => void; onExport: () => void; syncing?: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-cyan-300/10 bg-[#071525] p-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-lg font-black text-white">Linked Records</h2>
        <p className="mt-1 text-sm text-slate-400">Relationship metadata, access-safe snapshots, dependencies, required links, and source change detection.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="lopa-button-secondary" onClick={onSyncAll} disabled={syncing}>{syncing ? 'Syncing...' : 'Sync All'}</button>
        <button className="lopa-button-secondary" onClick={onExport}>Export</button>
        {!readOnly ? <button className="lopa-button-primary" onClick={onAdd}>Add Link</button> : null}
      </div>
    </div>
  );
}
