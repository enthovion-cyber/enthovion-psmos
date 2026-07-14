'use client';

import { ShieldAlert } from 'lucide-react';
import type { HazopSafeguard } from '../../types/hazop-safeguard.types';
import { SafeguardPanel, SafeguardPill } from './HazopIplStatusBadge';

export function HazopSafetySystemSifPanel({ rows }: { rows: HazopSafeguard[] }) {
  const sifRows = rows.filter((row) => ['SIS / SIF', 'SIF', 'ESD', 'Interlock', 'Fire and gas system'].includes(row.safeguard_type));
  return (
    <SafeguardPanel title="Safety System / SIF Links">
      <div className="space-y-2">
        {sifRows.slice(0, 6).map((row) => (
          <div key={row.id} className="rounded-lg border border-[var(--psm-line)] p-3 text-sm">
            <div className="flex items-center justify-between gap-2"><div className="font-semibold">{row.safeguard_name}</div><SafeguardPill tone={row.ipl_candidate ? 'amber' : 'blue'}>{row.safeguard_type}</SafeguardPill></div>
            <div className="mt-2 text-xs text-[var(--psm-muted)]">Future LOPA/SIL trigger {row.ipl_candidate || row.credited_for_risk_reduction ? 'active' : 'available'}</div>
          </div>
        ))}
        {!sifRows.length ? <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-center text-sm text-[var(--psm-muted)]"><ShieldAlert size={18} className="mx-auto mb-2" />No SIS/SIF/ESD/interlock safeguards linked.</div> : null}
      </div>
    </SafeguardPanel>
  );
}
