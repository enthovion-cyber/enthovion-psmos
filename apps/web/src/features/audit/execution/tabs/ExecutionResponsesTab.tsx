import type { AuditExecutionDetail } from "../../types/audit-execution.types";
import { ExecutionChecklistTab } from "./ExecutionChecklistTab";

export function ExecutionResponsesTab({ detail }: { detail: AuditExecutionDetail }) {
  return <ExecutionChecklistTab detail={detail} />;
}
