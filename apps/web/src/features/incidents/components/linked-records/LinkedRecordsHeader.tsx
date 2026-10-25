import { buttonPrimary, buttonSecondary } from '../shared/IncidentTabPrimitives';
import { LinkedRecordHeaderFacts } from './LinkedRecordsPrimitives';

export function LinkedRecordsHeader({ data, saving, message, onAdd, onAutoDetect, onCreateFollowup, onSpawnMoc, onRefreshStatus, onRequestReview, onExport, onSaveChanges, onRefresh }: any) {
  const actions = data.actions ?? [];
  const disabled = (key: string) => actions.find((action: any) => action.key === key)?.enabled === false || saving;
  const title = (key: string) => actions.find((action: any) => action.key === key)?.disabledReason ?? undefined;
  return <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-cyan-300/10 dark:bg-[#071525]">
    <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
      <div><h2 className="text-xl font-black">Linked Records</h2><p className="text-sm text-slate-500">PSM, EHS, engineering, maintenance, document, action, and compliance records connected to this incident.</p></div>
      <div className="flex flex-wrap gap-2">
        <button className={buttonPrimary} disabled={disabled('link-record')} title={title('link-record')} onClick={onAdd}>Link Record</button>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-500/20 dark:border-indigo-400/30 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30 transition-colors" title="Spawn 1-Click Management of Change for this incident" onClick={onSpawnMoc}>⚡ Spawn 1-Click MOC</button>
        <button className={buttonSecondary} disabled={disabled('auto-detect')} title={title('auto-detect')} onClick={onAutoDetect}>Auto-Detect Related Records</button>
        <button className={buttonSecondary} disabled={disabled('create-followup')} title={title('create-followup')} onClick={onCreateFollowup}>Create Follow-up Action</button>
        <button className={buttonSecondary} disabled={disabled('refresh-status')} title={title('refresh-status')} onClick={onRefreshStatus}>Refresh Link Status</button>
        <button className={buttonSecondary} disabled={disabled('request-review')} title={title('request-review')} onClick={onRequestReview}>Request Review</button>
        <button className={buttonSecondary} disabled={disabled('export')} title={title('export')} onClick={onExport}>Export Index</button>
        <button className={buttonSecondary} disabled={disabled('save')} title={title('save')} onClick={onSaveChanges}>Save Changes</button>
        <button className={buttonSecondary} onClick={onRefresh}>Refresh</button>
      </div>
    </div>
    {message ? <div className="mt-3 rounded-lg border border-blue-400/25 bg-blue-500/10 p-2 text-xs text-blue-700 dark:text-blue-200">{message}</div> : null}
    <div className="mt-4"><LinkedRecordHeaderFacts header={data.header} /></div>
  </section>;
}
