'use client';

import { AlertTriangle, CheckCircle2, ExternalLink, PlayCircle, RotateCcw, ShieldCheck } from 'lucide-react';
import { Badge, DetailCard, EmptyState, Metric, MocButton, statusTone } from '../moc-detail-ui';

export function StartupReadinessSummaryCard({ data }: { data: any }) {
  const summary = data?.summary ?? {};
  return (
    <DetailCard title="Startup Readiness Summary">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
        <Metric label="Readiness" value={summary.startupReadinessStatus ?? '-'} tone={statusTone(summary.startupReadinessStatus)} />
        <Metric label="PSSR Required" value={summary.pssrRequired ? 'Yes' : 'No'} tone={summary.pssrRequired ? 'amber' : 'slate'} />
        <Metric label="Blockers" value={summary.startupBlockersCount ?? 0} tone={(summary.startupBlockersCount ?? 0) ? 'red' : 'green'} />
        <Metric label="Training" value={`${summary.trainingCompletionPercent ?? 0}%`} tone={(summary.trainingCompletionPercent ?? 0) === 100 ? 'green' : 'amber'} />
        <Metric label="Documents" value={`${summary.documentReadinessPercent ?? 0}%`} tone={(summary.documentReadinessPercent ?? 0) >= 90 ? 'green' : 'amber'} />
      </div>
      <div className="mt-4 grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 sm:grid-cols-2 md:grid-cols-4">
        <Info label="PSSR Status" value={summary.pssrStatus ?? '-'} />
        <Info label="Engineering Package" value={summary.engineeringPackageStatus ?? '-'} />
        <Info label="Last Readiness Check" value={summary.lastReadinessCheckDate ? new Date(summary.lastReadinessCheckDate).toLocaleString() : '-'} />
        <Info label="Released By" value={summary.releasedBy ?? '-'} />
      </div>
    </DetailCard>
  );
}

