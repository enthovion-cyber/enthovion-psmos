'use client';

import { ExportStatusBadge } from '../shared/ExportStatusBadge';
import type { MiExportPackage } from '../types/mi-export.types';

export function ExportPackageTable({ rows = [] }: { rows?: MiExportPackage[] | undefined }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h2 className="font-semibold">Export Packages</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {rows.length ? rows.map((row) => (
          <article key={row.id} className="rounded-xl border border-[var(--psm-line)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{row.package_number}</p>
                <p className="text-sm text-[var(--psm-muted)]">{row.title}</p>
              </div>
              <ExportStatusBadge status={row.status} />
            </div>
            <p className="mt-3 text-sm text-[var(--psm-muted)]">{row.description ?? 'No package description.'}</p>
          </article>
        )) : <p className="text-sm text-[var(--psm-muted)]">No export packages found.</p>}
      </div>
    </section>
  );
}
