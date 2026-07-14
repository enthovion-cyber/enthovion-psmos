import { Activity, Clock, Gauge, UserRound } from 'lucide-react';
import type { GasTestSummary } from '../../services/ptw-gas-test.service';

export function GasTestSummaryCard({ summary }: { summary?: GasTestSummary | undefined }) {
  const status = summary?.permitGasStatus ?? 'Loading';
  const tone = status.includes('Failed') || status.includes('Overdue') ? 'text-danger bg-danger/10 border-danger/30' : status.includes('Due Soon') || status === 'Required' ? 'text-warning bg-warning/10 border-warning/30' : status === 'Passed' || status === 'Not Required' ? 'text-success bg-success/10 border-success/30' : 'text-[var(--psm-muted)] bg-[var(--psm-surface-2)] border-[var(--psm-line)]';
  return (
    <section className="psm-card p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"><Gauge size={16} /> Gas Test Summary</div>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">Atmospheric testing status, retest countdown, tester identity, and instrument calibration.</p>
        </div>
        <div className={`rounded-full border px-3 py-1 text-sm font-semibold ${tone}`}>{status}</div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Activity size={16} />} label="Gas Test Required" value={summary?.gasTestRequired ? 'Yes' : 'No'} />
        <Metric icon={<Gauge size={16} />} label="Latest Test Status" value={summary?.latestStatus ?? 'Not Recorded'} />
        <Metric icon={<Clock size={16} />} label="Last Test Date/Time" value={summary?.lastTestedAt ? new Date(summary.lastTestedAt).toLocaleString() : '-'} />
        <Metric icon={<Clock size={16} />} label="Next Re-Test Due" value={summary?.nextRetestDueAt ? new Date(summary.nextRetestDueAt).toLocaleString() : '-'} />
        <Metric icon={<Clock size={16} />} label="Re-Test Countdown" value={formatCountdown(summary?.retestCountdownSeconds)} />
        <Metric icon={<UserRound size={16} />} label="Tester" value={summary?.tester ?? '-'} />
        <Metric icon={<Gauge size={16} />} label="Instrument ID" value={summary?.instrumentId ?? '-'} />
        <Metric icon={<Gauge size={16} />} label="Calibration Status" value={summary?.instrumentCalibrationStatus ?? 'Unknown'} />
      </div>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{icon}{label}</div><div className="mt-2 text-lg font-semibold">{value}</div></div>;
}

function formatCountdown(seconds?: number | null) {
  if (seconds === null || seconds === undefined) return '-';
  if (seconds < 0) return `${Math.abs(Math.floor(seconds / 60))} min overdue`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
