import { SummaryCardGrid } from '../shared/IncidentTabPrimitives';

export function ImmediateActionsSummaryCards({ cards, charts }: { cards: any[]; charts?: any }) {
  return <div className="grid gap-3">
    <SummaryCardGrid cards={cards ?? []} />
    <div className="grid gap-3 lg:grid-cols-3">
      <MiniChart title="Action Status" rows={charts?.actionStatus ?? []} empty="No immediate actions captured." />
      <MiniChart title="Temporary Control Expiry" rows={charts?.temporaryControlExpiry ?? []} empty="No temporary controls captured." />
      <MiniChart title="Verification Status" rows={charts?.verificationStatus ?? []} empty="No verification data returned." />
    </div>
  </div>;
}

function MiniChart({ title, rows, empty }: { title: string; rows: any[]; empty: string }) {
  const max = Math.max(1, ...rows.map((row) => Number(row.count) || 0));
  return <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-cyan-300/10 dark:bg-[#071525]">
    <h3 className="text-xs font-black uppercase text-slate-500">{title}</h3>
    {!rows.length ? <p className="mt-2 text-xs text-slate-500">{empty}</p> : <div className="mt-3 grid gap-2">
      {rows.map((row) => <div key={row.label}>
        <div className="mb-1 flex justify-between text-xs"><span>{row.label}</span><span className="font-black">{row.count}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full bg-blue-500" style={{ width: `${Math.max(6, (Number(row.count) / max) * 100)}%` }} /></div>
      </div>)}
    </div>}
  </section>;
}
