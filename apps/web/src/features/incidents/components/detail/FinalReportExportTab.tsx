'use client';

import { useState } from 'react';
import { AppendicesEvidencePackagePanel } from '../final-report-export/AppendicesEvidencePackagePanel';
import { DistributionDownloadLogPanel } from '../final-report-export/DistributionDownloadLogPanel';
import { ExportOptionsPanel } from '../final-report-export/ExportOptionsPanel';
import { FinalReportChangeHistoryPanel } from '../final-report-export/FinalReportChangeHistoryPanel';
import { FinalReportHeader } from '../final-report-export/FinalReportHeader';
import { FinalReportReadinessPanel } from '../final-report-export/FinalReportReadinessPanel';
import { FinalReportReviewPanel } from '../final-report-export/FinalReportReviewPanel';
import { FinalReportSummaryCards } from '../final-report-export/FinalReportSummaryCards';
import { GenerateReportDrawer } from '../final-report-export/GenerateReportDrawer';
import { GeneratedReportsRegister } from '../final-report-export/GeneratedReportsRegister';
import { PublishToDocumentControlPanel } from '../final-report-export/PublishToDocumentControlPanel';
import { RedactionPermissionPreviewPanel } from '../final-report-export/RedactionPermissionPreviewPanel';
import { ReportDetailDrawer } from '../final-report-export/ReportDetailDrawer';
import { ReportPreviewPanel } from '../final-report-export/ReportPreviewPanel';
import { ReportSectionBuilderPanel } from '../final-report-export/ReportSectionBuilderPanel';
import { ReportTemplateSelectionPanel } from '../final-report-export/ReportTemplateSelectionPanel';
import { ReportVersionHistoryPanel } from '../final-report-export/ReportVersionHistoryPanel';
import { SourceDataSnapshotPanel } from '../final-report-export/SourceDataSnapshotPanel';
import { TabStatePanel, errorText } from '../shared/IncidentTabPrimitives';
import { useIncidentFinalReport, useIncidentFinalReportMutations } from '../../hooks/useIncidentFinalReport';

