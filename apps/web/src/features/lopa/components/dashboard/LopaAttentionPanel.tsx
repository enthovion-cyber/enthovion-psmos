import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import type { LopaAttentionItem } from '../../types/lopa.types';
import { LopaRiskBadge } from '../shared/LopaBadges';

export function LopaAttentionPanel({ items }: { items?: LopaAttentionItem[] | undefined }) {
  const rows = items ?? [];
  return (
    <section className="rounded-xl border border-cyan-300/10 bg-[#071525] shadow-xl shadow-black/10">
      <div className="flex items-center justify-between border-b border-cyan-300/10 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-white"><AlertTriangle size={16} className="text-amber-300" /> Risk / SIL Attention Panel</h2>
        <span className="text-xs text-red-300">{rows.length}</span>
      </div>
      {!rows.length ? <div className="p-5 text-sm text-slate-400">No LOPA attention items are open.</div> : null}
      <div className="max-h-[360px] divide-y divide-cyan-300/10 overflow-auto">
        {rows.slice(0, 12).map((item) => (
          <div key={`${item.itemType}-${item.id}`} className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 text-sm">
            <div>
              <div className="font-semibold text-slate-100">{item.itemType}</div>
              <div className="text-xs text-slate-500">{item.studyNumber} · {item.title}</div>
              <div className="mt-2 flex flex-wrap gap-2"><LopaRiskBadge value={item.severity} /><span className="rounded-md border border-cyan-300/10 px-2 py-1 text-[11px] text-slate-300">{item.requiredAction}</span></div>
            </div>
            {item.href ? <Link href={item.href} className="self-center text-xs font-semibold text-blue-300">Open</Link> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
