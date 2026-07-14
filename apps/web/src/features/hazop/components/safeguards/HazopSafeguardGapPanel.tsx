'use client';

import { AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { SafeguardPanel, SafeguardPill } from './HazopIplStatusBadge';

export function HazopSafeguardGapPanel({ rows, canClose, canCreateAction, onClose, onCreateAction }: { rows: any[]; canClose?: boolean; canCreateAction?: boolean; onClose?: (row: any) => void; onCreateAction?: (row: any) => void }) {
  return (
    <SafeguardPanel title="Safeguard Gaps / Actions">
      <div className="space-y-2">
        {rows.slice(0, 8).map((row) => (
          <div key={row.id} className="rounded-lg border border-[var(--psm-line)] p-3 text-sm">
            <div className="flex items-start justify-between gap-2"><div><div className="font-semibold">{row.gap_type}</div><div className="mt-1 text-xs text-[var(--psm-muted)]">{row.gap_description}</div></div><SafeguardPill tone={row.severity === 'Critical' || row.severity === 'High' ? 'red' : 'amber'}>{row.severity}</SafeguardPill></div>
            <div className="mt-3 flex flex-wrap gap-2">
              {canCreateAction && !row.action_id ? <button onClick={() => onCreateAction?.(row)} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-xs font-semibold"><Plus size={13} className="mr-1 inline" />Create Action</button> : null}
              {canClose && row.status !== 'Closed' ? <button onClick={() => onClose?.(row)} className="rounded-lg border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-300"><CheckCircle2 size={13} className="mr-1 inline" />Close</button> : null}
            </div>
          </div>
        ))}
        {!rows.length ? <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-center text-sm text-[var(--psm-muted)]"><AlertTriangle size={18} className="mx-auto mb-2" />No open safeguard gaps.</div> : null}
      </div>
    </SafeguardPanel>
  );
}
