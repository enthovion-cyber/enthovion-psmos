import { Badge } from '../shared/IncidentStatusBadge';
import { ReportStatusBadge } from '../shared/ReportStatusBadge';
import { PublishedStatusBadge } from '../shared/PublishedStatusBadge';
import { RedactionStatusBadge } from '../shared/RedactionStatusBadge';
import { buttonPrimary, buttonSecondary, formatDate } from '../shared/IncidentTabPrimitives';

export function FinalReportHeader({ data, saving, message, onRunReadiness, onSelectTemplate, onPreview, onGenerate, onGeneratePackage, onExportPdf, onExportDocx, onExportIndex, onPublish, onMarkOfficial, onRefresh }: any) {
  const header = data?.header ?? {};
  const action = (key: string) => (header.actions ?? []).find((item: any) => item.key === key) ?? { enabled: false, disabledReason: 'Action unavailable.' };
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-cyan-300/10 dark:bg-[#071525]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black">Final Report / Export</h2>
            <ReportStatusBadge value={header.officialReportStatus} />
            <PublishedStatusBadge value={header.publishedToDocumentControl} />
            <RedactionStatusBadge value="Backend enforced" />
            <Badge value={header.readinessStatus} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{header.incidentNumber} · {header.title}</p>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <Fact label="Incident status" value={header.status} />
            <Fact label="Actual severity" value={header.actualSeverity} />
            <Fact label="Potential severity" value={header.potentialSeverity} />
            <Fact label="PSM/PSE/API" value={header.psmPseApiTier} />
            <Fact label="Review" value={header.reviewApprovalStatus} />
            <Fact label="Latest report" value={header.latestGeneratedReport} />
            <Fact label="Latest export" value={formatDate(header.latestExportDate)} />
            <Fact label="Last updated" value={formatDate(header.lastUpdated)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 xl:justify-end">
          <button className={buttonSecondary} title={action('run-readiness').disabledReason} disabled={saving || !action('run-readiness').enabled} onClick={onRunReadiness}>Run Readiness</button>
          <button className={buttonSecondary} title={action('select-template').disabledReason} disabled={saving || !action('select-template').enabled} onClick={onSelectTemplate}>Select Template</button>
          <button className={buttonSecondary} title={action('preview').disabledReason} disabled={saving || !action('preview').enabled} onClick={onPreview}>Preview</button>
          <button className={buttonPrimary} title={action('generate').disabledReason} disabled={saving || !action('generate').enabled} onClick={onGenerate}>Generate Report</button>
          <button className={buttonSecondary} title={action('generate-package').disabledReason} disabled={saving || !action('generate-package').enabled} onClick={onGeneratePackage}>Evidence Package</button>
          <button className={buttonSecondary} title={action('export-pdf').disabledReason} disabled={saving || !action('export-pdf').enabled} onClick={onExportPdf}>Export PDF</button>
          <button className={buttonSecondary} title={action('export-docx').disabledReason} disabled={saving || !action('export-docx').enabled} onClick={onExportDocx}>Export DOCX</button>
          <button className={buttonSecondary} title={action('export-index').disabledReason} disabled={saving || !action('export-index').enabled} onClick={onExportIndex}>Excel/CSV Index</button>
          <button className={buttonSecondary} title={action('publish').disabledReason} disabled={saving || !action('publish').enabled} onClick={onPublish}>Publish</button>
          <button className={buttonSecondary} title={action('mark-official').disabledReason} disabled={saving || !action('mark-official').enabled} onClick={onMarkOfficial}>Mark Official</button>
          <button className={buttonSecondary} disabled={saving} onClick={onRefresh}>Refresh</button>
        </div>
      </div>
      {message ? <div className="mt-3 rounded-lg border border-blue-400/25 bg-blue-500/10 p-2 text-xs text-blue-700 dark:text-blue-200">{message}</div> : null}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: any }) {
  return <div><div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div><div className="font-semibold">{value ?? '-'}</div></div>;
}
