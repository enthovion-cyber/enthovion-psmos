const tabs = [
  ['overview', 'Overview'],
  ['scenario', 'Scenario & Consequence'],
  ['initiating-event', 'Initiating Event'],
  ['ipls', 'IPLs / Safeguards'],
  ['risk-calculation', 'Risk Calculation'],
  ['sil', 'SIL Determination / SIF Specification'],
  ['actions', 'Recommendations / Actions'],
  ['team-sessions', 'Team & Sessions'],
  ['linked-records', 'Linked Records'],
  ['review', 'Review & Sign-Off'],
  ['attachments', 'Attachments'],
  ['history', 'History'],
  ['final-report', 'Final Report / Export']
] as const;

export function LopaDetailTabs({ active, onChange, indicators }: { active: string; onChange: (tab: string) => void; indicators?: Record<string, string | number | undefined> }) {
  return (
    <nav className="flex overflow-x-auto rounded-xl border border-cyan-300/10 bg-[#071525] p-1">
      {tabs.map(([key, label]) => (
        <button key={key} onClick={() => onChange(key)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition ${active === key ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/20' : 'text-slate-400 hover:bg-blue-500/10 hover:text-slate-100'}`}>
          {label}
          {indicators?.[key] !== undefined ? <span className="ml-2 rounded bg-slate-900/60 px-1.5 py-0.5 text-[10px] text-slate-200">{indicators[key]}</span> : null}
        </button>
      ))}
    </nav>
  );
}

export function LopaComingSoonTab({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-cyan-300/10 bg-[#071525] p-8 text-center">
      <div className="text-lg font-bold text-white">{title}</div>
      <div className="mt-2 text-sm text-slate-400">This tab is reserved for the next LOPA/SIL phase. No placeholder data is shown.</div>
    </div>
  );
}

export const lopaDetailTabs = tabs;
