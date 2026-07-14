'use client';

import { Gauge } from 'lucide-react';
import type { HazopSafeguard } from '../../types/hazop-safeguard.types';
import { HazopIplStatusBadge, SafeguardPanel } from './HazopIplStatusBadge';

export function HazopIplCandidatePanel({ rows, onOpen }: { rows: HazopSafeguard[]; onOpen: (row: HazopSafeguard) => void }) {
  return (
    <SafeguardPanel title="IPL Candidate Panel">
      <div className="space-y-2">
        {rows.slice(0, 6).map((row) => (
          <button key={row.id} onClick={() => onOpen(row)} className="w-full rounded-lg border border-[var(--psm-line)] p-3 text-left hover:bg-[var(--psm-surface-2)]">
            <div className="flex items-start justify-between gap-2">
              <div><div className="font-semibold">{row.safeguard_number}</div><div className="text-xs text-[var(--psm-muted)]">{row.safeguard_name}</div></div>
              <HazopIplStatusBadge value={row.ipl_validation_status} />
            </div>
          </button>
        ))}
        {!rows.length ? <Empty icon={<Gauge size={18} />} text="No IPL candidates yet. Mark credited safeguards as IPL candidates from the register." /> : null}
      </div>
    </SafeguardPanel>
  );
}

function Empty({ icon, text }: { icon: any; text: string }) {
  return <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-center text-sm text-[var(--psm-muted)]">{icon}<div className="mt-2">{text}</div></div>;
}
