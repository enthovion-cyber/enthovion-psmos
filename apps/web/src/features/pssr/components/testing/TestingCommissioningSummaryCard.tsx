'use client';

import { Badge, PSSRCard, ProgressBar } from '../pssr-ui';

export function TestingCommissioningSummaryCard({ summary }: { summary: any }) {
  const percent = Number(summary?.completionPercent ?? 0);
  const tone = summary?.readinessStatus === 'Ready' ? 'green' : ['Failed', 'Blocked'].includes(summary?.readinessStatus) ? 'red' : percent >= 70 ? 'amber' : 'blue';
  return <PSSRCard title="Testing & Commissioning Summary" action={<Badge tone={tone as any}>{summary?.readinessStatus ?? 'Not Started'}</Badge>}><div className="grid gap-3 sm:grid-cols-4"><Metric label="Required Tests" value={summary?.totalRequiredTests} /><Metric label="Completed" value={summary?.completedTests} /><Metric label="Failed" value={summary?.failedTests} tone="text-red-300" /><Metric label="Startup Blockers" value={summary?.startupBlockingTestsCount} tone="text-red-300" /><Metric label="Overdue" value={summary?.overdueTests} tone="text-amber-300" /><Metric label="Evidence Missing" value={summary?.evidenceMissingCount} tone="text-amber-300" /><Metric label="Verification Pending" value={summary?.verificationPendingCount} /><Metric label="Completion" value={`${percent}%`} /></div><div className="mt-4"><ProgressBar value={percent} tone={tone === 'red' ? 'red' : tone === 'green' ? 'green' : 'amber'} /></div></PSSRCard>;
}

function Metric({ label, value, tone = 'text-white' }: { label: string; value: any; tone?: string }) {
  return <div className="rounded-lg border border-white/10 bg-slate-950/30 p-3"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className={`mt-1 text-2xl font-black ${tone}`}>{value ?? 0}</p></div>;
}
