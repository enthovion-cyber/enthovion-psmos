'use client';

import { Badge, DetailCard, Metric, ProgressBar, statusTone } from '../moc-detail-ui';

export function EngineeringPackageSummaryCard({ summary }: { summary: any }) {
  const ready = summary?.engineeringReadiness === 'Ready';
  const blocked = summary?.engineeringReadiness === 'Blocked';
  const total = Number(summary?.requiredDocumentsCount ?? 0);
  const missing = Number(summary?.missingRequiredDocumentsCount ?? 0);
  const percent = total ? Math.round(((total - missing) / total) * 100) : 100;
  return (
    <DetailCard title="Engineering Package Summary" action={<Badge tone={blocked ? 'red' : ready ? 'green' : 'amber'}>{summary?.engineeringReadiness ?? 'Not Ready'}</Badge>}>
      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Metric label="Status" value={summary?.status ?? 'Not Started'} tone={statusTone(summary?.status)} />
        <Metric label="Documents" value={summary?.totalEngineeringDocuments ?? 0} tone="blue" />
        <Metric label="Required" value={summary?.requiredDocumentsCount ?? 0} tone="slate" />
        <Metric label="Missing" value={summary?.missingRequiredDocumentsCount ?? 0} tone={missing ? 'red' : 'green'} />
        <Metric label="Linked Controlled" value={summary?.linkedDocumentControlDocumentsCount ?? 0} tone="blue" />
        <Metric label="Pending Review" value={summary?.documentsPendingReview ?? 0} tone="amber" />
        <Metric label="Approved" value={summary?.documentsApproved ?? 0} tone="green" />
      </div>
      <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/35 p-3">
        <div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-wide text-slate-400"><span>Engineering readiness</span><span>{percent}%</span></div>
        <ProgressBar value={percent} tone={blocked ? 'red' : ready ? 'green' : 'amber'} />
        <p className="mt-2 text-xs text-slate-500">Last updated: {summary?.lastUpdatedAt ? new Date(summary.lastUpdatedAt).toLocaleString() : '-'}</p>
      </div>
    </DetailCard>
  );
}
