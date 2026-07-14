export function TeamSessionsBulkActions({ onInviteRequired, onSyncActions, onExport, readOnly }: any) {
  return (
    <section className="flex flex-wrap gap-2 rounded-xl border border-cyan-300/10 bg-[#071525] p-4">
      {!readOnly ? <button className="lopa-button-secondary" onClick={onInviteRequired}>Invite Required Members</button> : null}
      {!readOnly ? <button className="lopa-button-secondary" onClick={onSyncActions}>Sync Session Actions</button> : null}
      <button className="lopa-button-secondary" onClick={onExport}>Export Attendance / Minutes</button>
    </section>
  );
}
