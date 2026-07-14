import { OverviewEmptyState } from './OverviewEmptyState';
import { OverviewPanelShell, tabKey } from './OverviewPanelShell';
export function OpenBlockersNextStepsPanel({ data }: { data?: { blockers?: any[]; nextSteps?: any[] } }) {
  return <OverviewPanelShell title="Open Blockers / Next Steps Panel" subtitle="Backend-generated blockers link to the relevant investigation section."><div className="grid gap-2">{data?.blockers?.length ? data.blockers.map((blocker) => <div key={blocker.title} className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-2 text-xs"><b>{blocker.title}</b><div className="text-slate-500">{blocker.section}</div></div>) : <OverviewEmptyState message="No blockers reported by the backend readiness engine."/>}</div><div className="mt-3 grid gap-2">{(data?.nextSteps ?? []).map((step) => <button key={step.title} type="button" onClick={() => selectIncidentTab(tabKey(step.section))} className="rounded-lg border border-slate-200 p-2 text-left text-xs hover:border-blue-400 dark:border-cyan-300/10">{step.action ?? step.title}</button>)}</div></OverviewPanelShell>;
}

function selectIncidentTab(tabKey: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('incident:select-tab', { detail: { tabKey } }));
}
