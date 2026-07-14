'use client';

import Link from 'next/link';
import { Badge, EmptyState, PSSRCard, riskTone } from '../pssr-ui';

export function PSSRLinkedMOCPanel({ rows }: { rows: any[] }) {
  return (
    <PSSRCard title="Linked MOCs" action={<Badge tone={(rows ?? []).length ? 'blue' : 'slate'}>{(rows ?? []).length} links</Badge>}>
      <div className="space-y-3">
        {(rows ?? []).length ? rows.map((item) => (
          <div key={item.id} className="rounded-lg border border-cyan-300/10 bg-slate-950/30 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">{item.relationship_type ?? 'Trigger Source'}</p>
                <Link href={`/pssr/${item.pssr_id}`} className="mt-1 block font-black text-blue-200">{item.pssrNumber}</Link>
                <p className="mt-1 text-sm text-slate-300">{item.pssrTitle}</p>
                <p className="mt-1 text-xs text-slate-500">MOC {item.moc_id}</p>
              </div>
              <Badge tone={riskTone(item.mocRiskLevel)}>{item.mocRiskLevel}</Badge>
            </div>
          </div>
        )) : <EmptyState title="No linked MOCs in this dashboard scope" detail="MOC-triggered startup reviews appear here." />}
      </div>
    </PSSRCard>
  );
}
