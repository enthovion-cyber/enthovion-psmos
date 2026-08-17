"use client";
import Link from "next/link";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditBadge, AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditReviewRules } from "../hooks/useAuditReviewRules";

export function AuditReviewRulesPage() {
  const query = useAuditReviewRules();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Review Rule Builder" subtitle="Rules define source module triggers, stages, reviewers, validation checks, SLA, escalation, lock, report readiness, and e-signature requirements." actionHref="/audit-compliance/review-approval/rules/new" actionLabel="Create Rule" /><AuditCard title="Approval rules">{query.data.rows.length ? <div className="grid gap-3">{query.data.rows.map((rule) => <Link key={rule.id} href={`/audit-compliance/review-approval/rules/${rule.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 hover:border-primary"><div className="flex flex-wrap justify-between gap-2"><div><b>{rule.rule_title}</b><p className="text-xs text-[var(--psm-muted)]">{rule.rule_code} · {rule.source_module} · {rule.trigger_event}</p></div><AuditBadge tone={rule.rule_status === "Active" ? "good" : "neutral"}>{rule.rule_status}</AuditBadge></div></Link>)}</div> : <AuditEmptyState title="No review rules" message="Create an approval rule to automate reviewer stages, validation, e-signature, SLA, and locking behavior." action={<AuditButton href="/audit-compliance/review-approval/rules/new">Create Rule</AuditButton>} />}</AuditCard></div></AuditLayout>;
}
