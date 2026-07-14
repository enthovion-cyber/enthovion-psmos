'use client';

import { Badge } from '../pssr-ui';

export function ChecklistGroupTabs({ groups, active, onChange }: { groups: Record<string, any[]>; active: string; onChange: (group: string) => void }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-cyan-300/10 bg-[#07182a]/95 p-2">
      <div className="flex min-w-max gap-2">
        {Object.entries(groups).map(([group, items]) => {
          const blockers = items.filter((item) => (item.required_before_startup && !['Completed', 'Verified', 'Waived', 'Not Applicable'].includes(item.status)) || item.verification_status === 'Rejected').length;
          const complete = items.filter((item) => ['Completed', 'Verified', 'Waived', 'Not Applicable'].includes(item.status)).length;
          return (
            <button key={group} type="button" onClick={() => onChange(group)} className={`rounded-lg border px-3 py-2 text-left transition ${active === group ? 'border-blue-300/50 bg-blue-500/15 text-blue-100' : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'}`}>
              <div className="flex items-center gap-2"><span className="text-xs font-black uppercase tracking-wide">{group}</span>{blockers ? <Badge tone="red">{blockers}</Badge> : null}</div>
              <p className="mt-1 text-xs">{complete}/{items.length} complete</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
