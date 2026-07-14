import { RcaEmpty, RcaPanel } from './RcaPrimitives';

export function UnsupportedAssumptionsPanel({ data, onCreate }: any) {
  const rows = data?.rows ?? [];
  return <RcaPanel title="Unsupported Assumptions / Hypotheses Panel" subtitle="Open assumptions must be resolved before completion."><button className="mb-3 rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white" onClick={onCreate}>Add Hypothesis</button>{!rows.length ? <RcaEmpty text="No unsupported assumptions or hypotheses." /> : <div className="grid gap-2">{rows.map((row: any) => <div key={row.id} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10"><div className="flex justify-between gap-2"><b>{row.hypothesis}</b><span>{row.status}</span></div><p className="text-slate-500">Evidence needed: {row.evidence_needed ?? '-'}</p><p className="text-slate-500">Owner: {row.owner_id ?? '-'} · Due: {row.due_date ?? '-'}</p></div>)}</div>}</RcaPanel>;
}
