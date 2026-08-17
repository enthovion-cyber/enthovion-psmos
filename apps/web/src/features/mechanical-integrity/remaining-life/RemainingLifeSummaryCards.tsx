import type { MiRemainingLifeSummary } from '../types/inspection-record.types';

export function RemainingLifeSummaryCards({ data }: { data?: MiRemainingLifeSummary }) {
  const rows = data?.rows ?? [];
  const critical = rows.filter((row) => /critical|below/i.test(String(row.alert_state))).length;
  const shortest = rows.map((row) => row.remaining_life_years).filter((value): value is number => typeof value === 'number').sort((a, b) => a - b)[0] ?? null;
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm"><p className="text-xs uppercase text-[var(--psm-muted)]">Evaluated CMLs</p><p className="mt-2 text-2xl font-bold text-[var(--psm-text)]">{rows.length}</p></div>
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm"><p className="text-xs uppercase text-[var(--psm-muted)]">Critical / Below Min</p><p className="mt-2 text-2xl font-bold text-danger">{critical}</p></div>
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm"><p className="text-xs uppercase text-[var(--psm-muted)]">Shortest Remaining Life</p><p className="mt-2 text-2xl font-bold text-[var(--psm-text)]">{shortest ?? '-'} yrs</p></div>
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm"><p className="text-xs uppercase text-[var(--psm-muted)]">Next Half-life Due</p><p className="mt-2 text-lg font-bold text-[var(--psm-text)]">{rows.map((row) => row.half_life_due_date).filter(Boolean).sort()[0] ?? '-'}</p></div>
    </section>
  );
}
