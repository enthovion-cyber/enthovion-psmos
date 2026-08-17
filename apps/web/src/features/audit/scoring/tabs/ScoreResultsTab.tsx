import { AuditCard } from "../../shared/AuditUi";
import { AuditScoreContributionTable } from "../AuditScoreContributionTable";
export function ScoreResultsTab({ detail }: { detail: Record<string, any> }) { return <div className="space-y-5"><AuditCard title="Score result JSON"><pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(detail.scoreRun.score_result_json ?? {}, null, 2)}</pre></AuditCard><AuditScoreContributionTable rows={detail.components ?? []} /></div>; }
