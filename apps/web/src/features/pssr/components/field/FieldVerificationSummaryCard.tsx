'use client';

import { AlertTriangle, Camera, CheckCircle2, MapPinned } from 'lucide-react';
import { Badge, ProgressBar, PSSRCard } from '../pssr-ui';

export function FieldVerificationSummaryCard({ summary }: { summary: any }) {
  const completion = Number(summary?.fieldChecklistCompletionPercent ?? 0);
  return (
    <PSSRCard title="Field Verification Summary">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={<MapPinned size={18} />} label="Equipment" value={summary?.totalEquipmentItems ?? 0} tone="blue" />
        <Kpi icon={<CheckCircle2 size={18} />} label="Verified" value={summary?.verifiedEquipmentCount ?? 0} tone="green" />
        <Kpi icon={<Camera size={18} />} label="Evidence Missing" value={summary?.evidenceMissingCount ?? 0} tone={(summary?.evidenceMissingCount ?? 0) ? 'red' : 'green'} />
        <Kpi icon={<AlertTriangle size={18} />} label="Open Blockers" value={summary?.openFieldBlockers ?? 0} tone={(summary?.openFieldBlockers ?? 0) ? 'red' : 'green'} />
      </div>
      <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/30 p-4">
        <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-black text-slate-300">Walkdown Completion</p><p className="mt-1 text-3xl font-black text-white">{completion}%</p></div><Badge tone={summary?.fieldVerificationStatus === 'Blocked' ? 'red' : summary?.fieldVerificationStatus === 'Ready' ? 'green' : 'amber'}>{summary?.fieldVerificationStatus ?? 'Not Started'}</Badge></div>
        <div className="mt-4"><ProgressBar value={completion} tone={completion > 90 ? 'green' : completion > 50 ? 'amber' : 'blue'} /></div>
      </div>
    </PSSRCard>
  );
}

function Kpi({ icon, label, value, tone }: { icon: any; label: string; value: any; tone: any }) {
  return <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4"><div className="flex items-center justify-between"><span className="text-slate-400">{icon}</span><Badge tone={tone}>{label}</Badge></div><p className="mt-4 text-3xl font-black text-white">{value}</p></div>;
}
