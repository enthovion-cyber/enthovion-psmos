import type { AuditFindingDetail } from "../../types/audit-finding.types";
import { AuditFindingOwnershipPanel } from "../AuditFindingOwnershipPanel";

export function FindingOwnershipTab({ detail }: { detail: AuditFindingDetail }) {
  return <AuditFindingOwnershipPanel detail={detail} />;
}
