import { AuditScoreExplainabilityPanel } from "../AuditScoreExplainabilityPanel";
export function ScoreExplainabilityTab({ detail }: { detail: Record<string, any> }) { return <AuditScoreExplainabilityPanel explainability={detail.explainability} />; }
