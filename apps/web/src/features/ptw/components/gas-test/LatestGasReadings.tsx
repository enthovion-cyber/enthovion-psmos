import type { GasTrend, PermitGasTest } from '../../services/ptw-gas-test.service';
import { GasReadingCard } from './GasReadingCard';

const order = ['O2', 'LEL', 'H2S', 'CO', 'SO2', 'CL2', 'NH3', 'HF'];

export function LatestGasReadings({ latest, trends }: { latest?: PermitGasTest | null | undefined; trends?: GasTrend[] | undefined }) {
  const readings = latest?.readings ?? [];
  const byCode = new Map(readings.map((reading) => [reading.gas_code.toUpperCase(), reading]));
  const custom = readings.filter((reading) => !order.includes(reading.gas_code.toUpperCase()));
  return (
    <section className="psm-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide">Latest Readings</h3>
        <span className="text-xs text-[var(--psm-muted)]">{readings.length ? new Date(latest?.tested_at ?? '').toLocaleString() : 'No reading recorded'}</span>
      </div>
      {readings.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[...order, ...custom.map((item) => item.gas_code.toUpperCase())].map((code) => <GasReadingCard key={code} reading={byCode.get(code)} trend={trendFor(code, trends)} />)}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-8 text-center text-sm text-[var(--psm-muted)]">No gas readings have been recorded for this permit.</div>
      )}
    </section>
  );
}

function trendFor(code: string, trends?: GasTrend[]) {
  const points = trends?.find((trend) => trend.gasCode.toUpperCase() === code)?.points ?? [];
  if (points.length < 2) return undefined;
  const previous = points[points.length - 2]?.value;
  const current = points[points.length - 1]?.value;
  if (previous === undefined || current === undefined) return undefined;
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'flat';
}
