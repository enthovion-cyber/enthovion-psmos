import { buttonPrimary, buttonSecondary } from '../shared/IncidentTabPrimitives';
import { ReportingHeaderFacts } from './NotificationsRegulatoryPrimitives';

export function NotificationsRegulatoryHeader({ data, saving, message, onSend, onAddReport, onDetermine, onPackage, onReview, onFollowup, onRefreshStatus, onExport, onRefresh }: any) {
  const actions = data.actions ?? [];
  const disabled = (key: string) => actions.find((action: any) => action.key === key)?.enabled === false || saving;
  const title = (key: string) => actions.find((action: any) => action.key === key)?.disabledReason ?? undefined;
  return <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-cyan-300/10 dark:bg-[#071525]">
    <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
      <div><h2 className="text-xl font-black">Notifications / Regulatory Reporting</h2><p className="text-sm text-slate-500">Internal notifications, reportability determination, regulatory reports, deadlines, package readiness, and acknowledgement tracking.</p></div>
      <div className="flex flex-wrap gap-2">
        <button className={buttonPrimary} disabled={disabled('send-notification')} title={title('send-notification')} onClick={onSend}>Send Notification</button>
        <button className={buttonSecondary} disabled={disabled('add-report')} title={title('add-report')} onClick={onAddReport}>Add Regulatory Report</button>
        <button className={buttonSecondary} disabled={disabled('run-determination')} title={title('run-determination')} onClick={onDetermine}>Run Determination</button>
        <button className={buttonSecondary} disabled={disabled('generate-package')} title={title('generate-package')} onClick={onPackage}>Generate Package</button>
        <button className={buttonSecondary} disabled={disabled('request-review')} title={title('request-review')} onClick={onReview}>Request Review</button>
        <button className={buttonSecondary} disabled={disabled('create-followup')} title={title('create-followup')} onClick={onFollowup}>Create Action</button>
        <button className={buttonSecondary} disabled={disabled('refresh-status')} title={title('refresh-status')} onClick={onRefreshStatus}>Refresh Status</button>
        <button className={buttonSecondary} disabled={disabled('export-log')} title={title('export-log')} onClick={onExport}>Export Log</button>
        <button className={buttonSecondary} onClick={onRefresh}>Refresh</button>
      </div>
    </div>
    {message ? <div className="mt-3 rounded-lg border border-blue-400/25 bg-blue-500/10 p-2 text-xs text-blue-700 dark:text-blue-200">{message}</div> : null}
    <div className="mt-4"><ReportingHeaderFacts header={data.header} /></div>
  </section>;
}
