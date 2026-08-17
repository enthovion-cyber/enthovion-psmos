import { AuditCard } from "../../shared/AuditUi";
import { AuditScoreBreakdownPanel } from "../AuditScoreBreakdownPanel";
import { AuditScoreCriticalBlockersPanel } from "../AuditScoreCriticalBlockersPanel";
import { AuditScoreEvidenceImpactPanel } from "../AuditScoreEvidenceImpactPanel";
import { AuditScoreFindingImpactPanel } from "../AuditScoreFindingImpactPanel";
import { AuditScoreCapaImpactPanel } from "../AuditScoreCapaImpactPanel";
import { ScoreInputSnapshotTab } from "./ScoreInputSnapshotTab";
import { ScoreResultsTab } from "./ScoreResultsTab";
import { ScoreExplainabilityTab } from "./ScoreExplainabilityTab";
import { ScoreTraceabilityTab } from "./ScoreTraceabilityTab";
import { ScoreAdjustmentsTab } from "./ScoreAdjustmentsTab";
import { ScoreHistoryTab } from "./ScoreHistoryTab";

export function ScoreRunOverviewTab({ detail, activeTab = "overview" }: { detail: Record<string, any>; activeTab?: string }) {
  if (activeTab === "input-snapshot") return <ScoreInputSnapshotTab detail={detail} />;
  if (activeTab === "results") return <ScoreResultsTab detail={detail} />;
  if (activeTab === "explainability") return <ScoreExplainabilityTab detail={detail} />;
  if (activeTab === "traceability") return <ScoreTraceabilityTab detail={detail} />;
  if (activeTab === "adjustments") return <ScoreAdjustmentsTab detail={detail} />;
  if (activeTab === "history") return <ScoreHistoryTab detail={detail} />;
  return <div className="grid gap-5 xl:grid-cols-2"><AuditScoreBreakdownPanel detail={detail} /><AuditScoreCriticalBlockersPanel blockers={detail.readiness?.blockers ?? []} /><AuditScoreEvidenceImpactPanel impact={detail.scoreRun.evidence_impact_json} /><AuditScoreFindingImpactPanel impact={detail.scoreRun.finding_impact_json} /><AuditScoreCapaImpactPanel impact={detail.scoreRun.capa_impact_json} /><AuditCard title="Calculation trace"><Json value={detail.scoreRun.calculation_trace_json} /></AuditCard></div>;
}
export function Json({ value }: { value: unknown }) { return <pre className="max-h-[420px] overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(value ?? {}, null, 2)}</pre>; }
