'use client';

import { Badge, PSSRCard, ProgressBar } from '../pssr-ui';

export function TrainingReadinessSummaryCard({ summary }: { summary: any }) {
  const percent = Number(summary?.completionPercent ?? 0);
  const tone = summary?.readinessStatus === 'Ready' ? 'green' : summary?.readinessStatus === 'Blocked' ? 'red' : percent >= 70 ? 'amber' : 'blue';
  return (
    <PSSRCard title="Training Readiness Summary" action={<Badge tone={tone as any}>{summary?.readinessStatus ?? 'Not Started'}</Badge>}>
      <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
        <div><p className="text-5xl font-black text-white">{percent}%</p><p className="text-sm text-slate-400">Personnel ready</p></div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Required" value={summary?.totalRequiredTrainingRecords} />
          <Metric label="Completed" value={summary?.completedTrainingRecords} />
          <Metric label="Verified" value={summary?.verifiedTrainingRecords} />
          <Metric label="Overdue" value={summary?.overdueTrainingRecords} tone="text-red-300" />
          <Metric label="Missing Evidence" value={summary?.missingEvidenceCount} tone="text-amber-300" />
          <Metric label="Startup Blockers" value={summary?.startupBlockingTrainingCount} tone="text-red-300" />
        </div>
      </div>
      <div className="mt-4"><ProgressBar value={percent} tone={tone === 'red' ? 'red' : tone === 'green' ? 'green' : 'amber'} /></div>
    </PSSRCard>
  );
}

function Metric({ label, value, tone = 'text-white' }: { label: string; value: any; tone?: string }) {
  return <div className="rounded-lg border border-white/10 bg-slate-950/30 p-3"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className={`mt-1 text-2xl font-black ${tone}`}>{value ?? 0}</p></div>;
}
