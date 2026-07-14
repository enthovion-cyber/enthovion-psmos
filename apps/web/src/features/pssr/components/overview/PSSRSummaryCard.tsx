'use client';

import { Badge, ProgressBar, PSSRCard, riskTone, statusTone } from '../pssr-ui';

export function PSSRSummaryCard({ pssr }: { pssr: any }) {
  const summary = pssr.summary ?? {};
  return (
    <PSSRCard title="PSSR Summary">
      <div className="grid gap-3 md:grid-cols-2">
        <Metric label="PSSR Number" value={pssr.pssr_number} />
        <Metric label="Status" value={<Badge tone={statusTone(pssr.status)}>{pssr.status}</Badge>} />
        <Metric label="PSSR Type" value={pssr.pssr_type} />
        <Metric label="Startup Type" value={pssr.startup_type} />
        <Metric label="Risk Level" value={<Badge tone={riskTone(pssr.risk_level)}>{pssr.risk_level}</Badge>} />
        <Metric label="Target Startup" value={pssr.target_startup_at ? new Date(pssr.target_startup_at).toLocaleString() : '-'} />
        <Metric label="Coordinator" value={pssr.coordinator?.displayName ?? pssr.coordinator_id ?? '-'} />
        <Metric label="Department" value={pssr.department?.name ?? '-'} />
      </div>
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-slate-300">Overall Readiness</span>
          <span className="font-black text-white">{summary.readinessPercent ?? pssr.readiness_percent ?? 0}%</span>
        </div>
        <ProgressBar value={summary.readinessPercent ?? pssr.readiness_percent ?? 0} tone={(summary.readinessPercent ?? 0) >= 90 ? 'green' : (summary.readinessPercent ?? 0) >= 70 ? 'amber' : 'red'} />
      </div>
    </PSSRCard>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/30 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-black text-slate-100">{value}</div>
    </div>
  );
}
