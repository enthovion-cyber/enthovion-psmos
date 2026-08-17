"use client";
import { AuditLayout } from "../AuditLayout";
import {
  AuditButton,
  AuditCard,
  AuditErrorState,
  AuditLoadingState,
} from "../shared/AuditUi";
import { useAuditChecklistDashboard } from "../hooks/useAuditChecklistDashboard";
import { AuditChecklistSummaryCards } from "./AuditChecklistSummaryCards";
export function AuditChecklistDashboardPage() {
  const q = useAuditChecklistDashboard();
  if (q.isLoading)
    return (
      <AuditLayout>
        <AuditLoadingState />
      </AuditLayout>
    );
  if (q.error || !q.data)
    return (
      <AuditLayout>
        <AuditErrorState message={q.error} onRetry={() => q.refetch()} />
      </AuditLayout>
    );
  const d = q.data;
  return (
    <AuditLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">
              Audit / Compliance Assurance
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Checklist Builder Dashboard
            </h1>
            <p className="mt-2 text-sm text-[var(--psm-muted)]">
              Template health, critical controls, plan assignment gaps, and
              execution readiness from backend data.
            </p>
          </div>
          <AuditButton href="/audit-compliance/checklists/templates/new">
            Create Checklist Template
          </AuditButton>
        </div>
        <AuditChecklistSummaryCards summary={d.summary} />
        <div className="grid gap-4 xl:grid-cols-2">
          <AuditCard title="Plans missing checklist">
            {d.plansMissingChecklist.length ? (
              d.plansMissingChecklist.slice(0, 8).map((p) => (
                <p
                  key={p.id}
                  className="border-b border-[var(--psm-line)] py-2 text-sm"
                >
                  {p.plan_code} · {p.plan_title}
                </p>
              ))
            ) : (
              <p className="text-sm text-[var(--psm-muted)]">
                No missing plan assignments.
              </p>
            )}
          </AuditCard>
          <AuditCard title="Configuration gaps">
            {d.configurationGaps.length ? (
              d.configurationGaps.slice(0, 8).map((c) => (
                <p
                  key={c.id}
                  className="border-b border-[var(--psm-line)] py-2 text-sm"
                >
                  {c.checklist_code} · {c.readiness_health}
                </p>
              ))
            ) : (
              <p className="text-sm text-[var(--psm-muted)]">
                No checklist configuration gaps.
              </p>
            )}
          </AuditCard>
          <AuditCard title="Templates by status">
            {d.byStatus.map((x) => (
              <div
                key={x.label}
                className="flex justify-between border-b border-[var(--psm-line)] py-2 text-sm"
              >
                <span>{x.label}</span>
                <strong>{x.value}</strong>
              </div>
            ))}
          </AuditCard>
          <AuditCard title="Recently updated">
            {d.recent.map((c) => (
              <p
                key={c.id}
                className="border-b border-[var(--psm-line)] py-2 text-sm"
              >
                {c.checklist_code} · {c.checklist_title}
              </p>
            ))}
          </AuditCard>
        </div>
      </div>
    </AuditLayout>
  );
}
