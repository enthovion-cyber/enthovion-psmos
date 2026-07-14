import { LopaPanel } from '../overview/LopaOverviewShared';

export function LinkEvidencePanel({ evidence }: { evidence: any[] }) {
  return (
    <LopaPanel title="Link Evidence">
      <div className="space-y-2">
        {evidence.map((item) => <div key={item.id ?? item.title} className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-3 text-sm"><b className="text-white">{item.title ?? item.fileName ?? 'Evidence'}</b><div className="mt-1 text-slate-400">{item.description ?? item.category ?? 'Linked evidence record'}</div></div>)}
        {!evidence.length ? <div className="text-sm text-slate-400">No linked-record evidence attached yet.</div> : null}
      </div>
    </LopaPanel>
  );
}
