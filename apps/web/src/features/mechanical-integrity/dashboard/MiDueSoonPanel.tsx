import Link from 'next/link';
import type { MiDashboard } from '../types/mi-dashboard.types';

export function MiDueSoonPanel({ dueSoon }: { dueSoon: MiDashboard['dueSoon'] }) {
  const rows = [...dueSoon.inspections, ...dueSoon.pm, ...dueSoon.calibrations].slice(0, 8);
  return <MiniList title="Inspection / PM / Calibration Due" rows={rows} empty="No overdue or upcoming due items returned by backend." />;
}

function MiniList({ title, rows, empty }: { title: string; rows: Array<{ id: string; tag: string; name: string; nextInspectionDueDate?: string | null }>; empty: string }) {
  return (
    <section className="psm-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
      <div className="mt-3 space-y-2">
        {rows.length === 0 ? <p className="text-sm text-[var(--psm-muted)]">{empty}</p> : rows.map((row) => (
          <Link key={row.id} href={`/mechanical-integrity/equipment/${row.id}`} className="block rounded-lg border border-[var(--psm-line)] p-3 hover:bg-[var(--psm-surface-2)]">
            <div className="font-semibold">{row.tag}</div>
            <div className="text-xs text-[var(--psm-muted)]">{row.name}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
