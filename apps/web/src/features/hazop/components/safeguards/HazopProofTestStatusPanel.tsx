'use client';

import { CalendarCheck } from 'lucide-react';
import { SafeguardPanel, SafeguardPill } from './HazopIplStatusBadge';

export function HazopProofTestStatusPanel({ rows, onEdit }: { rows: any[]; onEdit?: (row: any) => void }) {
  return (
    <SafeguardPanel title="Proof Test / Inspection Status">
      <div className="space-y-2">
        {rows.slice(0, 6).map((row) => (
          <button key={row.id} onClick={() => onEdit?.(row)} className="w-full rounded-lg border border-[var(--psm-line)] p-3 text-left hover:bg-[var(--psm-surface-2)]">
            <div className="flex items-start justify-between gap-2"><div><div className="font-semibold">{row.safeguard?.safeguard_number ?? row.safeguard_id}</div><div className="text-xs text-[var(--psm-muted)]">Next due: {row.next_test_due_date ?? 'Not scheduled'}</div></div><SafeguardPill tone={row.status === 'Overdue' ? 'red' : row.status === 'Due Soon' ? 'amber' : 'green'}>{row.status ?? 'Current'}</SafeguardPill></div>
          </button>
        ))}
        {!rows.length ? <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-center text-sm text-[var(--psm-muted)]"><CalendarCheck size={18} className="mx-auto mb-2" />No proof test records yet.</div> : null}
      </div>
    </SafeguardPanel>
  );
}
