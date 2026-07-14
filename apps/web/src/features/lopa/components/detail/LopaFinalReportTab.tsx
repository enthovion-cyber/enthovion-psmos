'use client';

import { useState } from 'react';
import { useLopaFinalReport, useLopaReportMutations } from '../../hooks/useLopaFinalReport';
import type { LopaFinalReportFilters, LopaReportGenerateInput } from '../../types/lopa-final-report.types';
import { ExportHistoryPanel } from '../final-report/ExportHistoryPanel';
import { ExportOptionsPanel } from '../final-report/ExportOptionsPanel';
import { FinalReportFilters } from '../final-report/FinalReportFilters';
import { FinalReportHeader } from '../final-report/FinalReportHeader';
import { GenerateReportDialog } from '../final-report/GenerateReportDialog';
import { GeneratedReportsRegister } from '../final-report/GeneratedReportsRegister';
import { MarkOfficialReportDialog } from '../final-report/MarkOfficialReportDialog';
import { OfficialReportPublishPanel } from '../final-report/OfficialReportPublishPanel';
import { PublishToDocumentControlDialog } from '../final-report/PublishToDocumentControlDialog';
import { RedactionPermissionPreviewPanel } from '../final-report/RedactionPermissionPreviewPanel';
import { ReportAppendicesPanel } from '../final-report/ReportAppendicesPanel';
import { ReportDetailDrawer } from '../final-report/ReportDetailDrawer';
import { ReportDistributionPanel } from '../final-report/ReportDistributionPanel';
import { ReportPackageBuilder } from '../final-report/ReportPackageBuilder';
import { ReportPreviewPanel } from '../final-report/ReportPreviewPanel';
import { ReportReadinessBlockersPanel } from '../final-report/ReportReadinessBlockersPanel';
import { ReportSectionBuilder } from '../final-report/ReportSectionBuilder';
import { ReportSummaryCards } from '../final-report/ReportSummaryCards';
import { ReportTemplateSelectionPanel } from '../final-report/ReportTemplateSelectionPanel';
import { ReportVersionHistoryPanel } from '../final-report/ReportVersionHistoryPanel';
import { ShareReportDialog } from '../final-report/ShareReportDialog';

