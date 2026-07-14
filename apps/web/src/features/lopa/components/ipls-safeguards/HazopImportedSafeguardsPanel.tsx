import { ArrowUpRight, Ban, RefreshCw } from 'lucide-react';
import type { LopaStudySafeguard } from '../../types/lopa-ipls-safeguards.types';
import { LopaPanel } from '../overview/LopaOverviewShared';
import { EmptyState, IplBadge } from './LopaIplBadges';

export function HazopImportedSafeguardsPanel({ rows, readOnly, importing, onImport, onUpgrade, onReject }: { rows: LopaStudySafeguard[]; readOnly: boolean; importing: boolean; onImport: () => void; onUpgrade: (row: LopaStudySafeguard) => void; onReject: (row: LopaStudySafeguard) => void }) {
  return (
    <LopaPanel
      title="HAZOP Imported Safeguards"
      action={<button className="lopa-button-secondary disabled:opacity-50" disabled={readOnly || importing} onClick={onImport}><RefreshCw size={14} />{importing ? 'Importing...' : 'Import / Sync HAZOP'}</button>}
    >
      <div className="mb-3 rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-100">
        Imported HAZOP safeguards are not automatically IPLs. They must be upgraded, validated, and explicitly credited before any future risk reduction calculation.
      </div>
      {!rows.length ? <EmptyState text="No HAZOP safeguards imported yet." /> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr><th className="py-2">No.</th><th>Name</th><th>Type</th><th>Use</th><th>Evidence</th><th>Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-cyan-300/10">
              {rows.map((row) => (
                <tr key={row.id} className="text-slate-200">
                  <td className="py-3 font-mono text-xs text-slate-400">{row.safeguard_number}</td>
                  <td className="font-semibold text-white">{row.safeguard_name}<div className="text-xs text-slate-500">{row.description}</div></td>
                  <td>{row.safeguard_type}</td>
                  <td><IplBadge value={row.proposed_use} /></td>
                  <td><IplBadge value={row.evidence_status} /></td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button className="lopa-button-secondary disabled:opacity-50" disabled={readOnly} onClick={() => onUpgrade(row)}><ArrowUpRight size={13} />Upgrade</button>
                      <button className="lopa-button-secondary disabled:opacity-50" disabled={readOnly} onClick={() => onReject(row)}><Ban size={13} />Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </LopaPanel>
  );
}
