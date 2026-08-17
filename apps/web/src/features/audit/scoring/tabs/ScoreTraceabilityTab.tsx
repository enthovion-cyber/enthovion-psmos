import { AuditScoreTraceabilityPanel } from "../AuditScoreTraceabilityPanel";
export function ScoreTraceabilityTab({ detail }: { detail: Record<string, any> }) { return <AuditScoreTraceabilityPanel traceability={detail.traceability} />; }
