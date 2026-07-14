import { buttonPrimary, buttonSecondary } from '../shared/IncidentTabPrimitives';
import { CapaHeaderFacts } from './CapaPanelPrimitives';

export function CapaHeader({ data, saving, message, onAdd, onGenerateRca, onGenerateBarriers, onLinkExisting, onRequestReview, onExport, onSaveChanges, onRefresh }: any) {
  const actions = data.actions ?? [];
  const title = (key: string) => actions.find((action: any) => action.key === key)?.disabledReason ?? undefined;
  const disabled = (key: string) => actions.find((action: any) => action.key === key)?.enabled === false || saving;
  return <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-cyan-300/10 dark:bg-[#071525]">
    <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
      <div><h2 className="text-xl font-black">Corrective / Preventive Actions</h2><p className="text-sm text-slate-500">Universal Action Engine-linked CAPA coverage, implementation, evidence, verification, escalation, and readiness.</p></div>
      <div className="flex flex-wrap gap-2">
        <button className={buttonPrimary} disabled={disabled('add-capa')} title={title('add-capa')} onClick={onAdd}>Add CAPA</button>
        <button className={buttonSecondary} disabled={disabled('generate-rca')} title={title('generate-rca')} onClick={onGenerateRca}>Generate from RCA</button>
        <button className={buttonSecondary} disabled={disabled('generate-barriers')} title={title('generate-barriers')} onClick={onGenerateBarriers}>Generate from Barriers</button>
        <button className={buttonSecondary} disabled={disabled('link-existing-action')} title={title('link-existing-action')} onClick={onLinkExisting}>Link Existing Action</button>
        <button className={buttonSecondary} disabled={disabled('request-review')} title={title('request-review')} onClick={onRequestReview}>Request Review</button>
        <button className={buttonSecondary} disabled={disabled('export')} title={title('export')} onClick={onExport}>Export Register</button>
        <button className={buttonSecondary} disabled={disabled('save')} title={title('save')} onClick={onSaveChanges}>Save Changes</button>
        <button className={buttonSecondary} onClick={onRefresh}>Refresh</button>
      </div>
    </div>
    {message ? <div className="mt-3 rounded-lg border border-blue-400/25 bg-blue-500/10 p-2 text-xs text-blue-700 dark:text-blue-200">{message}</div> : null}
    <div className="mt-4"><CapaHeaderFacts header={data.header} /></div>
  </section>;
}
