import { RcaActionButton, RcaEmpty, RcaPanel } from './RcaPrimitives';

export function RcaToCapaPreviewPanel({ data, onCreate }: any) {
  const rows = data?.rows ?? [];
  return <RcaPanel title="RCA to CAPA Mapping Preview Panel" subtitle={`Status: ${data?.status ?? 'Unknown'}`}>{!rows.length ? <RcaEmpty text="No root causes available for CAPA mapping." /> : <div className="grid gap-2">{rows.map((row: any) => <div key={row.rootCauseId} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10"><div className="flex justify-between gap-2"><b>{row.rootCauseStatement}</b><span>{row.status}</span></div><p className="text-slate-500">{row.capaRecommendation ?? row.universalActionId ?? 'No CAPA recommendation or action link yet.'}</p>{row.status !== 'Mapped' ? <RcaActionButton label="Create CAPA" onClick={() => onCreate(row.rootCauseId)} /> : null}</div>)}</div>}</RcaPanel>;
}
