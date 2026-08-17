"use client";
import { useRouter } from "next/navigation";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditFindingConversion } from "../hooks/useAuditFindingConversion";
import { useAuditFindingMutations } from "../hooks/useAuditFindingMutations";

export function AuditFindingConvertFromFieldPage({ executionId, fieldFindingId }: { executionId?: string; fieldFindingId?: string }) {
  const router = useRouter();
  const query = useAuditFindingConversion(executionId ? { executionId } : {});
  const mutations = useAuditFindingMutations();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const rows = Array.isArray((query.data as any).rows) ? (query.data as any).rows : [];
  const convert = async (row: any) => {
    const saved = await mutations.convert.mutateAsync({ executionId: row.execution_id, fieldFindingId: row.id, payload: {} });
    router.push(`/audit-compliance/findings/${saved.finding.id}`);
  };
  return (
    <AuditLayout>
      <div className="space-y-5">
        <AuditHeader title="Convert Field Finding" subtitle="Create a formal source-linked finding from audit execution field findings without duplicating execution data." />
        <AuditCard title="Field findings ready for register">
          {rows.length ? <div className="grid gap-3">{rows.filter((row: any) => !fieldFindingId || row.id === fieldFindingId).map((row: any) => <div key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-[var(--psm-fg)]">{row.finding_title}</h3><p className="mt-1 text-sm text-[var(--psm-muted)]">{row.finding_description}</p><p className="mt-2 text-xs text-[var(--psm-muted)]">Execution {row.execution_id} · {row.criticality} · {row.field_finding_status}</p></div><AuditButton disabled={row.converted_to_finding_register || mutations.convert.isPending} title={row.converted_to_finding_register ? "Already converted." : "Convert to formal finding"} onClick={() => convert(row)}>{row.converted_to_finding_register ? "Converted" : "Convert"}</AuditButton></div></div>)}</div> : <AuditEmptyState title="No convertible field findings" message="The backend did not return audit execution field findings for this scope." />}
        </AuditCard>
      </div>
    </AuditLayout>
  );
}
