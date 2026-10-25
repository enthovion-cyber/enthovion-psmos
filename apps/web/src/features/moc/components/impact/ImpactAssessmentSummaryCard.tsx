'use client';

import { Badge, DetailCard, Metric, ProgressBar } from '../moc-detail-ui';

export function ImpactAssessmentSummaryCard({
  data,
  isDirty,
  locked
}: {
  data: any;
  isDirty?: boolean;
  locked?: boolean;
}) {
  const summary = data?.summary ?? {};
  const missing = summary.missingRequiredAnswers?.length ?? 0;
  const completeScore = Math.round((((summary.totalAreasReviewed ?? 0) / 9) || 0) * 100);

  return (
    <DetailCard
      title="OSHA PSM Multi-Discipline Impact Evaluation"
      action={
        <div className="flex flex-wrap gap-2">
          <Badge tone={locked ? 'red' : isDirty ? 'amber' : 'green'}>
            {locked ? 'Read-only' : isDirty ? 'Unsaved changes' : 'Synchronized'}
          </Badge>
          <Badge tone={summary.status === 'Complete' ? 'green' : summary.status === 'Needs Review' ? 'red' : 'blue'}>
            {summary.status ?? 'Draft / In Progress'}
          </Badge>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Metric label="Areas Reviewed" value={`${summary.totalAreasReviewed ?? 0} / 9`} tone="blue" />
        <Metric label="Positive Impacts" value={summary.yesCount ?? 0} tone="amber" />
        <Metric label="No (Justified)" value={summary.noWithJustification ?? 0} tone="slate" />
        <Metric label="Missing Answers" value={missing} tone={missing ? 'red' : 'green'} />
        <Metric label="Generated Actions" value={summary.generatedActionsCount ?? 0} tone="purple" />
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Metric
          label="Pre-Startup Blockers"
          value={summary.startupBlockingActionsCount ?? 0}
          tone={(summary.startupBlockingActionsCount ?? 0) ? 'red' : 'green'}
        />
        <Metric
          label="Closure Blockers"
          value={summary.closureBlockingActionsCount ?? 0}
          tone={(summary.closureBlockingActionsCount ?? 0) ? 'amber' : 'green'}
        />
        <Metric
          label="PSSR Required"
          value={summary.pssrRequired ? 'Yes' : 'No'}
          tone={summary.pssrRequired ? 'red' : 'green'}
        />
        <Metric
          label="HAZOP / LOPA"
          value={`${summary.hazopRequired ? 'Yes' : 'No'} / ${summary.lopaRequired ? 'Yes' : 'No'}`}
          tone={summary.hazopRequired || summary.lopaRequired ? 'amber' : 'green'}
        />
        <Metric
          label="Training / Docs"
          value={`${summary.trainingRequired ? 'Required' : 'No'} / ${summary.documentUpdateRequired ? 'Required' : 'No'}`}
          tone={summary.trainingRequired || summary.documentUpdateRequired ? 'amber' : 'green'}
        />
      </div>

      <div className="mt-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5 transition-colors">
        <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-[var(--psm-muted)]">
          <span>Overall Impact Completion Rate</span>
          <span className="font-mono text-[var(--psm-fg)]">{completeScore}%</span>
        </div>
        <ProgressBar value={completeScore} tone={missing ? 'amber' : 'green'} />
        <p className="mt-2 text-[11px] text-[var(--psm-muted)]">
          Evaluated by <strong>{summary.lastUpdatedBy ?? 'System'}</strong> · Last synchronized:{' '}
          {summary.lastUpdatedAt ? new Date(summary.lastUpdatedAt).toLocaleString() : 'Not saved yet'}
        </p>
      </div>
    </DetailCard>
  );
}
