import { buttonPrimary, buttonSecondary, formatDate } from '../shared/IncidentTabPrimitives';
import { EvidenceReviewStatusBadge } from '../shared/EvidenceReviewStatusBadge';

export function EvidenceAttachmentsHeader({ data, onUpload, onRequestReview, onExport, onRefresh, saving, message }: any) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-cyan-300/10 dark:bg-[#071525]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black">Evidence / Attachments</h2>
            <EvidenceReviewStatusBadge value={data.header?.evidenceReadinessStatus} />
          </div>
          <p className="mt-1 text-xs text-slate-500">Incident {data.header?.incidentNumber} · Last updated {formatDate(data.header?.lastUpdated)}</p>
          {data.permissions?.readOnly ? <p className="mt-2 text-xs text-amber-600">Read-only: closed/approved incident. Reopen before changing evidence.</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={buttonPrimary} disabled={saving || !data.actions?.find((a: any) => a.key === 'upload-evidence')?.enabled} title={data.actions?.find((a: any) => a.key === 'upload-evidence')?.disabledReason ?? ''} onClick={onUpload}>Upload Evidence</button>
          <button className={buttonSecondary} disabled={saving || !data.actions?.find((a: any) => a.key === 'request-review')?.enabled} title={data.actions?.find((a: any) => a.key === 'request-review')?.disabledReason ?? ''} onClick={onRequestReview}>Request Review</button>
          <button className={buttonSecondary} disabled={saving || !data.bulkActions?.canExportIndex} title={data.bulkActions?.canExportIndex ? '' : 'Missing incidents.evidence.export_index permission'} onClick={onExport}>Export Index</button>
          <button className={buttonSecondary} onClick={onRefresh}>Refresh</button>
        </div>
      </div>
      {message ? <div className="mt-3 rounded-lg border border-blue-300/30 bg-blue-500/10 p-2 text-xs text-blue-700 dark:text-blue-200">{message}</div> : null}
    </section>
  );
}
