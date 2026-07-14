'use client';

import { AlertTriangle, CheckCircle2, FileUp, ShieldCheck } from 'lucide-react';
import { Badge, ProgressBar, PSSRCard } from '../pssr-ui';

export function ChecklistSummaryCard({ summary }: { summary: any }) {
  const readiness = summary?.readinessStatus ?? 'Not Started';
  const completion = Number(summary?.completionPercent ?? 0);
  return (
    <PSSRCard title="Checklist Summary">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={<CheckCircle2 size={18} />} label="Total Items" value={summary?.totalItems ?? 0} tone="blue" />
        <Kpi icon={<ShieldCheck size={18} />} label="Required" value={summary?.requiredItems ?? 0} tone="amber" />
        <Kpi icon={<FileUp size={18} />} label="Evidence Missing" value={summary?.evidenceMissingCount ?? 0} tone={(summary?.evidenceMissingCount ?? 0) ? 'red' : 'green'} />
        <Kpi icon={<AlertTriangle size={18} />} label="Startup Blockers" value={summary?.startupBlockingItemsCount ?? 0} tone={(summary?.startupBlockingItemsCount ?? 0) ? 'red' : 'green'} />
      </div>
      <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-300">Completion</p>
            <p className="mt-1 text-3xl font-black text-white">{completion}%</p>
          </div>
          <Badge tone={readiness === 'Blocked' ? 'red' : readiness === 'Ready For Authorization' ? 'green' : completion ? 'amber' : 'slate'}>{readiness}</Badge>
        </div>
        <div className="mt-4"><ProgressBar value={completion} tone={readiness === 'Blocked' ? 'red' : completion > 90 ? 'green' : completion > 50 ? 'amber' : 'blue'} /></div>
        <div className="mt-4 grid gap-2 text-sm md:grid-cols-4">
          <Metric label="Completed" value={summary?.completedItems ?? 0} />
          <Metric label="Incomplete Required" value={summary?.incompleteRequiredItems ?? 0} />
          <Metric label="Verification Pending" value={summary?.verificationPendingCount ?? 0} />
          <Metric label="Evidence Records" value={summary?.evidenceRecords ?? 0} />
        </div>
      </div>
    </PSSRCard>
  );
}

function Kpi({ icon, label, value, tone }: { icon: any; label: string; value: any; tone: any }) {
  return <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4"><div className="flex items-center justify-between"><span className="text-slate-400">{icon}</span><Badge tone={tone}>{label}</Badge></div><p className="mt-4 text-3xl font-black text-white">{value}</p></div>;
}

function Metric({ label, value }: { label: string; value: any }) {
  return <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2"><span className="text-slate-500">{label}</span><span className="font-black text-white">{value}</span></div>;
}
