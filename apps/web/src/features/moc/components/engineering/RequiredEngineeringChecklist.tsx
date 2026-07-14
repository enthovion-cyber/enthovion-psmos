'use client';

import { CheckCircle2, CircleAlert, FileQuestion } from 'lucide-react';
import { Badge, DetailCard, EmptyState } from '../moc-detail-ui';

export function RequiredEngineeringChecklist({ requirements, onRegenerate, regenerating }: { requirements: any[]; onRegenerate: () => void; regenerating?: boolean }) {
  return (
    <DetailCard title="Required Engineering Checklist" action={<button type="button" onClick={onRegenerate} disabled={regenerating} className="rounded-md border border-blue-300/20 px-3 py-2 text-xs font-black text-blue-200 disabled:opacity-50">{regenerating ? 'Regenerating...' : 'Regenerate'}</button>}>
      {!requirements.length ? <EmptyState title="No engineering requirements generated" detail="Requirements are generated from change type, risk, impact assessment, equipment, safety systems, operating limits, and site policy." /> : (
        <div className="grid gap-2 lg:grid-cols-2">
          {requirements.map((item) => {
            const ready = item.status === 'Ready';
            const missing = item.status === 'Missing';
            return <div key={item.documentType} className="rounded-lg border border-white/10 bg-slate-950/35 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-2">
                  {ready ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" /> : missing ? <CircleAlert className="mt-0.5 h-4 w-4 text-red-300" /> : <FileQuestion className="mt-0.5 h-4 w-4 text-slate-400" />}
                  <div><p className="text-sm font-black text-white">{item.documentType}</p><p className="mt-1 text-xs leading-5 text-slate-400">{item.reason}</p></div>
                </div>
                <Badge tone={ready ? 'green' : missing ? 'red' : 'slate'}>{item.status}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                {item.requiredBeforeApproval ? <span>Before approval</span> : null}
                {item.requiredBeforeStartup ? <span>Before startup</span> : null}
                {item.requiredBeforeClosure ? <span>Before closure</span> : null}
                {item.allowJustification ? <span>Justification allowed</span> : <span>No justification override</span>}
              </div>
            </div>;
          })}
        </div>
      )}
    </DetailCard>
  );
}
