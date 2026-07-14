'use client';

import { Badge, PSSRCard, ProgressBar } from '../pssr-ui';

export function PunchListSummaryCard({ summary }: { summary: any }) {
  const percent = Number(summary?.completionPercent ?? 100);
  const tone = summary?.punchReadinessStatus === 'Startup Blocked' ? 'red' : summary?.punchReadinessStatus === 'Open Non-Blocking' ? 'amber' : 'green';
  return <PSSRCard title="Punch List Summary" action={<Badge tone={tone}>{summary?.punchReadinessStatus ?? 'Clear'}</Badge>}><div className="grid gap-3 sm:grid-cols-4"><Metric label="Total" value={summary?.totalPunchItems} /><Metric label="Category A Open" value={summary?.categoryAOpen} tone="text-red-300" /><Metric label="Category B Open" value={summary?.categoryBOpen} tone="text-amber-300" /><Metric label="Category C Open" value={summary?.categoryCOpen} /><Metric label="Closed" value={summary?.closedPunchItems} tone="text-emerald-300" /><Metric label="Overdue" value={summary?.overduePunchItems} tone="text-red-300" /><Metric label="Missing Evidence" value={summary?.missingEvidence} tone="text-amber-300" /><Metric label="Pending Verification" value={summary?.pendingVerification} /></div><div className="mt-4"><ProgressBar value={percent} tone={tone === 'red' ? 'red' : tone === 'amber' ? 'amber' : 'green'} /></div></PSSRCard>;
}

function Metric({ label, value, tone = 'text-white' }: { label: string; value: any; tone?: string }) {
  return <div className="rounded-lg border border-white/10 bg-slate-950/30 p-3"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className={`mt-1 text-2xl font-black ${tone}`}>{value ?? 0}</p></div>;
}
