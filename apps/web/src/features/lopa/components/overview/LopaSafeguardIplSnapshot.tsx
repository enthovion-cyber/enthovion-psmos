import { ShieldCheck } from 'lucide-react';
import { LopaPanel, TonePill } from './LopaOverviewShared';

export function LopaSafeguardIplSnapshot({ safeguards }: { safeguards: any }) {
  return (
    <LopaPanel title="Safeguard / IPL Candidate Snapshot">
      <div className="mb-3 rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-100">
        Imported HAZOP safeguards are not automatically IPLs. Each must pass full IPL validation before reducing risk.
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ['Imported', safeguards.totalImported, 'info'],
          ['Candidates', safeguards.iplCandidates, 'warning'],
          ['Validated', safeguards.validated, 'success'],
          ['Credited', safeguards.credited, 'success']
        ].map(([label, value, tone]) => (
          <div key={label as string} className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-3">
            <div className="flex items-center gap-2 text-xs text-slate-400"><ShieldCheck size={13} /> {label}</div>
            <div className="mt-1 text-xl font-bold text-white">{value as number}</div>
            <TonePill tone={tone as string}>{label}</TonePill>
          </div>
        ))}
      </div>
      <div className="overflow-auto">
        <table className="min-w-[760px] w-full text-left text-xs">
          <thead className="text-slate-500">
            <tr>{['Safeguard', 'Type', 'Source', 'LOPA use', 'Validation', 'Credited', 'PFD/RRF'].map((h) => <th key={h} className="px-2 py-2">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-cyan-300/10">
            {safeguards.rows?.length ? safeguards.rows.map((row: any) => (
              <tr key={row.id}>
                <td className="px-2 py-2 font-semibold text-slate-100">{row.name}</td>
                <td className="px-2 py-2 text-slate-300">{row.type ?? '-'}</td>
                <td className="px-2 py-2 text-slate-300">{row.source}</td>
                <td className="px-2 py-2"><TonePill tone={String(row.proposedLopaUse).includes('IPL') ? 'warning' : 'neutral'}>{row.proposedLopaUse}</TonePill></td>
                <td className="px-2 py-2"><TonePill tone={row.validationStatus === 'Validated' ? 'success' : 'warning'}>{row.validationStatus}</TonePill></td>
                <td className="px-2 py-2 text-slate-300">{row.credited ? 'Yes' : 'No'}</td>
                <td className="px-2 py-2 text-slate-300">{row.pfdRrfStatus}</td>
              </tr>
            )) : <tr><td colSpan={7} className="px-2 py-6 text-center text-slate-500">No safeguards imported yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </LopaPanel>
  );
}
