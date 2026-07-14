'use client';

import { AlertTriangle, CheckCircle2, FileText, History } from 'lucide-react';
import { Badge, ProgressBar, PSSRCard } from '../pssr-ui';

export function DocumentReadinessSummaryCard({ summary }: { summary: any }) {
  const readiness = Number(summary?.readinessPercent ?? 0);
  return (
    <PSSRCard title="Document Readiness Summary">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={<FileText size={18} />} label="Required" value={summary?.totalRequiredDocuments ?? 0} tone="blue" />
        <Kpi icon={<CheckCircle2 size={18} />} label="Approved / Current" value={summary?.approvedCurrentDocuments ?? 0} tone="green" />
        <Kpi icon={<AlertTriangle size={18} />} label="Missing" value={summary?.missingDocuments ?? 0} tone={(summary?.missingDocuments ?? 0) ? 'red' : 'green'} />
        <Kpi icon={<History size={18} />} label="Draft / Revision" value={summary?.draftRevisionDocuments ?? 0} tone={(summary?.draftRevisionDocuments ?? 0) ? 'amber' : 'green'} />
      </div>
      <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/30 p-4">
        <div className="flex items-center justify-between"><div><p className="text-sm font-black text-slate-300">Readiness</p><p className="mt-1 text-3xl font-black text-white">{readiness}%</p></div><Badge tone={summary?.documentReadinessStatus === 'Blocked' ? 'red' : readiness === 100 ? 'green' : 'amber'}>{summary?.documentReadinessStatus ?? 'Not Started'}</Badge></div>
        <div className="mt-4"><ProgressBar value={readiness} tone={readiness > 90 ? 'green' : readiness > 50 ? 'amber' : 'red'} /></div>
      </div>
    </PSSRCard>
  );
}

function Kpi({ icon, label, value, tone }: { icon: any; label: string; value: any; tone: any }) {
  return <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4"><div className="flex items-center justify-between"><span className="text-slate-400">{icon}</span><Badge tone={tone}>{label}</Badge></div><p className="mt-4 text-3xl font-black text-white">{value}</p></div>;
}
