import type { LopaStudySafeguard } from '../../types/lopa-ipls-safeguards.types';
import { LopaPanel } from '../overview/LopaOverviewShared';
import { EmptyState, IplBadge } from './LopaIplBadges';

export function StudySafeguardsRegister({ rows }: { rows: LopaStudySafeguard[] }) {
  return (
    <LopaPanel title="Study Safeguards Register">
      {!rows.length ? <EmptyState text="No study safeguards have been added." /> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr><th className="py-2">No.</th><th>Safeguard</th><th>Source</th><th>Type</th><th>Proposed Use</th><th>Status</th></tr>
            </thead>
            <tbody className="divide-y divide-cyan-300/10">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 font-mono text-xs text-slate-400">{row.safeguard_number}</td>
                  <td><div className="font-semibold text-white">{row.safeguard_name}</div><div className="text-xs text-slate-500">{row.notes || row.description}</div></td>
                  <td className="text-slate-300">{row.source_type}</td>
                  <td className="text-slate-300">{row.safeguard_type}</td>
                  <td><IplBadge value={row.proposed_use} /></td>
                  <td><IplBadge value={row.validation_status || row.evidence_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </LopaPanel>
  );
}
