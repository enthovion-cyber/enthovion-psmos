import { LopaPanel, TonePill } from '../overview/LopaOverviewShared';

export function LinkedRecordsRelationshipMap({ relationshipMap }: { relationshipMap: any[] }) {
  return (
    <LopaPanel title="Relationship Map / Grouped View">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {relationshipMap.map((group) => (
          <div key={`${group.sourceModule}-${group.recordType}`} className="rounded-xl border border-cyan-300/10 bg-[#03101d] p-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-white">{group.sourceModule ?? 'Module'}</div>
              <TonePill>{group.count ?? 0} links</TonePill>
            </div>
            <div className="mt-2 text-sm text-slate-400">{group.recordType ?? 'Record'} - {group.relationshipType ?? 'Related'}</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-slate-900/70 p-2"><b className="block text-amber-200">{group.required ?? 0}</b>Required</div>
              <div className="rounded-lg bg-slate-900/70 p-2"><b className="block text-red-200">{group.blocking ?? 0}</b>Blocking</div>
              <div className="rounded-lg bg-slate-900/70 p-2"><b className="block text-blue-200">{group.changed ?? 0}</b>Changed</div>
            </div>
          </div>
        ))}
        {!relationshipMap.length ? <div className="text-sm text-slate-400">No linked record groups yet.</div> : null}
      </div>
    </LopaPanel>
  );
}
