import { LopaPanel, TonePill } from '../overview/LopaOverviewShared';

export function LinkedActionsPanel({ actions }: { actions: any[] }) {
  return <LopaPanel title="Linked Actions Panel"><div className="grid gap-2">{actions.length ? actions.slice(0, 8).map((action) => <div key={action.id} className="flex items-center justify-between rounded-lg border border-cyan-300/10 bg-[#03101d] p-3 text-sm"><div><b className="text-white">{action.actionNumber ?? action.id}</b><div className="text-slate-400">{action.title}</div></div><TonePill>{action.status}</TonePill></div>) : <div className="text-sm text-slate-400">No linked actions yet.</div>}</div></LopaPanel>;
}
