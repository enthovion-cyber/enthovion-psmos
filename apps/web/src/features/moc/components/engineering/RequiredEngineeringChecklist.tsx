'use client';

import { CheckCircle2, CircleAlert, FileQuestion } from 'lucide-react';
import { Badge, DetailCard, EmptyState, MocButton } from '../moc-detail-ui';

export function RequiredEngineeringChecklist({ requirements, onRegenerate, regenerating }: { requirements: any[]; onRegenerate: () => void; regenerating?: boolean }) {
  return (
    <DetailCard
      title="Required Engineering Checklist"
      action={
        <MocButton variant="outline" onClick={onRegenerate} disabled={regenerating}>
          {regenerating ? 'Regenerating...' : 'Regenerate'}
        </MocButton>
      }
    >
      {!requirements.length ? (
        <EmptyState title="No engineering requirements generated" detail="Requirements are generated from change type, risk, impact assessment, equipment, safety systems, operating limits, and site policy." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {requirements.map((item) => {
            const ready = item.status === 'Ready';
            const missing = item.status === 'Missing';
            return (
              <div key={item.documentType} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-2.5">
                    {ready ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
                    ) : missing ? (
                      <CircleAlert className="mt-0.5 h-4 w-4 text-red-500 shrink-0" />
                    ) : (
                      <FileQuestion className="mt-0.5 h-4 w-4 text-[var(--psm-muted)] shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-black text-[var(--psm-fg)]">{item.documentType}</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--psm-muted)]">{item.reason}</p>
                    </div>
                  </div>
                  <Badge tone={ready ? 'green' : missing ? 'red' : 'slate'}>{item.status}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-[var(--psm-muted)]">
                  {item.requiredBeforeApproval ? <span className="rounded bg-[var(--psm-surface)] px-1.5 py-0.5 border border-[var(--psm-line)]">Before approval</span> : null}
                  {item.requiredBeforeStartup ? <span className="rounded bg-[var(--psm-surface)] px-1.5 py-0.5 border border-[var(--psm-line)]">Before startup</span> : null}
                  {item.requiredBeforeClosure ? <span className="rounded bg-[var(--psm-surface)] px-1.5 py-0.5 border border-[var(--psm-line)]">Before closure</span> : null}
                  {item.allowJustification ? <span className="text-emerald-600 dark:text-emerald-400">Justification allowed</span> : <span>No justification override</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DetailCard>
  );
}