export function FinalReportExportTab({ incidentId }: { incidentId: string }) {
  const { data, isLoading, error, refetch } = useIncidentFinalReport(incidentId);
  const mutations = useIncidentFinalReportMutations(incidentId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({ includeAppendices: true, includeEvidencePackage: true, includeAuditTrail: true, includeSignatures: true, outputFormat: 'PDF', redactionProfile: 'Standard' });
  const [message, setMessage] = useState<string | null>(null);
  const saving = Object.values(mutations).some((mutation: any) => mutation.isPending);

  if (isLoading) return <TabStatePanel title="Loading Final Report / Export" message="Loading readiness, templates, sections, snapshots, preview, generated reports, exports, review, and history from the backend." />;
  if (error) return <TabStatePanel title="Could not load Final Report / Export" message={error instanceof Error ? error.message : 'The Final Report API returned an error.'} tone="danger" />;
  if (!data) return <TabStatePanel title="No Final Report data" message="No final report payload was returned." tone="danger" />;
  if (data.restricted) return <TabStatePanel title="Restricted final report" message={data.lockedReason ?? 'Final Report / Export is redacted for your permissions.'} tone="danger" />;

  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const run = async (fn: () => Promise<any>, success: string) => { try { await fn(); setMessage(success); } catch (event) { setMessage(errorText(event)); } };
  const firstReport = () => selectedReport ?? data.generatedReports?.[0];
  const generate = () => { setForm((current) => ({ ...current, templateId: current.templateId ?? data.templates?.[0]?.id, reportType: current.reportType ?? data.templates?.[0]?.template_type ?? 'Full investigation report' })); setDrawerOpen(true); };
  const doGenerate = () => run(async () => { await mutations.generate.mutateAsync(form); setDrawerOpen(false); }, 'Final report generated with immutable source snapshot.');
  const runReadiness = () => run(() => mutations.runReadiness.mutateAsync({ reason: 'Readiness refreshed from Final Report tab' }), 'Readiness check completed.');
  const selectTemplate = (template?: any) => run(() => mutations.selectTemplate.mutateAsync({ templateId: template?.id ?? data.templates?.[0]?.id, reason: 'Template selected from Final Report tab' }), 'Report template selected and section builder refreshed.');
  const toggleSection = (row: any) => run(() => mutations.updateSections.mutateAsync({ sections: [{ id: row.id, included: !row.included, notes: row.notes }], reason: 'Section builder updated' }), 'Section builder updated.');
  const createSnapshot = () => run(() => mutations.createSnapshot.mutateAsync({ redactionProfile: form.redactionProfile, reason: 'Manual source snapshot created' }), 'Source data snapshot created.');
  const exportType = (type: string) => run(() => mutations.exportReport.mutateAsync({ exportType: type, values: { reportId: firstReport()?.id, redactionProfile: form.redactionProfile, reason: `${type} export requested` } }), `${type} export completed.`);
  const markOfficial = (report?: any) => { const target = report ?? firstReport(); if (!target) return setMessage('Generate or select a report first.'); run(() => mutations.markOfficial.mutateAsync({ reportId: target.id, values: { reason: 'Marked official from Final Report tab' } }), 'Report marked official.'); };
  const publish = (report?: any) => { const target = report ?? data.generatedReports?.find((r: any) => r.official) ?? firstReport(); if (!target) return setMessage('Mark a report official before publishing.'); run(() => mutations.publish.mutateAsync({ reportId: target.id, values: { reason: 'Published from Final Report tab' } }), 'Official report published to Document Control metadata.'); };
  const supersede = (report: any) => run(() => mutations.supersede.mutateAsync({ reportId: report.id, values: { reason: 'Superseded by newer report/version' } }), 'Report superseded.');
  const archive = (report: any) => run(() => mutations.archive.mutateAsync({ reportId: report.id, values: { reason: 'Archived from Final Report tab' } }), 'Report archived.');
  const review = (decision: 'request' | 'approve' | 'reject') => {
    const values = { reportId: firstReport()?.id, reason: decision === 'reject' ? window.prompt('Rejection reason') : `${decision} final report review` };
    if (decision === 'reject' && !values.reason) return;
    const mutation = decision === 'request' ? mutations.requestReview : decision === 'approve' ? mutations.approveReview : mutations.rejectReview;
    run(() => mutation.mutateAsync(values), `Final report review ${decision} saved.`);
  };

  return <div className="grid gap-4">
    <FinalReportHeader data={data} saving={saving} message={message} onRunReadiness={runReadiness} onSelectTemplate={() => selectTemplate()} onPreview={() => setMessage(data.preview?.available ? 'Preview is shown below.' : data.preview?.message ?? 'Preview unavailable.')} onGenerate={generate} onGeneratePackage={() => exportType('evidence-package')} onExportPdf={() => exportType('pdf')} onExportDocx={() => exportType('docx')} onExportIndex={() => exportType('csv')} onPublish={() => publish()} onMarkOfficial={() => markOfficial()} onRefresh={() => refetch()} />
    <FinalReportSummaryCards cards={data.summaryCards ?? []} />
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]"><FinalReportReadinessPanel readiness={data.readiness} /><ReportTemplateSelectionPanel data={data.templateSelection} onSelect={selectTemplate} /></div>
    <ReportSectionBuilderPanel rows={data.sectionBuilder ?? []} onToggle={toggleSection} />
    <div className="grid gap-4 xl:grid-cols-3"><SourceDataSnapshotPanel snapshot={data.sourceSnapshot} onCreate={createSnapshot} /><ReportPreviewPanel preview={data.preview} /><RedactionPermissionPreviewPanel data={data.redactionPreview} /></div>
    <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]"><AppendicesEvidencePackagePanel rows={data.appendices ?? []} onGeneratePackage={() => exportType('evidence-package')} /><ExportOptionsPanel options={data.exportOptions ?? []} onExport={(row: any) => exportType(String(row.format).toLowerCase().replaceAll(' ', '-'))} /></div>
    <GeneratedReportsRegister rows={data.generatedReports ?? []} onView={setSelectedReport} onDownload={(row: any) => exportType(`download-${row.output_format ?? 'report'}`)} onOfficial={markOfficial} onPublish={publish} onSupersede={supersede} onArchive={archive} />
    <div className="grid gap-4 xl:grid-cols-2"><PublishToDocumentControlPanel data={data.publishToDocumentControl} onPublish={() => publish()} /><ReportVersionHistoryPanel rows={data.versionHistory ?? []} /></div>
    <div className="grid gap-4 xl:grid-cols-2"><DistributionDownloadLogPanel rows={data.downloadLog ?? []} /><FinalReportReviewPanel review={data.review} onRequest={() => review('request')} onApprove={() => review('approve')} onReject={() => review('reject')} /></div>
    <FinalReportChangeHistoryPanel rows={data.changeHistory ?? []} />
    <GenerateReportDrawer open={drawerOpen} form={form} set={set} templates={data.templates ?? []} saving={saving} onClose={() => setDrawerOpen(false)} onGenerate={doGenerate} />
    <ReportDetailDrawer report={selectedReport} onClose={() => setSelectedReport(null)} />
  </div>;
}
