"use client";
import { useParams } from "next/navigation";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditReviewRule } from "../hooks/useAuditReviewRules";

export function AuditReviewRuleFormPage({ mode = "new" }: { mode?: "new" | "view" | "edit" }) {
  const params = useParams<{ ruleId?: string }>();
  const ruleId = params.ruleId ?? "";
  const query = useAuditReviewRule(ruleId);
  if (mode !== "new" && query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (mode !== "new" && (query.error || !query.data)) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5">
    <AuditHeader title={mode === "new" ? "Create Review Rule" : query.data?.rule.rule_title ?? "Review Rule"} subtitle="Rule builder foundation with backend validation. Form submissions go through the Audit Review APIs." actionHref="/audit-compliance/review-approval/rules" actionLabel="All Rules" />
    <AuditCard title="Rule configuration">
      {mode === "new" ? <AuditEmptyState title="Rule form foundation" message="Create source module, trigger, stages, reviewer selection, validation checks, SLA, escalation, e-signature, auto-lock, and report-ready settings through the Review Rule API." /> : <pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs text-[var(--psm-muted)]">{JSON.stringify(query.data, null, 2)}</pre>}
    </AuditCard>
  </div></AuditLayout>;
}
