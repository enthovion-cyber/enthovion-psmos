'use client';

import { Cpu } from 'lucide-react';
import { SafeguardPanel } from './HazopIplStatusBadge';

export function HazopSafeguardEquipmentPanel({ rows }: { rows: any[] }) {
  return (
    <SafeguardPanel title="Equipment Links">
      <div className="space-y-2">
        {rows.slice(0, 6).map((row) => <LinkRow key={`${row.id}-${row.equipment_id}`} icon={<Cpu size={15} />} title={row.equipment?.tag ?? row.equipment_id ?? 'Equipment'} subtitle={row.safeguard_name ?? row.link_type ?? 'Protected equipment'} />)}
        {!rows.length ? <Empty text="No equipment links captured." /> : null}
      </div>
    </SafeguardPanel>
  );
}

function LinkRow({ icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return <div className="flex gap-3 rounded-lg border border-[var(--psm-line)] p-3 text-sm">{icon}<div><div className="font-semibold">{title}</div><div className="text-xs text-[var(--psm-muted)]">{subtitle}</div></div></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-center text-sm text-[var(--psm-muted)]">{text}</div>;
}
