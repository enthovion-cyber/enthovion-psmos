'use client';

import { CheckCircle2, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';

const checkLabels: Record<string, string> = {
  requiredDisciplinesAssigned: 'Required disciplines assigned',
  requiredSessionsCompleted: 'Required sessions completed',
  requiredAttendanceComplete: 'Required attendance complete',
  minutesCompleted: 'Minutes completed',
  requiredSessionActionsClosed: 'Required session actions closed',
  requiredTeamMembersActive: 'Required team members active',
  requiredReviewCommentsResolved: 'Required review comments resolved'
};

export function HazopTeamSignoffReadinessPanel({ readiness }: { readiness?: any }) {
  const status = readiness?.status ?? 'Checking';
  const tone = status === 'Ready' ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200' : status === 'Warning' ? 'border-amber-400/40 bg-amber-500/10 text-amber-200' : 'border-red-400/40 bg-red-500/10 text-red-200';
  const checks = readiness?.checks ?? {};
  return (
    <section className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Team Sign-off Readiness</h3>
          <p className="text-xs opacity-75">Feeds Review & Sign-Off readiness.</p>
        </div>
        {status === 'Ready' ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
      </div>
      <div className="mt-4 text-3xl font-semibold">{status}</div>

      <div className="mt-4 space-y-2">
        {Object.entries(checkLabels).map(([key, label]) => {
          const passed = Boolean(checks[key]);
          return (
            <div key={key} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-xs">
              <span>{label}</span>
              {passed ? <CheckCircle2 size={15} className="text-emerald-200" /> : <XCircle size={15} className="text-red-200" />}
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-2 text-sm">
        {(readiness?.blockers ?? []).map((item: string) => <div key={item} className="rounded-md bg-red-500/10 px-2 py-1">Blocker: {item}</div>)}
        {(readiness?.warnings ?? []).map((item: string) => <div key={item} className="rounded-md bg-amber-500/10 px-2 py-1">Warning: {item}</div>)}
        {!(readiness?.blockers?.length || readiness?.warnings?.length) ? <div className="rounded-md bg-emerald-500/10 px-2 py-1">Ready for the Review & Sign-Off readiness feed.</div> : null}
      </div>
    </section>
  );
}
