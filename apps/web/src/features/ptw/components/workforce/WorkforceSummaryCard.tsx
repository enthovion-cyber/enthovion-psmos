import { BriefcaseBusiness, CheckCircle2, ShieldAlert, Users } from 'lucide-react';
import type { WorkforceSummary } from '../../services/ptw-workforce.service';

export function WorkforceSummaryCard({ summary }: { summary?: WorkforceSummary | undefined }) {
  const status = summary?.workforceStatus ?? 'Loading';
  const tone = status === 'Ready' || status === 'Complete' ? 'border-success/30 bg-success/10 text-success' : status === 'Active' ? 'border-primary/30 bg-primary/10 text-primary' : status === 'Briefing Pending' || status === 'Sign-Out Pending' ? 'border-warning/30 bg-warning/10 text-warning' : 'border-danger/30 bg-danger/10 text-danger';
  return (
    <section className="psm-card p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"><Users size={16} /> Workforce Summary</div>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">Personnel readiness, briefing completion, sign-in status, contractor/internal mix, and maximum personnel controls.</p>
        </div>
        <div className={`rounded-full border px-3 py-1 text-sm font-semibold ${tone}`}>{status}</div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Users size={16} />} label="Total Personnel" value={String(summary?.totalPersonnel ?? 0)} />
        <Metric icon={<Users size={16} />} label="Signed-In Personnel" value={String(summary?.signedInPersonnel ?? 0)} />
        <Metric icon={<CheckCircle2 size={16} />} label="Signed-Out Personnel" value={String(summary?.signedOutPersonnel ?? 0)} />
        <Metric icon={<CheckCircle2 size={16} />} label="Briefing Completed" value={`${summary?.briefingCompletedPercent ?? 0}%`} />
        <Metric icon={<BriefcaseBusiness size={16} />} label="Contractor Personnel" value={String(summary?.contractorPersonnel ?? 0)} />
        <Metric icon={<BriefcaseBusiness size={16} />} label="Internal Personnel" value={String(summary?.internalPersonnel ?? 0)} />
        <Metric icon={<ShieldAlert size={16} />} label="Maximum Allowed" value={summary?.maximumPersonnelAllowed ? String(summary.maximumPersonnelAllowed) : 'Not Set'} />
        <Metric icon={<ShieldAlert size={16} />} label="Closure Blockers" value={String(summary?.closureBlockers.length ?? 0)} />
      </div>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{icon}{label}</div><div className="mt-2 text-lg font-semibold">{value}</div></div>;
}
