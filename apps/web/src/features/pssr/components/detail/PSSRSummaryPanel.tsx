'use client';

import { Badge, ProgressBar, PSSRCard } from '../pssr-ui';

export function PSSRSummaryPanel({ pssr, onTransition, onGenerateChecklist, onSyncMoc }: { pssr: any; onTransition: (action: string) => void; onGenerateChecklist?: () => void; onSyncMoc?: () => void }) {
  const s = pssr.summary ?? {};
  const actions = ['submit', 'start-preparation', 'start-review', 'start-field-verification', 'mark-ready-for-authorization', 'authorize-startup', 'release-startup', 'close', 'cancel'];
  return (
    <div className="space-y-4">
      <PSSRCard title="Startup Readiness">
        <div className="text-center"><p className="text-4xl font-black text-white">{s.readinessPercent ?? pssr.readiness_percent ?? 0}%</p><p className="text-sm text-slate-400">{pssr.readiness_status}</p></div>
        <div className="mt-4"><ProgressBar value={s.readinessPercent ?? 0} tone={(s.readinessPercent ?? 0) > 85 ? 'green' : (s.readinessPercent ?? 0) > 60 ? 'amber' : 'red'} /></div>
      </PSSRCard>
      <PSSRCard title="Readiness Summary">
        <div className="space-y-2 text-sm">
          <Row label="Checklist" value={`${s.checklistCompletion ?? 0}%`} />
          <Row label="Category A Punch" value={s.categoryAOpen ?? 0} tone={s.categoryAOpen ? 'red' : 'green'} />
          <Row label="Category B Punch" value={s.categoryBOpen ?? 0} tone={s.categoryBOpen ? 'amber' : 'green'} />
          <Row label="Training" value={`${s.trainingReadiness ?? 0}%`} />
          <Row label="Documents" value={`${s.documentReadiness ?? 0}%`} />
          <Row label="Testing" value={`${s.testingReadiness ?? 0}%`} />
          <Row label="MOC Blockers" value={s.linkedMocStartupBlockers ?? 0} tone={s.linkedMocStartupBlockers ? 'red' : 'green'} />
          <Row label="Authorization" value={pssr.authorization_status} />
        </div>
      </PSSRCard>
      <PSSRCard title="Quick Actions">
        <div className="grid gap-2">
          <button onClick={onGenerateChecklist} className="rounded-md border border-cyan-300/15 bg-blue-500/10 px-3 py-2 text-left text-sm font-bold text-blue-100">generate checklist</button>
          {pssr.linkedMoc ? <button onClick={onSyncMoc} className="rounded-md border border-cyan-300/15 bg-amber-500/10 px-3 py-2 text-left text-sm font-bold text-amber-100">sync linked MOC</button> : null}
          {actions.map((action) => <button key={action} onClick={() => onTransition(action)} disabled={['Closed', 'Cancelled'].includes(pssr.status) && !['cancel'].includes(action)} className="rounded-md border border-cyan-300/15 bg-white/[0.03] px-3 py-2 text-left text-sm font-bold text-slate-200 disabled:opacity-40">{action.replaceAll('-', ' ')}</button>)}
        </div>
      </PSSRCard>
    </div>
  );
}

function Row({ label, value, tone = 'blue' }: { label: string; value: any; tone?: any }) {
  return <div className="flex items-center justify-between border-b border-white/5 py-2"><span className="text-slate-400">{label}</span><Badge tone={tone}>{value}</Badge></div>;
}
