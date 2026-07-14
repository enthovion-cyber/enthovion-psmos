import { LopaPanel, TonePill } from '../overview/LopaOverviewShared';

export function ExcludedSafeguardsPanel({ ipls = [], safeguards = [] }: { ipls?: any[] | undefined; safeguards?: any[] | undefined }) {
  const rows = [...ipls, ...safeguards];
  return (
    <LopaPanel title="Excluded Safeguards / Non-Credited IPLs">
      <div className="grid gap-2">
        {rows.length ? rows.map((row) => <div key={`${row.id}-${row.ipl_name ?? row.safeguard_name}`} className="flex items-center justify-between gap-3 rounded-lg border border-cyan-300/10 bg-[#03101d] p-3 text-sm"><div><div className="font-semibold text-slate-100">{row.ipl_name ?? row.safeguard_name}</div><div className="text-xs text-slate-500">{row.ipl_type ?? row.safeguard_type ?? 'Safeguard'} · {row.credit_status ?? row.proposed_use ?? row.validation_status ?? 'Not credited'}</div></div><TonePill tone="warning">Excluded</TonePill></div>) : <div className="text-sm text-slate-400">No excluded safeguards returned.</div>}
      </div>
    </LopaPanel>
  );
}
