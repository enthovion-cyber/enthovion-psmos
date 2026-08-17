'use client';

import type { MiCml } from '../types/cml.types';

export function CmlReadingHistoryPreview({ rows }: { rows: MiCml[] }) {
  const recent = rows.filter((row) => row.latestReadingDate).sort((a, b) => String(b.latestReadingDate).localeCompare(String(a.latestReadingDate))).slice(0, 5);
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <h3 className="font-bold text-[var(--psm-text)]">Reading History Preview</h3>
      {!recent.length ? <p className="mt-3 text-sm text-[var(--psm-muted)]">No approved thickness readings available yet.</p> : <div className="mt-4 space-y-2">{recent.map((row) => <div key={row.id} className="flex items-center justify-between rounded-lg bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><span className="font-semibold text-[var(--psm-text)]">{row.cmlNumber ?? row.cml_number}</span><span className="text-[var(--psm-muted)]">{row.latestReadingDate} · {String(row.latestThickness ?? '-')}</span></div>)}</div>}
    </section>
  );
}
