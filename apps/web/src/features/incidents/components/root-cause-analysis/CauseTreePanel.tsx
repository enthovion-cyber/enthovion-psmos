import { EvidenceSupportBadge } from '../shared/EvidenceSupportBadge';
import { RcaEmpty, RcaPanel } from './RcaPrimitives';

export function CauseTreePanel({ data, onCreateNode, onCreateEdge }: any) {
  const nodes = data?.nodes ?? [];
  return <RcaPanel title="Cause Tree / Causal Chain Panel" subtitle="Backend source of truth for causal chain nodes and relationships."><div className="mb-3 flex gap-2"><button className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white" onClick={onCreateNode}>Add Cause Tree Node</button><button className="rounded-lg border px-3 py-2 text-xs font-black dark:border-cyan-300/10" onClick={onCreateEdge}>Add Edge</button></div>{!nodes.length ? <RcaEmpty text="No cause tree nodes recorded." /> : <div className="grid gap-2 md:grid-cols-2">{nodes.map((node: any) => <div key={node.id} className="rounded-lg border border-slate-200 p-3 text-xs dark:border-cyan-300/10"><div className="flex justify-between gap-2"><b>{node.title}</b><span>{node.node_type}</span></div><p className="mt-1 text-slate-500">{node.description}</p><EvidenceSupportBadge value={node.evidence_support_level} /></div>)}</div>}<p className="mt-3 text-xs text-slate-500">Edges: {(data?.edges ?? []).length}</p></RcaPanel>;
}
