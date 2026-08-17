"use client";
import type { AuditFindingDetail } from "../types/audit-finding.types";
import { AuditButton, AuditCard, AuditEmptyState } from "../shared/AuditUi";
import { AuditFindingDuplicateBadge } from "../shared/AuditFindingDuplicateBadge";
import { useAuditFindingMutations } from "../hooks/useAuditFindingMutations";

export function AuditFindingDuplicateWarningPanel({ detail }: { detail: AuditFindingDetail }) {
  const mutations = useAuditFindingMutations(detail.finding.id);
  return (
    <AuditCard title="Duplicate / repeat detection foundation" action={<AuditButton disabled={mutations.checkDuplicates.isPending} title="Run backend duplicate/repeat check" onClick={() => mutations.checkDuplicates.mutate({})}>{mutations.checkDuplicates.isPending ? "Checking..." : "Run Duplicate Check"}</AuditButton>}>
      <div className="mb-3"><AuditFindingDuplicateBadge value={detail.finding.duplicate_repeat_status} /></div>
      {detail.duplicates.length ? detail.duplicates.map((row) => <div key={row.id} className="mb-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm text-[var(--psm-muted)]">{row.check_status}: {row.duplicate_repeat_status} · {Array.isArray(row.match_reasons_json) ? row.match_reasons_json.join("; ") : "No match reasons"}</div>) : <AuditEmptyState title="No duplicate check has run" message="Run duplicate/repeat detection after source, scope, and classification are saved." />}
    </AuditCard>
  );
}
