"use client";
import { AuditLayout } from "../AuditLayout";
import { AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditExecutionWorkspace } from "../hooks/useAuditExecutionWorkspace";
import { AuditExecutionDetailHeader } from "./AuditExecutionDetailHeader";
import { ExecutionChecklistTab } from "./tabs/ExecutionChecklistTab";

export function AuditExecutionWorkspacePage({ id }: { id: string }) {
  const query = useAuditExecutionWorkspace(id);
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditExecutionDetailHeader execution={query.data.execution} /><ExecutionChecklistTab detail={query.data} workspace /></div></AuditLayout>;
}
