'use client';

import { Badge, DetailCard, Metric, ProgressBar } from '../moc-detail-ui';

export function ImpactAssessmentSummaryCard({ data, isDirty, locked }: { data: any; isDirty?: boolean; locked?: boolean }) {
  const summary = data?.summary ?? {};
  const missing = summary.missingRequiredAnswers?.length ?? 0;
  const completeScore = Math.round((((summary.totalAreasReviewed ?? 0) / 9) || 0) * 100);
  return (
    <DetailCard
      title="Impact Assessment Summary"
      action={<div className="flex flex-wrap gap-2"><Badge tone={locked ? 'red' : isDirty ? 'amber' : 'green'}>{locked ? 'Read-only' : isDirty ? 'Unsaved changes' : 'Synced'}</Badge><Badge tone={summary.status === 'Complete' ? 'green' : summary.status === 'Needs Review' ? 'red' : 'blue'}>{summary.status ?? 'Not Started'}</Badge></div>}
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Areas reviewed" value={`${summary.totalAreasReviewed ?? 0}/9`} tone="blue" />
        <Metric label="Yes impacts" value={summary.yesCount ?? 0} tone="amber" />
        <Metric label="No justified" value={summary.noWithJustification ?? 0} tone="slate" />
        <Metric label="Missing required" value={missing} tone={missing ? 'red' : 'green'} />
        <Metric label="Generated actions" value={summary.generatedActionsCount ?? 0} tone="purple" />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Startup blockers" value={summary.startupBlockingActionsCount ?? 0} tone={(summary.startupBlockingActionsCount ?? 0) ? 'red' : 'green'} />
        <Metric label="Closure blockers" value={summary.closureBlockingActionsCount ?? 0} tone={(summary.closureBlockingActionsCount ?? 0) ? 'amber' : 'green'} />
        <Metric label="PSSR required" value={summary.pssrRequired ? 'Yes' : 'No'} tone={summary.pssrRequired ? 'red' : 'green'} />
        <Metric label="HAZOP / LOPA" value={`${summary.hazopRequired ? 'Y' : 'N'} / ${summary.lopaRequired ? 'Y' : 'N'}`} tone={summary.hazopRequired || summary.lopaRequired ? 'amber' : 'green'} />
        <Metric label="Training / Docs" value={`${summary.trainingRequired ? 'Y' : 'N'} / ${summary.documentUpdateRequired ? 'Y' : 'N'}`} tone={summary.trainingRequired || summary.documentUpdateRequired ? 'amber' : 'green'} />
      </div>
      <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-400"><span>Assessment completion</span><span>{completeScore}%</span></div>
        <ProgressBar value={completeScore} tone={missing ? 'amber' : 'green'} />
        <p className="mt-2 text-xs text-slate-500">Last updated by {summary.lastUpdatedBy ?? 'not available'} at {summary.lastUpdatedAt ? new Date(summary.lastUpdatedAt).toLocaleString() : 'not saved yet'}.</p>
      </div>
    </DetailCard>
  );
}
