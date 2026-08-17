'use client';

import type { MiInspectionChecklistItem } from '../../types/inspection-record.types';

export function InspectionChecklistExecutionSection({ rows, onUpdate, saving }: { rows: MiInspectionChecklistItem[]; onUpdate?: ((itemId: string, input: Record<string, unknown>) => void) | undefined; saving?: boolean | undefined }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between"><h2 className="font-bold text-[var(--psm-text)]">Checklist Execution</h2><span className="text-sm text-[var(--psm-muted)]">{rows.filter((row) => row.completed_at).length}/{rows.length} complete</span></div>
      {!rows.length ? <p className="mt-3 text-sm text-[var(--psm-muted)]">No checklist items are configured for this inspection record.</p> : <div className="mt-4 grid gap-3">
        {rows.map((item) => (
          <div key={item.id} className="rounded-lg border border-[var(--psm-line)] p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div><p className="font-semibold text-[var(--psm-text)]">{item.item_number ? `${item.item_number}. ` : ''}{item.item_title}</p><p className="text-sm text-[var(--psm-muted)]">{item.item_description ?? 'No description provided.'}</p></div>
              {onUpdate ? <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)]" disabled={saving} value={item.pass_fail ?? ''} onChange={(event) => onUpdate(item.id, { passFail: event.target.value, completed: true })}><option value="">Pending</option><option>Pass</option><option>Fail</option><option>N/A</option></select> : <span className="text-sm text-[var(--psm-muted)]">{item.pass_fail ?? 'Pending'}</span>}
            </div>
          </div>
        ))}
      </div>}
    </section>
  );
}
