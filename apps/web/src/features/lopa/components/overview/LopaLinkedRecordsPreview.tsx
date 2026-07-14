import { Link2 } from 'lucide-react';
import { LopaPanel, TonePill } from './LopaOverviewShared';

export function LopaLinkedRecordsPreview({ records }: { records: Array<{ type: string; count: number; status: string; restricted: boolean }> }) {
  return (
    <LopaPanel title="Linked Records Preview">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {records.map((record) => (
          <div key={record.type} className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300"><Link2 size={13} /> {record.type}</div>
              <TonePill tone={record.restricted ? 'warning' : record.count ? 'info' : 'neutral'}>{record.restricted ? 'Restricted' : record.count}</TonePill>
            </div>
            <div className="mt-2 text-xs text-slate-500">{record.status}</div>
          </div>
        ))}
      </div>
    </LopaPanel>
  );
}
