import { LopaPanel, TonePill } from '../overview/LopaOverviewShared';
import { PfdRrfDisplay } from '../shared/PfdRrfDisplay';

export function CreditedIplsPanel({ rows = [] }: { rows?: any[] | undefined }) {
  return (
    <LopaPanel title="Credited IPLs Used in Calculation">
      <div className="grid gap-3">
        {rows.length ? rows.map((row) => <div key={row.id} className="rounded-lg border border-emerald-400/15 bg-emerald-500/5 p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-bold text-white">{row.ipl_name}</div><div className="text-xs text-slate-400">{row.ipl_type} · {row.source_reference ?? 'No source reference'}</div></div><PfdRrfDisplay pfd={row.pfdavg} rrf={row.rrf} /></div><div className="mt-2 flex flex-wrap gap-2"><TonePill tone="success">{row.validation_status ?? 'Credited'}</TonePill><TonePill tone={row.common_cause_status === 'Clear' ? 'success' : 'warning'}>{row.common_cause_status ?? 'Common cause not stated'}</TonePill><TonePill tone={row.double_counting_status === 'Clear' ? 'success' : 'warning'}>{row.double_counting_status ?? 'Double count not stated'}</TonePill></div></div>) : <div className="text-sm text-slate-400">No credited IPLs. Non-credited safeguards do not reduce calculated risk.</div>}
      </div>
    </LopaPanel>
  );
}
