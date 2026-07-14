import type { GasTrend } from '../../services/ptw-gas-test.service';

const colors: Record<string, string> = { O2: '#22c55e', LEL: '#f59e0b', H2S: '#ef4444', CO: '#38bdf8' };

export function GasTrendChart({ trends }: { trends?: GasTrend[] | undefined }) {
  return (
    <section className="psm-card p-5">
      <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold uppercase tracking-wide">Gas Trend Chart</h3><span className="text-xs text-[var(--psm-muted)]">O2, LEL, H2S, CO</span></div>
      <div className="grid gap-4 md:grid-cols-2">
        {(trends ?? []).map((trend) => <MiniChart key={trend.gasCode} trend={trend} />)}
      </div>
      {!trends?.length ? <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-8 text-center text-sm text-[var(--psm-muted)]">No trend data yet.</div> : null}
    </section>
  );
}

function MiniChart({ trend }: { trend: GasTrend }) {
  const points = trend.points.slice(-12);
  const values = points.map((point) => point.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const path = points.map((point, index) => {
    const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
    const y = 90 - ((point.value - min) / Math.max(max - min, 1)) * 75;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
      <div className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold">{trend.gasCode}</span><span className="text-[var(--psm-muted)]">{points.at(-1)?.value ?? '-'} latest</span></div>
      <svg viewBox="0 0 100 100" className="h-28 w-full overflow-visible">
        <path d="M0 90 H100" stroke="var(--psm-line)" strokeWidth="1" />
        <path d={path} fill="none" stroke={colors[trend.gasCode] ?? '#3b82f6'} strokeWidth="3" strokeLinecap="round" />
        {points.map((point, index) => {
          const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
          const y = 90 - ((point.value - min) / Math.max(max - min, 1)) * 75;
          return <circle key={`${point.at}-${index}`} cx={x} cy={y} r="2.5" fill={colors[trend.gasCode] ?? '#3b82f6'} />;
        })}
      </svg>
    </div>
  );
}
