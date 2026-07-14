'use client';

import Link from 'next/link';
import { EmptyState, PSSRCard, Badge } from '../pssr-ui';

export function AffectedEquipmentCard({ pssr }: { pssr: any }) {
  const equipment = pssr.equipment ?? [];
  return (
    <PSSRCard title="Affected Equipment">
      {equipment.length ? (
        <div className="space-y-2">
          {equipment.slice(0, 6).map((item: any) => (
            <Link key={item.id} href={`/equipment/${item.equipment_id}`} className="block rounded-lg border border-white/10 bg-slate-950/30 p-3 transition hover:border-blue-300/30 hover:bg-blue-500/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-black text-white">{item.equipment_tag_snapshot}</p>
                  <p className="text-sm text-slate-400">{item.equipment_name_snapshot}</p>
                </div>
                <div className="flex gap-2">
                  {item.is_primary ? <Badge tone="blue">Primary</Badge> : <Badge>Secondary</Badge>}
                  <Badge tone={item.equipment_criticality_snapshot === 'High' ? 'red' : item.equipment_criticality_snapshot === 'Medium' ? 'amber' : 'green'}>{item.equipment_criticality_snapshot ?? 'Normal'}</Badge>
                </div>
              </div>
              <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">{item.equipment_type_snapshot ?? 'Equipment'} · {item.verification_status ?? 'Not Verified'}</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No affected equipment linked" detail="Add equipment from the PSSR create flow or linked MOC source." />
      )}
    </PSSRCard>
  );
}
