'use client';

import type { MiCml } from '../types/cml.types';
import { CmlStatusBadge } from '../shared/CmlStatusBadge';
import { ThicknessValue } from '../shared/ThicknessValue';

export function CmlTable({ rows, onOpen }: { rows: MiCml[]; onOpen: (cml: MiCml) => void }) {
  if (!rows.length) return <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-[var(--psm-muted)]">No CML/TML records match the current filters.</div>;
  return (
    <div className="hidden overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm lg:block">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase tracking-wide text-[var(--psm-muted)]">
          <tr><th className="p-3">CML</th><th className="p-3">Component / Location</th><th className="p-3">Thickness</th><th className="p-3">Corrosion Rate</th><th className="p-3">Remaining Life</th><th className="p-3">Next Due</th><th className="p-3">Alert</th><th className="p-3">Actions</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]">
            <td className="p-3 font-bold text-[var(--psm-text)]">{row.cmlNumber ?? row.cml_number}<div className="text-xs font-normal text-[var(--psm-muted)]">{row.cmlType ?? row.cml_type}</div></td>
            <td className="p-3 text-[var(--psm-text)]">{row.component_type ?? 'Component not set'}<div className="text-xs text-[var(--psm-muted)]">{row.location_description ?? 'Location not set'}</div></td>
            <td className="p-3"><ThicknessValue value={row.latestThickness} unit={row.thickness_unit} /></td>
            <td className="p-3 text-[var(--psm-text)]">{String(row.governingCorrosionRate ?? 'Not calculated')}</td>
            <td className="p-3 text-[var(--psm-text)]">{String(row.remainingLifeYears ?? 'Not calculated')}</td>
            <td className="p-3 text-[var(--psm-text)]">{row.nextDueDate ?? 'Not set'}</td>
            <td className="p-3"><CmlStatusBadge value={row.alertStatus} /></td>
            <td className="p-3"><button className="rounded-lg border border-[var(--psm-line)] px-3 py-1.5 font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]" onClick={() => onOpen(row)}>Open</button></td>
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}
