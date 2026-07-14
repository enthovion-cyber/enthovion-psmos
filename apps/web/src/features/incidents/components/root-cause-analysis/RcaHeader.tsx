import { RcaMethodBadge } from '../shared/RcaMethodBadge';
import { RcaStatusBadge } from '../shared/RcaStatusBadge';
import { RcaActionButton } from './RcaPrimitives';

export function RcaHeader({ data, saving, message, onAddFactor, onAddRootCause, onSelectMethod, onReadiness, onRequestReview, onCreateCapa, onSaveChanges, onRefresh }: any) {
  const h = data?.header ?? {};
  const actions = Object.fromEntries((data?.actions ?? []).map((a: any) => [a.key, a]));
  const disabled = (key: string) => !actions[key]?.enabled || saving;
  const title = (key: string) => actions[key]?.disabledReason ?? actions[key]?.label;
  return <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-cyan-300/10 dark:bg-[#071525]">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-black">Root Cause Analysis</h2><RcaStatusBadge value={h.rcaStatus} /><RcaMethodBadge value={h.selectedMethod} /></div>
        <p className="mt-1 text-sm text-slate-500">{h.incidentNumber} · {h.incidentTitle}</p>
        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {[
            ['Study status', h.incidentStatus], ['Priority', h.investigationPriority], ['Level', h.investigationLevel], ['RCA required', h.rcaRequired ? 'Yes' : 'No'],
            ['RCA lead', h.rcaLead], ['Team', h.investigationTeamStatus], ['Confirmed factors', h.confirmedCausalFactors], ['Root causes', h.rootCausesIdentified],
            ['Open hypotheses', h.openHypotheses], ['Missing evidence', h.causesMissingEvidence], ['CAPA mapping', h.capaMappingStatus], ['Review', h.reviewStatus]
          ].map(([label, value]) => <div key={String(label)} className="rounded-lg border border-slate-200 px-2 py-1.5 dark:border-cyan-300/10"><div className="text-[10px] uppercase text-slate-500">{label}</div><div className="font-black">{String(value ?? '-')}</div></div>)}
        </div>
        {message ? <div className="mt-3 rounded-lg border border-blue-400/25 bg-blue-500/10 p-2 text-xs text-blue-700 dark:text-blue-200">{message}</div> : null}
      </div>
      <div className="flex flex-wrap gap-2 xl:justify-end">
        <RcaActionButton label="Add Causal Factor" disabled={disabled('add-causal-factor')} title={title('add-causal-factor')} onClick={onAddFactor} />
        <RcaActionButton label="Add Root Cause" disabled={disabled('add-root-cause')} title={title('add-root-cause')} onClick={onAddRootCause} />
        <RcaActionButton label="Select RCA Method" disabled={disabled('select-method')} title={title('select-method')} onClick={onSelectMethod} />
        <RcaActionButton label="Run RCA Readiness Check" disabled={disabled('readiness-check')} title={title('readiness-check')} onClick={onReadiness} />
        <RcaActionButton label="Request RCA Review" disabled={disabled('request-review')} title={title('request-review')} onClick={onRequestReview} />
        <RcaActionButton label="Create CAPA from Root Cause" disabled={disabled('create-capa')} title={title('create-capa')} onClick={onCreateCapa} />
        <RcaActionButton label="Save Changes" disabled={saving} onClick={onSaveChanges} />
        <RcaActionButton label="Refresh" disabled={saving} onClick={onRefresh} />
      </div>
    </div>
  </section>;
}
