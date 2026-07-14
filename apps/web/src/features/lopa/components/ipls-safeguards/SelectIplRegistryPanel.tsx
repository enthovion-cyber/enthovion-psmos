import { Database } from 'lucide-react';
import type { LopaIplsSafeguardsContext } from '../../types/lopa-ipls-safeguards.types';
import { LopaPanel } from '../overview/LopaOverviewShared';
import { EmptyState, IplBadge } from './LopaIplBadges';

export function SelectIplRegistryPanel({ context, readOnly, onSelect }: { context: LopaIplsSafeguardsContext; readOnly: boolean; onSelect: (id: string) => void }) {
  const rows = context.registry ?? [];
  return (
    <LopaPanel title="Select from IPL Registry">
      {!rows.length ? <EmptyState text="No approved IPL Registry records are available for this study scope." /> : (
        <div className="space-y-2">
          {rows.slice(0, 6).map((row) => (
            <div key={row.id} className="flex flex-col gap-3 rounded-lg border border-cyan-300/10 bg-[#03101d] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Database size={15} className="text-cyan-200" />
                  <span className="font-semibold text-white">{row.ipl_name}</span>
                  <IplBadge value={row.approval_status} />
                </div>
                <div className="mt-1 text-xs text-slate-500">{row.registry_number} · {row.ipl_type} · PFDavg {row.pfdavg ?? '-'} · RRF {row.rrf ?? '-'}</div>
              </div>
              <button className="lopa-button-secondary disabled:opacity-50" disabled={readOnly} onClick={() => onSelect(row.id)}>Use Snapshot</button>
            </div>
          ))}
        </div>
      )}
    </LopaPanel>
  );
}
