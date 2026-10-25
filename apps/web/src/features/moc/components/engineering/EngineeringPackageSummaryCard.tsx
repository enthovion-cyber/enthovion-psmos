'use client';

import { Badge, DetailCard, Metric, ProgressBar, statusTone } from '../moc-detail-ui';

export function EngineeringPackageSummaryCard({ summary }: { summary: any }) {
  const ready = summary?.engineeringReadiness === 'Ready';
  const blocked = summary?.engineeringReadiness === 'Blocked';
  const total = Number(summary?.requiredDocumentsCount ?? 0);
  const missing = Number(summary?.missingRequiredDocumentsCount ?? 0);
  const percent = total ? Math.round(((total - missing) / total) * 100) : 100;

  return (
    <DetailCard
      title="Engineering Design Baseline & PSI Package"
      action={<Badge tone={blocked ? 'red' : ready ? 'green' : 'amber'}>{summary?.engineeringReadiness ?? 'In Progress'}</Badge>}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <Metric label="Status" value={summary?.status ?? 'Draft'} tone={statusTone(summary?.status)} />
        <Metric label="Total Docs" value={summary?.totalEngineeringDocuments ?? 0} tone="blue" />
        <Metric label="Required" value={summary?.requiredDocumentsCount ?? 0} tone="slate" />
        <Metric label="Missing" value={summary?.missingRequiredDocumentsCount ?? 0} tone={missing ? 'red' : 'green'} />
        <Metric label="Controlled Links" value={summary?.linkedDocumentControlDocumentsCount ?? 0} tone="blue" />
        <Metric label="Pending Review" value={summary?.documentsPendingReview ?? 0} tone="amber" />
        <Metric label="Approved" value={summary?.documentsApproved ?? 0} tone="green" />
      </div>
      <div className="mt-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5 transition-colors">
        <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-[var(--psm-muted)]">
          <span>Engineering Readiness Score</span>
          <span className="font-mono text-[var(--psm-fg)]">{percent}%</span>
        </div>
        <ProgressBar value={percent} tone={blocked ? 'red' : ready ? 'green' : 'amber'} />
        <p className="mt-2 text-[11px] text-[var(--psm-muted)]">
          Audit timestamp: {summary?.lastUpdatedAt ? new Date(summary.lastUpdatedAt).toLocaleString() : 'Not evaluated yet'}
        </p>
      </div>
    </DetailCard>
  );
}
