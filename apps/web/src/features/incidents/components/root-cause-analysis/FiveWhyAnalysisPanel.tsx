import { EvidenceSupportBadge } from '../shared/EvidenceSupportBadge';
import { RcaEmpty, RcaPanel } from './RcaPrimitives';

export function FiveWhyAnalysisPanel({ data, onCreateChain, onCreateStep }: any) {
  const chains = data?.chains ?? [];
  return <RcaPanel title="5-Why Analysis Panel" subtitle="Problem statement, why chain, evidence, and root cause conclusion."><div className="mb-3 flex gap-2"><button className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white" onClick={onCreateChain}>Add 5-Why Chain</button><button className="rounded-lg border px-3 py-2 text-xs font-black dark:border-cyan-300/10" onClick={onCreateStep}>Add Why Step</button></div>{!chains.length ? <RcaEmpty text="No 5-Why chains captured." /> : <div className="grid gap-3">{chains.map((chain: any) => <div key={chain.id} className="rounded-lg border border-slate-200 p-3 text-xs dark:border-cyan-300/10"><div className="flex justify-between gap-2"><b>{chain.problem_statement ?? 'Problem statement missing'}</b><EvidenceSupportBadge value={chain.evidence_support_level} /></div><ol className="mt-2 grid gap-1">{(chain.steps ?? []).map((step: any) => <li key={step.id}>{step.step_number}. {step.why_statement}</li>)}</ol><p className="mt-2 text-slate-500">Conclusion: {chain.root_cause_conclusion ?? '-'}</p></div>)}</div>}</RcaPanel>;
}