export function PSSRRequirementPanel({ pssr }: { pssr: any }) {
  const reasons = pssr?.trigger_reasons ?? (pssr?.trigger_reason ? String(pssr.trigger_reason).split(',').map((x) => x.trim()) : []);
  return (
    <DetailCard title="PSSR Requirement Panel">
      {pssr?.pssr_required || pssr?.required ? (
        <div className="space-y-2">
          {reasons.map((reason: string) => (
            <div key={reason} className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-sm font-bold text-amber-700 dark:text-amber-200">
              {reason}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="PSSR is not required for this MOC." />
      )}
    </DetailCard>
  );
}

export function LinkedPSSRRecordPanel({ linked, onTrigger, onSync }: { linked: any; onTrigger: () => void; onSync: () => void }) {
  return (
    <DetailCard title="Linked PSSR Record Panel">
      {linked ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <Info label="PSSR Number" value={linked.pssrNumber ?? linked.linkedPssrId ?? 'Placeholder requirement'} />
          <Info label="Status" value={linked.status ?? '-'} />
          <Info label="Owner" value={linked.ownerId ?? '-'} />
          <Info label="Checklist" value={`${linked.checklistCompletion ?? 0}%`} />
          <Info label="Open Punch Items" value={linked.openPunchItems ?? 0} />
          <Info label="Critical Punch Items" value={linked.criticalPunchItems ?? 0} />
        </div>
      ) : (
        <EmptyState title="No linked PSSR record." detail="Trigger PSSR to create the requirement placeholder or linked record." />
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <MocButton variant="primary" onClick={onTrigger} icon={<PlayCircle className="h-4 w-4" />}>
          Trigger PSSR
        </MocButton>
        <MocButton variant="outline" onClick={onSync} icon={<RotateCcw className="h-4 w-4" />}>
          Sync PSSR Status
        </MocButton>
        {linked?.linkedPssrId ? (
          <a
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3.5 py-2 text-xs font-bold text-[var(--psm-fg)] transition-all hover:bg-[var(--psm-surface)]"
            href={`/pssr/${linked.linkedPssrId}`}
          >
            <ExternalLink className="h-4 w-4" /> Open Linked PSSR
          </a>
        ) : null}
      </div>
    </DetailCard>
  );
}

export function StartupBlockersPanel({ blockers }: { blockers: any[] }) {
  return (
    <DetailCard title="Startup Blockers Panel">
      {blockers?.length ? (
        <div className="space-y-2">
          {blockers.map((blocker) => (
            <div key={blocker.id ?? blocker.blockerTitle} className="rounded-xl border border-red-500/25 bg-red-500/10 p-4">
              <div className="flex items-center justify-between">
                <p className="font-black text-red-700 dark:text-red-200">{blocker.blockerTitle}</p>
                <Badge tone="red">{blocker.severity}</Badge>
              </div>
              <p className="mt-1 text-sm text-red-600 dark:text-red-200/80">{blocker.blockerDescription}</p>
              <p className="mt-1 text-xs text-red-500 dark:text-red-300/70">{blocker.sourceModule} · {blocker.status}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No startup blockers." />
      )}
    </DetailCard>
  );
}

export function ReadinessChecklist({ checklist }: { checklist: any[] }) {
  const tone = (status: string) => status === 'green' ? 'green' : status === 'red' ? 'red' : status === 'amber' ? 'amber' : 'slate';
  return (
    <DetailCard title="Readiness Checklist">
      {checklist?.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {checklist.map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5">
              <div>
                <p className="font-bold text-[var(--psm-fg)]">{item.label}</p>
                <p className="text-xs text-[var(--psm-muted)]">{item.sourceModule} · {item.detail}</p>
              </div>
              <Badge tone={tone(item.status)}>{item.status}</Badge>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No checklist yet." />
      )}
    </DetailCard>
  );
}

export function RequiredActionsBeforeStartup({ actions, onCreate }: { actions: any[]; onCreate: () => void }) {
  return (
    <DetailCard
      title="Required Actions Before Startup"
      action={
        <MocButton variant="outline" onClick={onCreate} icon={<AlertTriangle className="h-4 w-4" />}>
          Create Blocker Action
        </MocButton>
      }
    >
      {actions?.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
              <tr>
                {['Action', 'Owner', 'Status', 'Evidence', 'Verification', 'Due', 'Blocking Reason'].map((h) => (
                  <th key={h} className="px-3 py-2.5 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {actions.map((action) => (
                <tr key={action.id} className="text-[var(--psm-fg)] transition-colors hover:bg-[var(--psm-surface-2)]">
                  <td className="px-3 py-3 font-semibold">{action.action_number ?? action.title ?? action.action_title}</td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{action.owner_id ?? '-'}</td>
                  <td className="px-3 py-3"><Badge tone={statusTone(action.status)}>{action.status}</Badge></td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{action.evidence_status ?? '-'}</td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{action.verification_status ?? '-'}</td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{action.due_date ?? '-'}</td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{action.blocking_reason ?? action.description ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No startup-required actions." />
      )}
    </DetailCard>
  );
}

export function TrainingReadinessPanel({ readiness }: { readiness: any }) {
  return (
    <DetailCard title="Training Readiness">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Training Required" value={readiness?.trainingRequired ? 'Yes' : 'No'} tone={readiness?.trainingRequired ? 'amber' : 'slate'} />
        <Metric label="Completed" value={readiness?.completionCount ?? 0} tone="green" />
        <Metric label="Pending" value={readiness?.pendingUsersRoles?.length ?? 0} tone={(readiness?.pendingUsersRoles?.length ?? 0) ? 'red' : 'green'} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(readiness?.affectedRoles ?? []).map((role: string) => (
          <Badge key={role} tone="blue">{role}</Badge>
        ))}
      </div>
    </DetailCard>
  );
}

export function DocumentReadinessPanel({ readiness }: { readiness: any }) {
  return (
    <DetailCard title="Document Readiness">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {['pidReadiness', 'sopReadiness', 'sdsPsiReadiness', 'engineeringDocumentReadiness'].map((key) => (
          <div key={key} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5">
            <p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">{key.replace(/([A-Z])/g, ' $1')}</p>
            <p className="mt-1 text-base font-black text-[var(--psm-fg)]">{String(readiness?.[key] ?? false)}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--psm-muted)]">Document Control status: <span className="font-bold text-[var(--psm-fg)]">{readiness?.documentControlStatus ?? '-'}</span></p>
    </DetailCard>
  );
}

export function EngineeringReadinessPanel({ readiness }: { readiness: any }) {
  return (
    <DetailCard title="Engineering Readiness">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
        {['engineeringPackageStatus', 'requiredCalculations', 'designBasis', 'sisDcsDocuments', 'datasheets'].map((key) => (
          <div key={key} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5">
            <p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">{key.replace(/([A-Z])/g, ' $1')}</p>
            <p className="mt-1 text-base font-black text-[var(--psm-fg)]">{String(readiness?.[key] ?? '-')}</p>
          </div>
        ))}
      </div>
    </DetailCard>
  );
}

export function StartupReleaseControls({ mutations, disabled }: { mutations: any; disabled?: boolean }) {
  return (
    <DetailCard title="Startup Approval / Release Controls">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MocButton
          variant="outline"
          disabled={disabled || mutations.runCheck.isPending}
          onClick={() => mutations.runCheck.mutate()}
          icon={<ShieldCheck className="h-4 w-4" />}
        >
          Run Readiness Check
        </MocButton>
        <MocButton
          variant="primary"
          disabled={disabled || mutations.readyForStartup.isPending}
          onClick={() => mutations.readyForStartup.mutate({ comment: 'Marked ready from startup readiness tab' })}
          icon={<CheckCircle2 className="h-4 w-4" />}
        >
          Mark Ready For Startup
        </MocButton>
        <MocButton
          variant="primary"
          disabled={disabled || mutations.releaseForStartup.isPending}
          onClick={() => mutations.releaseForStartup.mutate({ comment: 'Released for startup / operation' })}
          icon={<PlayCircle className="h-4 w-4" />}
        >
          Release For Startup
        </MocButton>
        <MocButton
          variant="danger"
          disabled={disabled || mutations.returnToImplementation.isPending}
          onClick={() => mutations.returnToImplementation.mutate({ reason: 'Returned from startup readiness tab' })}
          icon={<RotateCcw className="h-4 w-4" />}
        >
          Return To Implementation
        </MocButton>
      </div>
    </DetailCard>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">{label}</p>
      <p className="mt-1 font-bold text-[var(--psm-fg)]">{value ?? '-'}</p>
    </div>
  );
}
