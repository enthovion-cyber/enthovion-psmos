import { LopaPanel, TonePill } from '../overview/LopaOverviewShared';

export function ConditionalModifiersPanel({ rows = [] }: { rows?: any[] | undefined }) {
  return (
    <LopaPanel title="Conditional Modifiers">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-[11px] uppercase text-slate-500"><tr><th className="py-2">Modifier</th><th>Factor</th><th>Range</th><th>Source</th><th>Status</th></tr></thead>
          <tbody className="divide-y divide-cyan-300/10">
            {rows.length ? rows.map((row) => <tr key={row.id}><td className="py-2 font-semibold text-white">{row.modifier_name ?? row.modifier_code}</td><td>{row.selected_value ?? row.default_value ?? '-'}</td><td>{row.low_value ?? '-'} / {row.high_value ?? '-'}</td><td className="text-slate-400">{row.source_reference ?? '-'}</td><td><TonePill tone={row.included === false ? 'warning' : 'success'}>{row.included === false ? 'Excluded' : 'Included'}</TonePill></td></tr>) : <tr><td colSpan={5} className="py-4 text-slate-400">No conditional modifiers selected.</td></tr>}
          </tbody>
        </table>
      </div>
    </LopaPanel>
  );
}