export function LopaFinalReportTab({ id }: { id: string }) {
  const [filters, setFilters] = useState<LopaFinalReportFilters>({});
  const [options, setOptions] = useState<LopaReportGenerateInput>({ outputFormat: 'PDF', reportType: 'Final report', classification: 'Internal', includeAppendices: true, includeAttachmentsIndex: true, includeApprovalSnapshot: true });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [dialog, setDialog] = useState<'generate' | 'official' | 'publish' | 'share' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewOverride, setPreviewOverride] = useState<any | null>(null);
  const query = useLopaFinalReport(id, filters);
  const mutations = useLopaReportMutations(id);

  function fail(err: any, fallback: string) {
    const raw = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? fallback;
    setError(typeof raw === 'string' ? raw : JSON.stringify(raw));
  }

  if (query.isLoading) return <State text="Loading Final Report / Export from API..." />;
  if (query.isError || !query.data) return <State text="Unable to load Final Report / Export. Check permissions and database schema." tone="error" />;

  const data = query.data;
  const busy = Object.values(mutations).some((m: any) => m.isPending);
  const effectiveOptions = { ...options, templateId: selectedTemplateId ?? data.templates?.[0]?.id };
  const officialDisabledReason = data.context?.disabledReasons?.officialBlocked;

  function generate(values: LopaReportGenerateInput = effectiveOptions) {
    mutations.generate.mutate(values, { onSuccess: () => { setDialog(null); setMessage('Report generated.'); }, onError: (err) => fail(err, 'Report generation failed.') });
  }

  function optionalReason(value: string | null) {
    return value ? { reason: value } : {};
  }

  return <div className="space-y-4">
    {message ? <Toast text={message} tone="success" onClose={() => setMessage(null)} /> : null}
    {error ? <Toast text={error} tone="danger" onClose={() => setError(null)} /> : null}
    {data.readOnly ? <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-100">This study is approved/closed. Report generation uses approved snapshots where required; source data remains read-only.</div> : null}
    <FinalReportHeader header={data.header} busy={busy} disabledReason={officialDisabledReason} onPreview={() => mutations.preview.mutate(effectiveOptions, { onSuccess: (preview) => { setPreviewOverride(preview); setMessage('Preview refreshed.'); }, onError: (err) => fail(err, 'Preview failed.') })} onGenerate={() => setDialog('generate')} onPackage={() => mutations.generatePackage.mutate({ ...effectiveOptions, packageName: `${data.header?.lopaNumber} Final Report Package` }, { onSuccess: () => setMessage('Report package generated.'), onError: (err) => fail(err, 'Package generation failed.') })} onExport={() => mutations.exportCsv.mutate(effectiveOptions, { onSuccess: () => setMessage('CSV export generated.'), onError: (err) => fail(err, 'Export failed.') })} onPublish={() => setDialog('publish')} onRefresh={() => void query.refetch()} />
    <ReportSummaryCards summary={data.summary} />
    <FinalReportFilters filters={filters} setFilters={setFilters} />
    <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
      <ReportReadinessBlockersPanel readiness={data.readiness} />
      <ReportTemplateSelectionPanel templates={data.templates} selectedTemplateId={effectiveOptions.templateId} onSelect={setSelectedTemplateId} />
    </div>
    <div className="grid gap-4 xl:grid-cols-[1fr_.9fr]">
      <ReportSectionBuilder sections={data.sections} saving={mutations.updateSections.isPending} onToggle={(section, included) => mutations.updateSections.mutate({ sections: [{ sectionKey: section.section_key, included }], ...(included ? {} : optionalReason(window.prompt('Reason for excluding section'))) }, { onSuccess: () => setMessage('Report sections updated.'), onError: (err) => fail(err, 'Could not update section.') })} />
      <ReportPreviewPanel preview={previewOverride ?? data.preview} onGenerate={() => mutations.preview.mutate(effectiveOptions, { onSuccess: (preview) => { setPreviewOverride(preview); setMessage('Preview refreshed.'); }, onError: (err) => fail(err, 'Preview failed.') })} />
    </div>
    <ExportOptionsPanel options={options} setOptions={setOptions} context={data.context} onPdf={() => generate({ ...effectiveOptions, outputFormat: 'PDF' })} onExcel={() => mutations.exportExcel.mutate({ ...effectiveOptions, outputFormat: 'Excel' }, { onSuccess: () => setMessage('Excel export generated.'), onError: (err) => fail(err, 'Excel export failed.') })} onCsv={() => mutations.exportCsv.mutate({ ...effectiveOptions, outputFormat: 'CSV' }, { onSuccess: () => setMessage('CSV export generated.'), onError: (err) => fail(err, 'CSV export failed.') })} />
    <ReportPackageBuilder packages={data.packages} appendices={data.appendices} onBuild={() => mutations.generatePackage.mutate({ ...effectiveOptions, packageName: `${data.header?.lopaNumber} Final Report Package` }, { onSuccess: () => setMessage('Report package generated.'), onError: (err) => fail(err, 'Package failed.') })} />
    <GeneratedReportsRegister register={data.register} onSelect={setSelectedReport} onDownload={(r) => window.open(`/api/v1/lopa/${id}/final-report/reports/${r.id}/download`, '_blank')} onOfficial={(r) => { setSelectedReport(r); setDialog('official'); }} onArchive={(r) => mutations.archive.mutate({ reportId: r.id, ...optionalReason(window.prompt('Archive reason')) }, { onSuccess: () => setMessage('Report archived.'), onError: (err) => fail(err, 'Archive failed.') })} onRestore={(r) => mutations.restore.mutate({ reportId: r.id, ...optionalReason(window.prompt('Restore reason')) }, { onSuccess: () => setMessage('Report restored.'), onError: (err) => fail(err, 'Restore failed.') })} />
    <div className="grid gap-4 xl:grid-cols-2">
      <ReportVersionHistoryPanel reports={data.register.rows ?? []} />
      <OfficialReportPublishPanel reports={data.register.rows ?? []} onOfficial={(r) => { setSelectedReport(r); setDialog('official'); }} onPublish={(r) => { setSelectedReport(r); setDialog('publish'); }} />
      <ReportAppendicesPanel appendices={data.appendices} />
      <RedactionPermissionPreviewPanel redaction={data.redaction} />
      <ReportDistributionPanel rows={data.distribution} onShare={() => setDialog('share')} />
      <ExportHistoryPanel rows={data.exportHistory} />
    </div>
    <ReportDetailDrawer report={selectedReport} onClose={() => setSelectedReport(null)} />
    <GenerateReportDialog open={dialog === 'generate'} onClose={() => setDialog(null)} options={effectiveOptions} setOptions={setOptions} onSubmit={() => generate(effectiveOptions)} />
    <MarkOfficialReportDialog open={dialog === 'official'} onClose={() => setDialog(null)} onSubmit={(reason) => selectedReport && mutations.markOfficial.mutate({ reportId: selectedReport.id, reason }, { onSuccess: () => { setDialog(null); setMessage('Report marked official.'); }, onError: (err) => fail(err, 'Mark official failed.') })} />
    <PublishToDocumentControlDialog open={dialog === 'publish'} onClose={() => setDialog(null)} onSubmit={(values) => selectedReport && mutations.publish.mutate({ reportId: selectedReport.id, values }, { onSuccess: () => { setDialog(null); setMessage('Report published to Document Control.'); }, onError: (err) => fail(err, 'Publish failed.') })} />
    <ShareReportDialog open={dialog === 'share'} onClose={() => setDialog(null)} onSubmit={(values) => mutations.share.mutate(values, { onSuccess: () => { setDialog(null); setMessage('Report shared.'); }, onError: (err) => fail(err, 'Share failed.') })} />
  </div>;
}

function State({ text, tone = 'muted' }: { text: string; tone?: 'muted' | 'error' }) { return <div className={`rounded-xl border p-6 text-sm ${tone === 'error' ? 'border-red-400/20 bg-red-500/10 text-red-700 dark:text-red-100' : 'border-cyan-300/10 bg-[#071525] text-slate-400'}`}>{text}</div>; }
function Toast({ text, tone, onClose }: { text: string; tone: 'success' | 'danger'; onClose: () => void }) { return <div className={`flex items-center justify-between rounded-lg border p-3 text-sm ${tone === 'success' ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100' : 'border-red-400/25 bg-red-500/10 text-red-700 dark:text-red-100'}`}><span>{text}</span><button onClick={onClose}>Dismiss</button></div>; }
