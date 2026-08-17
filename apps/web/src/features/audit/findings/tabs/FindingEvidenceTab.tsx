import type { AuditFindingDetail } from "../../types/audit-finding.types";
import { AuditFindingEvidencePanel } from "../AuditFindingEvidencePanel";

export function FindingEvidenceTab({ detail }: { detail: AuditFindingDetail }) {
  return <AuditFindingEvidencePanel detail={detail} />;
}
