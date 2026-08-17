'use client';

import Link from 'next/link';

export function EquipmentReportExportCard({ equipmentId }: { equipmentId: string }) {
  return (
    <article className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--psm-muted)]">Reports / Export</p>
      <p className="mt-2 text-sm text-[var(--psm-muted)]">Generate reports or create the equipment integrity file.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold" href={`/mechanical-integrity/equipment/${equipmentId}/reports`}>Reports</Link>
        <Link className="rounded-lg bg-[var(--psm-accent)] px-3 py-2 text-sm font-semibold text-white" href={`/mechanical-integrity/equipment/${equipmentId}/export/integrity-file`}>Integrity file</Link>
      </div>
    </article>
  );
}
